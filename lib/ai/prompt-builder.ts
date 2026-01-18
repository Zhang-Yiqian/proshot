/**
 * Prompt 构建器
 */

import { SCENE_PRESETS, PRODUCT_SCENE_PRESETS } from '@/config/presets'

/**
 * 构建服装上身 Prompt
 */
export function buildClothingPrompt(sceneId: string): string {
  const scene = SCENE_PRESETS.find(s => s.id === sceneId)
  const sceneName = scene?.name || '极简白底'
  
  return `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是${sceneName}。要求：1. 保持衣服的款式、颜色、细节完全一致；2. 模特姿态自然优美；3. 光线和场景融合自然。`
}

/**
 * 构建物品场景 Prompt（预留）
 */
export function buildProductPrompt(sceneId: string): string {
  const scene = PRODUCT_SCENE_PRESETS.find(s => s.id === sceneId)
  const sceneName = scene?.name || '客厅'
  
  return `你是一个产品摄影大师，请把上传的产品图放置到${sceneName}场景中。要求：1. 保持产品外观完全一致；2. 场景布置美观自然；3. 光影效果专业。`
}
