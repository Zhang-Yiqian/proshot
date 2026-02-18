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

  // Mock 模式处理
  if (MODEL_CONFIG.mockMode) {
    console.log('[AI Client] Mock 模式已开启，返回固定图片')
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    return {
      success: true,
      imageUrl: MODEL_CONFIG.mockImageUrl
    }
  }

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
 * 生成模特多视角/多姿势图
 */
export async function generateMultiPoseImages(
  mainImageUrl: string
): Promise<GenerateResult> {
  // TODO: 后续由用户自行维护具体的 Prompt 逻辑
  const prompt = `基于这张主图，生成5张模特在相同场景下的不同姿态视角图。要求：
1. 模特保持长相、身材、发型完全一致；
2. 服装款式、颜色、纹理细节与主图完全一致；
3. 场景光影和背景保持一致；
4. 5个姿态分别是：正面、侧面30度、侧面90度、背面、以及一个自然走动的姿态；
5. 请直接输出5张图片。`

  // 如果是 Mock 模式
  if (MODEL_CONFIG.mockMode) {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return {
      success: true,
      imageUrl: MODEL_CONFIG.mockImageUrl,
      imageUrls: [
        MODEL_CONFIG.mockImageUrl,
        MODEL_CONFIG.mockImageUrl,
        MODEL_CONFIG.mockImageUrl,
        MODEL_CONFIG.mockImageUrl,
        MODEL_CONFIG.mockImageUrl,
      ]
    }
  }

  return generateImage({
    prompt,
    imageUrl: mainImageUrl,
    model: AI_MODELS.MULTI_POSE,
  })
}
