import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * 将手机号转换为派生邮箱（用于 Supabase 邮箱账号体系）
 * 例：+8613800138000 → 8613800138000@phone.proshot.internal
 */
function phoneToEmail(phone: string): string {
  return `${phone.replace('+', '')}@phone.proshot.internal`
}

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: '参数缺失' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // 查找最新未使用且未过期的验证码
    const now = new Date().toISOString()
    const { data: otpRecord, error: queryError } = await admin
      .from('sms_otps')
      .select('id, otp, expires_at, used')
      .eq('phone', phone)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (queryError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: '验证码不存在或已过期' },
        { status: 400 }
      )
    }

    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { success: false, error: '验证码错误' },
        { status: 400 }
      )
    }

    // 标记验证码已使用
    await admin.from('sms_otps').update({ used: true }).eq('id', otpRecord.id)

    // 派生邮箱（作为 Supabase 账号唯一标识）
    const email = phoneToEmail(phone)

    // 尝试创建新用户（已存在时会报错，忽略即可）
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { phone },
    })

    // 生成魔法链接 token（不管用户是新建还是已有，都能成功）
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('[verify-otp] 生成登录 token 失败:', linkError)
      return NextResponse.json(
        { success: false, error: '登录失败，请重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tokenHash: linkData.properties.hashed_token,
      email,
    })
  } catch (err) {
    console.error('[verify-otp] 错误:', err)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
