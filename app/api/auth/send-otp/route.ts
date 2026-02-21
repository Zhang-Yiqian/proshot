import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOtpSms } from '@/lib/sms/sender'

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isValidChinesePhone(phone: string): boolean {
  return /^\+861[3-9]\d{9}$/.test(phone)
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || !isValidChinesePhone(phone)) {
      return NextResponse.json(
        { success: false, error: '请输入正确的+86中国大陆手机号' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // 频率限制：同一手机号 60 秒内只能发一次
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recent } = await admin
      .from('sms_otps')
      .select('created_at')
      .eq('phone', phone)
      .eq('used', false)
      .gte('created_at', oneMinuteAgo)
      .limit(1)

    if (recent && recent.length > 0) {
      return NextResponse.json(
        { success: false, error: '发送太频繁，请60秒后重试' },
        { status: 429 }
      )
    }

    // 生成验证码并写入数据库
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: insertError } = await admin.from('sms_otps').insert({
      phone,
      otp,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error('[send-otp] 写入验证码失败:', insertError)
      return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
    }

    // 发送短信（开发模式下返回 OTP 方便测试）
    const devOtp = await sendOtpSms(phone, otp)

    const response: Record<string, unknown> = { success: true }
    // 仅开发模式（未配置短信服务时）将验证码附在响应里，生产环境不返回
    if (devOtp) {
      response.devOtp = devOtp
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[send-otp] 错误:', err)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
