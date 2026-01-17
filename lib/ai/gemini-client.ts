/**
 * Gemini AI客户端封装
 * 适配 OpenRouter 平台，支持 Gemini 3 Pro Image Preview 模型
 * OpenRouter 使用 OpenAI 兼容的多模态接口格式
 * 参考文档：https://openrouter.ai/docs/quickstart
 */

import { AI_MODELS, MODEL_CONFIG } from '@/config/models'

export interface GeminiGenerateOptions {
  model: string
  prompt: string
  imageUrl?: string // 参考图URL（白底图）
  temperature?: number
  topP?: number
  maxTokens?: number
  aspectRatio?: string // 图片宽高比，如 "3:4"
  imageSize?: "1K" | "2K" | "4K" // 图片分辨率
}

export interface GeminiResponse {
  success: boolean
  imageUrl?: string // base64 data URL 或 HTTP URL
  error?: string
}

/**
 * 调用Gemini模型生成图片
 * 使用 OpenRouter 的 /api/v1/chat/completions 端点
 * 
 * OpenRouter 对于 Gemini 图像生成：
 * - 使用 chat/completions 端点
 * - 需要设置 modalities: ["image", "text"]
 * - 支持 image_config 参数配置图片尺寸和宽高比
 * - 消息中包含文本和图片（多模态格式）
 * - 响应中的图片在 choices[0].message.images 数组中
 */
export async function generateImage(
  options: GeminiGenerateOptions
): Promise<GeminiResponse> {
  try {
    const { 
      model, 
      prompt, 
      imageUrl, 
      temperature, 
      topP,
      aspectRatio = MODEL_CONFIG.imageConfig.aspectRatio,
      imageSize = MODEL_CONFIG.imageConfig.imageSize,
    } = options

    // 验证配置
    if (!MODEL_CONFIG.apiBaseUrl || !MODEL_CONFIG.apiKey) {
      throw new Error('OpenRouter 配置缺失，请检查环境变量 OPENROUTER_API_BASE_URL 和 OPENROUTER_API_KEY')
    }

    // 构建多模态消息（OpenRouter 格式）
    const messages: any[] = []

    // 如果有参考图（白底图），构建包含图片的消息
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl, // 支持 HTTP URL 或 base64 data URL
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      })
    } else {
      // 只有文本提示
      messages.push({
        role: 'user',
        content: prompt,
      })
    }

    // 构建请求体（OpenRouter OpenAI 兼容格式）
    const requestBody: any = {
      model: model,
      messages: messages,
      modalities: ['image', 'text'], // 必须设置，用于生成图片
      stream: false,
    }

    // 添加图片配置（Gemini 图像生成模型支持）
    requestBody.image_config = {
      aspect_ratio: aspectRatio,
      image_size: imageSize,
    }

    // 添加生成参数
    if (temperature !== undefined) {
      requestBody.temperature = temperature
    }
    if (topP !== undefined) {
      requestBody.top_p = topP
    }

    // 构建完整的 API URL
    const apiUrl = `${MODEL_CONFIG.apiBaseUrl.replace(/\/$/, '')}/chat/completions`

    console.log('[Gemini Client] 调用 OpenRouter:', {
      url: apiUrl,
      model: model,
      hasImage: !!imageUrl,
      promptLength: prompt.length,
      aspectRatio,
      imageSize,
    })

    // 调用 OpenRouter 的 chat/completions 端点
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MODEL_CONFIG.apiKey}`,
        // 可选：用于 OpenRouter 排行榜显示
        'HTTP-Referer': MODEL_CONFIG.siteUrl,
        'X-Title': MODEL_CONFIG.siteName,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API请求失败: ${response.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
        
        // 记录详细错误信息
        console.error('[Gemini Client] API错误:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
      } catch {
        errorMessage = errorText || errorMessage
        console.error('[Gemini Client] API错误（无法解析JSON）:', errorText)
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()

    console.log('[Gemini Client] API响应:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasImages: !!data.choices?.[0]?.message?.images,
      imagesCount: data.choices?.[0]?.message?.images?.length || 0,
    })

    // 解析响应（OpenRouter 返回格式）
    // 图片在 choices[0].message.images 数组中
    // 格式：{ type: "image_url", image_url: { url: "data:image/png;base64,..." } }
    if (data.choices && data.choices[0]?.message) {
      const message = data.choices[0].message
      
      // 检查 images 字段（OpenRouter 标准格式）
      if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const firstImage = message.images[0]
        const imageUrl = firstImage.image_url?.url || firstImage.imageUrl?.url
        
        if (imageUrl) {
          return {
            success: true,
            imageUrl: imageUrl, // base64 data URL
          }
        }
      }
      
      // 兼容处理：检查 content 字段（某些情况下可能包含图片）
      if (message.content) {
        const content = message.content
        
        // 检查是否是base64图片
        if (typeof content === 'string' && content.startsWith('data:image/')) {
          return {
            success: true,
            imageUrl: content,
          }
        }
        
        // 检查是否是HTTP URL
        if (typeof content === 'string' && (content.startsWith('http://') || content.startsWith('https://'))) {
          return {
            success: true,
            imageUrl: content,
          }
        }
      }
      
      // 如果都没有匹配，记录详细日志
      console.warn('[Gemini Client] 无法解析图片URL，响应内容:', {
        message: message,
        fullResponse: JSON.stringify(data).substring(0, 1000),
      })
      
      throw new Error('API返回格式不符合预期，未找到图片。请检查响应中的 images 字段。')
    }
    
    // 如果都没有匹配，记录完整响应
    console.error('[Gemini Client] 无法解析响应:', JSON.stringify(data, null, 2))
    throw new Error('API返回格式错误，无法解析图片URL')
  } catch (error) {
    console.error('[Gemini Client] 调用失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

/**
 * 生成主图（使用 google/gemini-3-pro-image-preview）
 */
export async function generateMainImage(
  prompt: string,
  referenceImageUrl: string
): Promise<GeminiResponse> {
  return generateImage({
    model: AI_MODELS.MAIN_IMAGE,
    prompt,
    imageUrl: referenceImageUrl,
    temperature: MODEL_CONFIG.defaultParams.temperature,
    topP: MODEL_CONFIG.defaultParams.topP,
    aspectRatio: MODEL_CONFIG.imageConfig.aspectRatio,
    imageSize: MODEL_CONFIG.imageConfig.imageSize,
  })
}

/**
 * 扩展套图（使用 google/gemini-2.5-flash-image-preview）
 */
export async function expandImages(
  prompt: string,
  referenceImageUrl: string,
  count: number = 4
): Promise<GeminiResponse[]> {
  const promises = Array.from({ length: count }, () =>
    generateImage({
      model: AI_MODELS.EXPAND_IMAGE,
      prompt,
      imageUrl: referenceImageUrl,
      temperature: MODEL_CONFIG.defaultParams.temperature,
      topP: MODEL_CONFIG.defaultParams.topP,
      aspectRatio: MODEL_CONFIG.imageConfig.aspectRatio,
      imageSize: MODEL_CONFIG.imageConfig.imageSize,
    })
  )

  return Promise.all(promises)
}
