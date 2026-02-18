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
  console.log('=== [API] 开始处理主图生成请求 ===')
  try {
    const supabase = createClient()

    // 解析请求
    const body = await request.json()
    console.log('[API] 接收到的请求数据:', body)
    
    const { originalImageUrl, sceneType, mode = 'clothing' } = body

    if (!originalImageUrl || !sceneType) {
      console.error('[API] 参数缺失:', { originalImageUrl, sceneType })
      return NextResponse.json(
        { success: false, error: '参数缺失' },
        { status: 400 }
      )
    }

    console.log('[API] 主图 Mock 模式状态:', MODEL_CONFIG.mockMainImageMode)

    // 主图 Mock 模式：跳过用户鉴权和数据库操作，直接调用生成函数
    // 生成函数内部会判断 mockMainImageMode，决定是否跳过模型调用
    if (MODEL_CONFIG.mockMainImageMode) {
      console.log('[API] 主图使用 Mock 模式，跳过鉴权，直接调用生成函数')
      const result = mode === 'product'
        ? await generateProductImage(originalImageUrl, sceneType)
        : await generateClothingImage(originalImageUrl, sceneType)

      console.log('[API] 主图 Mock 生成结果:', result)
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
      })
    }

    // 验证用户
    console.log('[API] 正常模式，验证用户身份...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[API] 用户验证失败:', authError)
      return NextResponse.json(
        { success: false, error: '用户未登录' },
        { status: 401 }
      )
    }
    
    console.log('[API] 用户验证成功:', user.id)

    // 创建生成记录
    console.log('[API] 创建生成记录...')
    const generation = await createGeneration({
      userId: user.id,
      originalImageUrl,
      promptUsed: `${mode}-${sceneType}`,
      stylePreset: `${mode}-${sceneType}`,
    })

    if (!generation) {
      console.error('[API] 创建生成记录失败')
      return NextResponse.json(
        { success: false, error: '创建记录失败' },
        { status: 500 }
      )
    }

    console.log('[API] 生成记录创建成功:', generation.id)

    // 调用 AI 生成：直接传入场景ID
    console.log('[API] 开始调用 AI 生成图片...')
    const result = mode === 'product'
      ? await generateProductImage(originalImageUrl, sceneType)
      : await generateClothingImage(originalImageUrl, sceneType)

    console.log('[API] AI 生成完成:', result)

    if (result.success && result.imageUrl) {
      console.log('[API] 生成成功，更新记录状态为 completed')
      await updateGenerationStatus(generation.id, 'completed', result.imageUrl)

      return NextResponse.json({
        success: true,
        generationId: generation.id,
        imageUrl: result.imageUrl,
      })
    } else {
      console.error('[API] 生成失败:', result.error)
      await updateGenerationStatus(generation.id, 'failed', undefined, result.error)

      return NextResponse.json(
        { success: false, error: result.error || '生成失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API] 生成API错误:', error)
    console.error('[API] 错误堆栈:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
