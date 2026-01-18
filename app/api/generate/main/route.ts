/**
 * 主图生成 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateClothingImage, generateProductImage } from '@/lib/ai/gemini-client'
import { SCENE_PRESETS } from '@/config/presets'
import { createGeneration, updateGenerationStatus } from '@/lib/db/generations'
import { getUserProfile, createUserProfile } from '@/lib/db/profiles'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 确保 Profile 存在
    let profile = await getUserProfile(user.id)
    if (!profile) {
      profile = await createUserProfile(user.id)
      if (!profile) {
        return NextResponse.json(
          { success: false, error: '创建用户资料失败' },
          { status: 500 }
        )
      }
    }

    // 解析请求
    const { originalImageUrl, sceneType, mode = 'clothing' } = await request.json()

    if (!originalImageUrl || !sceneType) {
      return NextResponse.json(
        { success: false, error: '参数缺失' },
        { status: 400 }
      )
    }

    // 获取场景名称
    const scene = SCENE_PRESETS.find(s => s.id === sceneType)
    const sceneName = scene?.name || '极简白底'

    // 创建生成记录
    const generation = await createGeneration({
      userId: user.id,
      originalImageUrl,
      promptUsed: `${mode}-${sceneType}`,
      stylePreset: `${mode}-${sceneType}`,
    })

    if (!generation) {
      return NextResponse.json(
        { success: false, error: '创建记录失败' },
        { status: 500 }
      )
    }

    // 调用 AI 生成
    const result = mode === 'product'
      ? await generateProductImage(originalImageUrl, sceneName)
      : await generateClothingImage(originalImageUrl, sceneName)

    if (result.success && result.imageUrl) {
      await updateGenerationStatus(generation.id, 'completed', result.imageUrl)

      return NextResponse.json({
        success: true,
        generationId: generation.id,
        imageUrl: result.imageUrl,
      })
    } else {
      await updateGenerationStatus(generation.id, 'failed', undefined, result.error)

      return NextResponse.json(
        { success: false, error: result.error || '生成失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('生成API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
