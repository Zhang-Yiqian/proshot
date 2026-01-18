/**
 * 主图生成 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateClothingImage, generateProductImage } from '@/lib/ai/gemini-client'
import { SCENE_PRESETS } from '@/config/presets'
import { createGeneration, updateGenerationStatus } from '@/lib/db/generations'
import { getUserProfile, createUserProfile } from '@/lib/db/profiles'
import { MODEL_CONFIG } from '@/config/models'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 解析请求
    const { originalImageUrl, sceneType, mode = 'clothing' } = await request.json()

    if (!originalImageUrl || !sceneType) {
      return NextResponse.json(
        { success: false, error: '参数缺失' },
        { status: 400 }
      )
    }

    // Mock 模式直接调用 AI 并返回结果（跳过用户和数据库逻辑）
    if (MODEL_CONFIG.mockMode) {
      const scene = SCENE_PRESETS.find(s => s.id === sceneType)
      const sceneName = scene?.name || '极简白底'
      
      const result = mode === 'product'
        ? await generateProductImage(originalImageUrl, sceneName)
        : await generateClothingImage(originalImageUrl, sceneName)

      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
      })
    }

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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
