/**
 * Prompt构建器
 * 根据用户选择的场景类型构建完整的Prompt
 */

import { SCENE_PRESETS } from '@/config/presets'

export interface PromptBuilderOptions {
  sceneType: string // 场景类型ID
  additionalPrompt?: string // 用户自定义补充
  productDescription?: string // 商品描述
}

/**
 * 构建完整的生成Prompt
 * 模板：你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是$场景参数$
 */
export function buildPrompt(options: PromptBuilderOptions): string {
  const { sceneType, additionalPrompt } = options

  // 查找场景预设
  const scenePreset = SCENE_PRESETS.find((p) => p.id === sceneType)

  if (!scenePreset) {
    throw new Error('无效的场景配置')
  }

  // 使用场景名称作为场景参数
  const sceneParam = scenePreset.name

  // 构建Prompt（使用新的模板）
  let prompt = `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是${sceneParam}`

  // 如果有用户自定义补充，添加到末尾
  if (additionalPrompt) {
    prompt += `。${additionalPrompt}`
  }

  return prompt
}

/**
 * 构建扩展套图的Prompt（添加姿态变化）
 */
export function buildExpandPrompt(
  basePrompt: string,
  variation: number
): string {
  const poses = [
    'front view, standing straight',
    'side view, natural pose',
    '3/4 view, dynamic pose',
    'back view, over shoulder look',
  ]

  const pose = poses[variation % poses.length]
  return `${basePrompt} Camera angle: ${pose}.`
}
