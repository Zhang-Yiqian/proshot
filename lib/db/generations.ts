/**
 * 生成记录数据库操作
 */

import { createClient } from '@/lib/supabase/server'
import { GenerationResult, GenerationStatus } from '@/types/generation'

/**
 * 创建生成记录
 */
export async function createGeneration(data: {
  userId: string
  originalImageUrl: string
  promptUsed: string
  stylePreset: string
}): Promise<GenerationResult | null> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('generations')
    .insert({
      user_id: data.userId,
      original_image_url: data.originalImageUrl,
      prompt_used: data.promptUsed,
      style_preset: data.stylePreset,
      status: 'pending',
    } as any)
    .select()
    .single()

  if (error || !result) {
    console.error('创建生成记录失败:', error)
    return null
  }

  return mapToGenerationResult(result)
}

/**
 * 更新生成记录状态
 */
export async function updateGenerationStatus(
  id: string,
  status: GenerationStatus,
  generatedImageUrl?: string,
  errorMessage?: string
): Promise<boolean> {
  const supabase = createClient()

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (generatedImageUrl) {
    updateData.generated_image_url = generatedImageUrl
  }

  if (errorMessage) {
    updateData.error_message = errorMessage
  }

  const { error } = await supabase
    .from('generations')
    .update(updateData as any)
    .eq('id', id)

  return !error
}

/**
 * 获取用户的生成记录列表
 */
export async function getUserGenerations(
  userId: string,
  limit: number = 50
): Promise<GenerationResult[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map(mapToGenerationResult)
}

/**
 * 获取单个生成记录
 */
export async function getGeneration(id: string): Promise<GenerationResult | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return mapToGenerationResult(data)
}

/**
 * 映射数据库记录到类型定义
 */
function mapToGenerationResult(data: any): GenerationResult {
  return {
    id: data.id,
    userId: data.user_id,
    originalImageUrl: data.original_image_url,
    generatedImageUrl: data.generated_image_url,
    promptUsed: data.prompt_used,
    stylePreset: data.style_preset,
    status: data.status as GenerationStatus,
    errorMessage: data.error_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
