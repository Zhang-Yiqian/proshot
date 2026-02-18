/**
 * Prompt 构建器
 */

import { SCENE_PRESETS, PRODUCT_SCENE_PRESETS } from '@/config/presets'

/**
 * 构建服装上身 Prompt
 */
export function buildClothingPrompt(sceneId: string): string {
  const scene = SCENE_PRESETS.find(s => s.id === sceneId)
  
  if (!scene) {
    // 默认场景
    return `你是一个专业的时尚摄影大师。请将上传的白底服装图中的衣服穿在一个亚洲模特身上，背景为纯白色背景。

要求：
1. 完全保持衣服的款式、颜色、图案、细节（如logo、纽扣、拉链等）
2. 模特为20-30岁的亚洲女性/男性（根据服装风格自动选择）
3. 模特姿态自然优美，展现服装的版型和特点
4. 专业摄影棚灯光，简约时尚
5. 高清摄影质感，商业大片水准`
  }
  
  const promptDetail = 'promptDetail' in scene ? scene.promptDetail : scene.name
  
  return `你是一个专业的时尚摄影大师。请将上传的白底服装图中的衣服穿在一个亚洲模特身上。

场景要求：${promptDetail}

拍摄要求：
1. 完全保持衣服的款式、颜色、图案、细节（如logo、纽扣、拉链等）
2. 模特为20-30岁的亚洲女性/男性（根据服装风格自动选择）
3. 模特姿态自然优美，展现服装的版型和特点
4. 光线和场景完美融合，营造${scene.name}的氛围
5. 高清摄影质感，商业大片水准`
}

/**
 * 构建物品场景 Prompt
 */
export function buildProductPrompt(sceneId: string): string {
  const scene = PRODUCT_SCENE_PRESETS.find(s => s.id === sceneId)
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
