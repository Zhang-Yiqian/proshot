/**
 * AI模型配置 - 通过 OpenRouter 调用
 */

export const AI_MODELS = {
  MAIN_IMAGE: "google/gemini-2.5-flash-image",
  MULTI_POSE: "google/gemini-2.5-flash-image", // 多姿势图与主图使用同一模型（支持图生图）
  EXPAND_IMAGE: "google/gemini-2.5-flash-image-preview",
} as const

export const MODEL_CONFIG = {
  apiBaseUrl: process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  siteName: "ProShot",
  
  // 图片生成配置
  imageConfig: {
    aspectRatio: "3:4" as const,
    imageSize: "2K" as const,
  },
  
  // 生成参数
  defaultParams: {
    temperature: 0.7,
    topP: 0.9,
  },

  // Mock 配置
  // mockMode: 控制是否跳过用户鉴权（仅用于套图节点的开发调试）
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  // mockMainImageMode: 控制主图生成节点是否跳过 AI 模型，直接返回 mock 图片
  // 套图节点不受此 flag 影响，始终调用真实模型
  mockMainImageMode: process.env.NEXT_PUBLIC_MOCK_MAIN_IMAGE === 'true',
  mockImageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop",
}
