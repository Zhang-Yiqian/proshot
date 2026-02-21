import { createClient } from '@supabase/supabase-js'

/**
 * 服务端管理员客户端（使用 service_role key，绕过 RLS，仅在服务端使用）
 * 用于自建短信 OTP 验证后创建用户、生成登录 token 等管理员操作
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('缺少 Supabase 环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
