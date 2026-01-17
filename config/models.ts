/**
 * AI模型配置
 * 适配 OpenRouter 平台
 * 根据PRD要求：
 * - 主图生成使用 google/gemini-3-pro-image-preview
 * - 套图扩展使用 google/gemini-2.5-flash-image-preview
 * 
 * OpenRouter 模型名称格式：
 * - 使用 provider/model-name 格式
 * - 例如：google/gemini-3-pro-image-preview
 */

export const AI_MODELS = {
  MAIN_IMAGE: "google/gemini-3-pro-image-preview", // 主图生成（高质量）
  EXPAND_IMAGE: "google/gemini-2.5-flash-image-preview", // 套图扩展（快速）
} as const

export const MODEL_CONFIG = {
  // OpenRouter 的 Base URL
  apiBaseUrl: process.env.OPENROUTER_API_BASE_URL || "https://openrouter.ai/api/v1",
  
  // OpenRouter 的 API Key（在 OpenRouter 后台创建的令牌）
  apiKey: process.env.OPENROUTER_API_KEY || "",
  
  // 可选：用于 OpenRouter 排行榜显示
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  siteName: "ProShot",
  
  defaultParams: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 2048,
  },
  
  // 图片生成配置
  imageConfig: {
    aspectRatio: "3:4" as const, // 适合人像的宽高比
    imageSize: "2K" as const, // 2K 分辨率（平衡质量和速度）
  },
}
