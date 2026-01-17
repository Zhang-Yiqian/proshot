/**
 * 主图生成API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMainImage } from '@/lib/ai/gemini-client'
import { buildPrompt } from '@/lib/ai/prompt-builder'
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

    // 确保用户 Profile 存在（如果触发器没有工作，这里会自动创建）
    let profile = await getUserProfile(user.id)
    if (!profile) {
      console.log(`用户 ${user.id} 的 Profile 不存在，正在创建...`)
      profile = await createUserProfile(user.id)
      if (!profile) {
        return NextResponse.json(
          { success: false, error: '创建用户资料失败' },
          { status: 500 }
        )
      }
    }

    // 解析请求
    const { originalImageUrl, sceneType, additionalPrompt } = await request.json()

    if (!originalImageUrl || !sceneType) {
      return NextResponse.json(
        { success: false, error: '参数缺失' },
        { status: 400 }
      )
    }

    // 构建Prompt
    const prompt = buildPrompt({
      sceneType,
      additionalPrompt,
    })

    // 创建生成记录
    const generation = await createGeneration({
      userId: user.id,
      originalImageUrl,
      promptUsed: prompt,
      stylePreset: `asian-female-${sceneType}`, // 固定使用亚洲女性模特
    })

    if (!generation) {
      return NextResponse.json(
        { success: false, error: '创建记录失败' },
        { status: 500 }
      )
    }

    // 调用AI生成
    const result = await generateMainImage(prompt, originalImageUrl)

    if (result.success && result.imageUrl) {
      // 更新记录为完成
      await updateGenerationStatus(generation.id, 'completed', result.imageUrl)

      return NextResponse.json({
        success: true,
        generationId: generation.id,
        imageUrl: result.imageUrl,
      })
    } else {
      // 更新记录为失败
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
