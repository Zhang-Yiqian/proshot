import { NextRequest, NextResponse } from 'next/server'

// 简单的内存频率限制：每个 IP 每分钟最多请求 5 次
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= 5) return false

  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    )
  }

  const contact = process.env.CONTACT_WECHAT
  if (!contact) {
    return NextResponse.json(
      { success: false, error: '联系方式未配置' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, wechat: contact })
}
