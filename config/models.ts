/**
 * AI模型配置 - 通过 OpenRouter 调用
 */

export const AI_MODELS = {
  MAIN_IMAGE: "google/gemini-3-pro-image-preview",
  MULTI_POSE: "google/gemini-2.0-pro-exp-02-05:free", // 使用 Gemini 2.0 Pro 生成多视角
  EXPAND_IMAGE: "google/gemini-2.5-flash-image",
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
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  mockImageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop",
}
