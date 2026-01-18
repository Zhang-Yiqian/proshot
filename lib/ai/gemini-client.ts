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
  error?: string
}

/**
 * 调用 OpenRouter 生成图片
 */
export async function generateImage(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, imageUrl, model = AI_MODELS.MAIN_IMAGE } = options

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
    return { success: false, error: 'OpenRouter API Key 未配置' }
  }

  try {
    // 构建消息
    const content: any[] = []
    
    if (imageUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      })
    }
    
    content.push({
      type: 'text',
      text: prompt,
    })

    const response = await fetch(`${MODEL_CONFIG.apiBaseUrl}/chat/completions`, {
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
        modalities: ['image', 'text'],
        image_config: {
          aspect_ratio: MODEL_CONFIG.imageConfig.aspectRatio,
          image_size: MODEL_CONFIG.imageConfig.imageSize,
        },
        temperature: MODEL_CONFIG.defaultParams.temperature,
        top_p: MODEL_CONFIG.defaultParams.topP,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    // 解析响应中的图片
    const message = data.choices?.[0]?.message
    
    // 检查 images 数组
    if (message?.images?.[0]) {
      const img = message.images[0]
      const url = img.image_url?.url || img.imageUrl?.url
      if (url) {
        return { success: true, imageUrl: url }
      }
    }
    
    // 检查 content 是否是图片
    if (typeof message?.content === 'string') {
      if (message.content.startsWith('data:image/') || 
          message.content.startsWith('http')) {
        return { success: true, imageUrl: message.content }
      }
    }

    throw new Error('无法从响应中解析图片')
  } catch (error) {
    console.error('[AI Client] 生成失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    }
  }
}

/**
 * 生成服装上身图
 */
export async function generateClothingImage(
  referenceImageUrl: string,
  sceneType: string
): Promise<GenerateResult> {
  const prompt = `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是${sceneType}。要求：1. 保持衣服的款式、颜色、细节完全一致；2. 模特姿态自然优美；3. 光线和场景融合自然。`
  
  return generateImage({
    prompt,
    imageUrl: referenceImageUrl,
    model: AI_MODELS.MAIN_IMAGE,
  })
}

/**
 * 生成物品场景图（预留）
 */
export async function generateProductImage(
  referenceImageUrl: string,
  sceneType: string
): Promise<GenerateResult> {
  const prompt = `你是一个产品摄影大师，请把上传的产品图放置到${sceneType}场景中。要求：1. 保持产品外观完全一致；2. 场景布置美观自然；3. 光影效果专业。`
  
  return generateImage({
    prompt,
    imageUrl: referenceImageUrl,
    model: AI_MODELS.MAIN_IMAGE,
  })
}
