/**
 * OpenRouter AI 客户端
 * 通过 OpenRouter 调用 Gemini 图像生成模型
 */

import { AI_MODELS, MODEL_CONFIG } from '@/config/models'

interface GenerateOptions {
  prompt: string
  imageUrl?: string
  model?: string
}

interface GenerateResult {
  success: boolean
  imageUrl?: string
  imageUrls?: string[] // 新增支持多图
  error?: string
}

/**
 * 调用 OpenRouter 生成图片
 */
export async function generateImage(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, imageUrl, model = AI_MODELS.MAIN_IMAGE } = options

  console.log('[AI Client] === 开始生成图片 ===')
  console.log('[AI Client] 配置:', {
    model,
    hasImageUrl: !!imageUrl,
    promptLength: prompt.length,
    mockMode: MODEL_CONFIG.mockMode
  })

  if (!MODEL_CONFIG.apiKey) {
    console.error('[AI Client] OpenRouter API Key 未配置')
    return { success: false, error: 'OpenRouter API Key 未配置' }
  }

  try {
    // 构建消息
    const content: any[] = []
    
    if (imageUrl) {
      console.log('[AI Client] 添加参考图片:', imageUrl.substring(0, 100) + '...')
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      })
    }
    
    content.push({
      type: 'text',
      text: prompt,
    })

    console.log('[AI Client] Prompt 内容:', prompt.substring(0, 200) + '...')

    const apiUrl = `${MODEL_CONFIG.apiBaseUrl}/chat/completions`
    console.log('[AI Client] 请求 OpenRouter API:', apiUrl)
    
    const requestStartTime = Date.now()
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MODEL_CONFIG.apiKey}`,
        'HTTP-Referer': MODEL_CONFIG.siteUrl,
        'X-Title': MODEL_CONFIG.siteName,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        modalities: ['text', 'image'],  // text 在前，Gemini 图片生成必须同时指定两种模态
        temperature: MODEL_CONFIG.defaultParams.temperature,
        top_p: MODEL_CONFIG.defaultParams.topP,
      }),
    })

    const requestTime = Date.now() - requestStartTime
    console.log(`[AI Client] API 响应耗时: ${requestTime}ms, 状态码: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[AI Client] API 请求失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
    }

    console.log('[AI Client] 开始解析响应...')
    const data = await response.json()
    console.log('[AI Client] 响应数据:', JSON.stringify(data, null, 2).substring(0, 500) + '...')
    
    // 解析响应中的图片（根据 OpenRouter 文档）
    const message = data.choices?.[0]?.message
    console.log('[AI Client] 消息内容类型:', typeof message?.content, Array.isArray(message?.content) ? `数组(${message.content.length})` : '')

    // 优先检查 content 数组（OpenRouter Gemini 图片生成的标准返回格式）
    if (Array.isArray(message?.content)) {
      console.log('[AI Client] content 是数组，遍历查找图片部分...')
      const urls = (message.content as any[])
        .filter((part: any) => part.type === 'image_url' && part.image_url?.url)
        .map((part: any) => part.image_url.url as string)
      
      if (urls.length > 0) {
        console.log('[AI Client] ✅ 从 content 数组中解析到图片，数量:', urls.length)
        console.log('[AI Client] 第一张图片 URL 前缀:', urls[0].substring(0, 60) + '...')
        return { success: true, imageUrl: urls[0], imageUrls: urls }
      }
    }

    // 兼容 images 数组格式
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      console.log('[AI Client] 找到 images 数组，图片数量:', message.images.length)
      const urls = (message.images as any[])
        .map((img: any) => img.image_url?.url || img.imageUrl?.url)
        .filter(Boolean)
      
      if (urls.length > 0) {
        console.log('[AI Client] ✅ 成功解析图片 URL，数量:', urls.length)
        return { success: true, imageUrl: urls[0], imageUrls: urls }
      }
    }
    
    // 兼容 content 直接为图片 URL 的情况
    if (typeof message?.content === 'string') {
      const c = message.content as string
      if (c.startsWith('data:image/') || c.startsWith('http')) {
        console.log('[AI Client] ✅ 从 content 字符串解析到图片 URL')
        return { success: true, imageUrl: c }
      }
    }

    console.error('[AI Client] ❌ 无法从响应中解析图片')
    console.error('[AI Client] 完整响应数据:', JSON.stringify(data, null, 2))
    throw new Error('无法从响应中解析图片')
  } catch (error) {
    console.error('[AI Client] ❌ 生成失败:', error)
    console.error('[AI Client] 错误详情:', error instanceof Error ? error.stack : error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    }
  }
}

/**
 * 生成服装上身图
 * @param referenceImageUrl 参考图URL
 * @param sceneId 场景ID（如 'street', 'cafe'）
 */
export async function generateClothingImage(
  referenceImageUrl: string,
  sceneId: string
): Promise<GenerateResult> {
  console.log('[AI Client] === 开始生成服装上身图 ===')
  console.log('[AI Client] 场景ID:', sceneId)
  console.log('[AI Client] 参考图URL:', referenceImageUrl)

  // 主图 Mock 模式：直接返回固定图片，跳过模型调用
  // 套图节点（generateMultiPoseImages）不经过此函数，不受影响
  if (MODEL_CONFIG.mockMainImageMode) {
    console.log('[AI Client] 主图 Mock 模式已开启，跳过模型调用，返回固定图片')
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { success: true, imageUrl: MODEL_CONFIG.mockImageUrl }
  }
  
  // 使用 prompt-builder 构建完整的 prompt
  const { buildClothingPrompt } = await import('./prompt-builder')
  const prompt = buildClothingPrompt(sceneId)
  
  console.log('[AI Client] 构建的 Prompt:', prompt.substring(0, 300) + '...')
  
  return generateImage({
    prompt,
    imageUrl: referenceImageUrl,
    model: AI_MODELS.MAIN_IMAGE,
  })
}

/**
 * 生成物品场景图
 * @param referenceImageUrl 参考图URL
 * @param sceneId 场景ID（如 'living-room', 'desk'）
 */
export async function generateProductImage(
  referenceImageUrl: string,
  sceneId: string
): Promise<GenerateResult> {
  // 主图 Mock 模式：直接返回固定图片，跳过模型调用
  if (MODEL_CONFIG.mockMainImageMode) {
    console.log('[AI Client] 主图 Mock 模式已开启，跳过物品场景图模型调用，返回固定图片')
    await new Promise(resolve => setTimeout(resolve, 2000))
    return { success: true, imageUrl: MODEL_CONFIG.mockImageUrl }
  }

  // 使用 prompt-builder 构建完整的 prompt
  const { buildProductPrompt } = await import('./prompt-builder')
  const prompt = buildProductPrompt(sceneId)
  
  return generateImage({
    prompt,
    imageUrl: referenceImageUrl,
    model: AI_MODELS.MAIN_IMAGE,
  })
}

/**
 * 生成模特多姿势拍摄图（3张，基于主图人物特征和场景）
 * 注意：严格保持与主图相同的拍摄角度，不生成主图中未出现的角度
 */
export async function generateMultiPoseImages(
  mainImageUrl: string
): Promise<GenerateResult> {
  // 套图节点始终调用真实模型，不受任何 mock 配置影响

  // 3 种不同姿势的提示词（严格保持主图拍摄角度）
  const posePrompts = [
    `Based on the reference image provided, generate a professional fashion e-commerce photo. Requirements:
1. Preserve exactly the model's face, skin tone, hairstyle, and hair color from the reference image.
2. Keep the clothing style, color, texture, and pattern identical to the reference image.
3. Maintain the same scene, background, lighting, and atmosphere as the reference image.
4. [CRITICAL] The camera angle and shooting perspective MUST be identical to the reference image. Do NOT introduce any new angles or viewpoints not present in the original.
5. Pose variation: Model stands in a natural relaxed pose, hands resting softly at sides or lightly on hips, with a confident and natural expression.
6. Output 1 high-quality commercial studio-style photo.`,

    `Based on the reference image provided, generate a professional fashion e-commerce photo. Requirements:
1. Preserve exactly the model's face, skin tone, hairstyle, and hair color from the reference image.
2. Keep the clothing style, color, texture, and pattern identical to the reference image.
3. Maintain the same scene, background, lighting, and atmosphere as the reference image.
4. [CRITICAL] The camera angle and shooting perspective MUST be identical to the reference image. Do NOT introduce any new angles or viewpoints not present in the original.
5. Pose variation: Model is in an elegant walking dynamic pose, light steps, slight body rotation, showcasing the garment's movement and flow.
6. Output 1 high-quality commercial studio-style photo.`,

    `Based on the reference image provided, generate a professional fashion e-commerce photo. Requirements:
1. Preserve exactly the model's face, skin tone, hairstyle, and hair color from the reference image.
2. Keep the clothing style, color, texture, and pattern identical to the reference image.
3. Maintain the same scene, background, lighting, and atmosphere as the reference image.
4. [CRITICAL] The camera angle and shooting perspective MUST be identical to the reference image. Do NOT introduce any new angles or viewpoints not present in the original.
5. Pose variation: Model in a confident editorial pose, one hand on hip or lightly touching collar, weight shifted to one side, highlighting the garment's silhouette.
6. Output 1 high-quality commercial studio-style photo.`,
  ]

  console.log('[AI Client] 开始并行生成 3 张多姿势图...')

  // 并行发起 3 次请求
  const results = await Promise.all(
    posePrompts.map((prompt, index) => {
      console.log(`[AI Client] 发起第 ${index + 1} 张姿势图请求...`)
      return generateImage({
        prompt,
        imageUrl: mainImageUrl,
        model: AI_MODELS.MULTI_POSE,
      })
    })
  )

  const successfulUrls = results
    .filter(r => r.success && r.imageUrl)
    .map(r => r.imageUrl as string)

  console.log(`[AI Client] 多姿势图生成完成，成功 ${successfulUrls.length}/3 张`)

  if (successfulUrls.length === 0) {
    const firstError = results.find(r => !r.success)?.error
    return {
      success: false,
      error: firstError || '多姿势图生成失败',
    }
  }

  return {
    success: true,
    imageUrl: successfulUrls[0],
    imageUrls: successfulUrls,
  }
}
