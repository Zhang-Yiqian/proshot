/**
 * 生成记录查询API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserGenerations } from '@/lib/db/generations'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const generations = await getUserGenerations(user.id)

    return NextResponse.json({
      success: true,
      generations,
    })
  } catch (error) {
    console.error('查询记录失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
