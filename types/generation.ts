/**
 * 生成相关类型定义
 */

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface GenerationRequest {
  originalImageUrl: string
  modelType: string
  sceneType: string
  additionalPrompt?: string
}

export interface GenerationResult {
  id: string
  userId: string
  originalImageUrl: string
  generatedImageUrl: string | null
  thumbnailUrl?: string // 带水印预览图
  promptUsed: string
  stylePreset: string
  status: GenerationStatus
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
}

export interface DownloadRequest {
  generationId: string
  userId: string
}
