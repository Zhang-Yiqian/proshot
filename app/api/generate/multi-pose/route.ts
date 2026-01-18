/**
 * 多视角生成 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMultiPoseImages } from '@/lib/ai/gemini-client'
import { getUserProfile } from '@/lib/db/profiles'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 验证积分（暂不扣除，后续可添加）
    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json({ success: false, error: '用户资料不存在' }, { status: 404 })
    }

    // 解析请求
    const { mainImageUrl } = await request.json()

    if (!mainImageUrl) {
      return NextResponse.json(
        { success: false, error: '参数缺失: mainImageUrl' },
        { status: 400 }
      )
    }

    // 调用 AI 生成多视角图
    const result = await generateMultiPoseImages(mainImageUrl)

    if (result.success && result.imageUrls && result.imageUrls.length > 0) {
      return NextResponse.json({
        success: true,
        imageUrls: result.imageUrls,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || '生成多视角图失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('多视角生成API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
