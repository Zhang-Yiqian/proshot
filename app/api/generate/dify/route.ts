/**
 * Dify 工作流生成 API
 * 使用 Dify 工作流实现服饰上身功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDifyWorkflow, buildScenePrompt, DIFY_CONFIG } from '@/lib/ai/dify-client'
import { SCENE_PRESETS } from '@/config/presets'
import { createGeneration, updateGenerationStatus } from '@/lib/db/generations'

export async function POST(request: NextRequest) {
  try {
    console.log('[Dify API] 收到生成请求')
    const supabase = createClient()

    // 解析请求
    const { originalImageUrl, sceneType } = await request.json()

    if (!originalImageUrl || !sceneType) {
      return NextResponse.json(
        { success: false, error: '参数缺失：需要 originalImageUrl 和 sceneType' },
        { status: 400 }
      )
    }

    console.log('[Dify API] 请求参数:', { originalImageUrl, sceneType })

    // Mock 模式直接调用 Dify 并返回结果（跳过用户和数据库逻辑）
    if (DIFY_CONFIG.mockMode) {
      console.log('[Dify API] Mock 模式已开启')
      const scene = SCENE_PRESETS.find(s => s.id === sceneType)
      const sceneName = scene?.name || '极简白底'
      const scenePrompt = buildScenePrompt(sceneType)
      
      console.log('[Dify API] 场景:', { sceneName, scenePrompt })
      
      const result = await runDifyWorkflow({
        originalImageUrl,
        scene: scenePrompt,
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          imageUrl: result.imageUrl,
          taskId: result.taskId,
        })
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }
    }

    // 验证用户登录
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '用户未登录' },
        { status: 401 }
      )
    }

    console.log('[Dify API] 用户已验证:', user.id)

    // 获取场景信息
    const scene = SCENE_PRESETS.find(s => s.id === sceneType)
    const sceneName = scene?.name || '极简白底'
    const scenePrompt = buildScenePrompt(sceneType)

    console.log('[Dify API] 场景信息:', { sceneName, scenePrompt })

    // 创建生成记录
    const generation = await createGeneration({
      userId: user.id,
      originalImageUrl,
      promptUsed: `dify-clothing-${sceneType}`,
      stylePreset: `dify-clothing-${sceneType}`,
    })

    if (!generation) {
      return NextResponse.json(
        { success: false, error: '创建生成记录失败' },
        { status: 500 }
      )
    }

    console.log('[Dify API] 生成记录已创建:', generation.id)

    // 调用 Dify 工作流
    console.log('[Dify API] 开始调用 Dify 工作流...')
    const result = await runDifyWorkflow({
      originalImageUrl,
      scene: scenePrompt,
    })

    if (result.success && result.imageUrl) {
      // 更新生成记录为成功
      await updateGenerationStatus(generation.id, 'completed', result.imageUrl)

      console.log('[Dify API] 生成成功!', {
        generationId: generation.id,
        imageUrl: result.imageUrl,
        taskId: result.taskId,
      })

      return NextResponse.json({
        success: true,
        generationId: generation.id,
        imageUrl: result.imageUrl,
        taskId: result.taskId,
      })
    } else {
      // 更新生成记录为失败
      await updateGenerationStatus(generation.id, 'failed', undefined, result.error)

      console.error('[Dify API] 生成失败:', result.error)

      return NextResponse.json(
        { success: false, error: result.error || 'Dify 工作流执行失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Dify API] 发生异常:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器错误' 
      },
      { status: 500 }
    )
  }
}
