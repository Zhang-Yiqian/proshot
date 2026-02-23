/**
 * Prompt 构建器
 */

import { findSceneById, PRODUCT_SCENE_PRESETS, MODEL_TYPES, DEFAULT_MODEL_TYPE_ID } from '@/config/presets'

/**
 * 构建服装上身 Prompt
 * @param sceneId       场景 ID（支持新旧两套 ID）
 * @param customScene   用户自定义场景描述（非空时优先使用）
 * @param modelTypeId   模特类型 ID（如 'asian-female'，默认 'asian-female'）
 */
export function buildClothingPrompt(sceneId: string, customScene?: string, modelTypeId?: string): string {
  // 自定义场景优先
  const sceneName = customScene?.trim() || null
  const promptDetail = sceneName
    ? sceneName
    : (findSceneById(sceneId)?.promptDetail ?? '纯白色背景，专业摄影棚灯光，简约时尚')

  const displayName = sceneName || findSceneById(sceneId)?.name || '自定义场景'

  // 解析模特类型
  const modelType = MODEL_TYPES.find((m) => m.id === (modelTypeId ?? DEFAULT_MODEL_TYPE_ID))
    ?? MODEL_TYPES.find((m) => m.id === DEFAULT_MODEL_TYPE_ID)!

  return `你是一个专业的时尚摄影大师。请将上传的白底服装图中的衣服穿在指定模特身上，生成一张专业商业大片。

模特要求：${modelType.promptDetail}

场景要求：${promptDetail}

拍摄要求：
1. 完全保持衣服的款式、颜色、图案、细节（如logo、纽扣、拉链等），不得有任何改动
2. 模特姿态自然优美，展现服装的版型和特点
3. 光线和场景完美融合，营造${displayName}的氛围
4. 高清摄影质感，商业大片水准`
}

/**
 * 构建物品场景 Prompt
 */
export function buildProductPrompt(sceneId: string): string {
  const scene = PRODUCT_SCENE_PRESETS.find((s) => s.id === sceneId)
  const sceneName = scene?.name || '客厅'
  const sceneDesc = scene?.description || '现代简约场景'

  return `你是一个专业的产品摄影大师。请将上传的产品图放置到${sceneName}场景中。

场景要求：${sceneDesc}

拍摄要求：
1. 完全保持产品的外观、颜色、材质、细节
2. 场景布置美观自然，符合产品定位
3. 专业摄影灯光，突出产品质感
4. 产品摆放位置合理，视角舒适
5. 高清商业摄影水准`
}
