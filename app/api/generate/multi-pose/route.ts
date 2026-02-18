/**
 * 多姿势图生成 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMultiPoseImages } from '@/lib/ai/gemini-client'
import { getUserProfile } from '@/lib/db/profiles'
import { MODEL_CONFIG } from '@/config/models'

export async function POST(request: NextRequest) {
  console.log('=== [API] 开始处理多姿势图生成请求 ===')
  try {
    // 解析请求
    const { mainImageUrl } = await request.json()

    if (!mainImageUrl) {
      return NextResponse.json(
        { success: false, error: '参数缺失: mainImageUrl' },
        { status: 400 }
      )
    }

    console.log('[API] Mock 模式状态:', MODEL_CONFIG.mockMode)

    // Mock 模式：跳过用户验证，直接调用 AI
    if (MODEL_CONFIG.mockMode) {
      console.log('[API] 使用 Mock 模式，直接调用多姿势图生成')
      const result = await generateMultiPoseImages(mainImageUrl)

      if (result.success && result.imageUrls && result.imageUrls.length > 0) {
        return NextResponse.json({ success: true, imageUrls: result.imageUrls })
      } else {
        return NextResponse.json(
          { success: false, error: result.error || '生成多姿势图失败' },
          { status: 500 }
        )
      }
    }

    // 正常模式：验证用户
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json({ success: false, error: '用户资料不存在' }, { status: 404 })
    }

    console.log('[API] 用户验证成功:', user.id)

    // 调用 AI 生成多姿势图
    const result = await generateMultiPoseImages(mainImageUrl)

    if (result.success && result.imageUrls && result.imageUrls.length > 0) {
      return NextResponse.json({
        success: true,
        imageUrls: result.imageUrls,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error || '生成多姿势图失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API] 多姿势图生成API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
