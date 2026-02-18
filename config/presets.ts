/**
 * ProShot 预设配置
 */

// 场景预设 - 服装上身模式
export const SCENE_PRESETS = [
  {
    id: "white-bg",
    name: "极简白底",
    description: "纯白背景，突出商品",
    icon: "⬜",
    promptDetail: "纯白色背景，专业摄影棚灯光，简约时尚",
  },
  {
    id: "street",
    name: "街拍风格", 
    description: "都市街头，时尚潮流",
    icon: "🏙️",
    promptDetail: "都市街头场景，现代建筑背景，自然光线，时尚潮流氛围",
  },
  {
    id: "home",
    name: "居家场景",
    description: "温馨家居，舒适自然",
    icon: "🏠",
    promptDetail: "温馨的家居环境，柔和的室内光线，舒适自然的氛围",
  },
  {
    id: "cafe",
    name: "咖啡馆",
    description: "文艺氛围，小资情调",
    icon: "☕",
    promptDetail: "文艺咖啡馆室内，暖色调灯光，小资情调，休闲氛围",
  },
  {
    id: "office",
    name: "商务办公",
    description: "专业场景，职业风格",
    icon: "💼",
    promptDetail: "现代办公室环境，简约专业，商务职业氛围",
  },
  {
    id: "outdoor",
    name: "户外自然",
    description: "自然风光，清新活力",
    icon: "🌿",
    promptDetail: "户外自然环境，绿色植物背景，自然光线，清新活力",
  },
] as const

// 产品场景预设（预留）
export const PRODUCT_SCENE_PRESETS = [
  {
    id: "living-room",
    name: "客厅",
    description: "现代客厅场景",
    icon: "🛋️",
  },
  {
    id: "desk",
    name: "办公桌",
    description: "简约办公环境",
    icon: "🖥️",
  },
  {
    id: "kitchen",
    name: "厨房",
    description: "明亮厨房场景",
    icon: "🍳",
  },
  {
    id: "studio",
    name: "摄影棚",
    description: "专业产品摄影",
    icon: "📷",
  },
] as const

export type ScenePresetId = typeof SCENE_PRESETS[number]['id']
export type ProductScenePresetId = typeof PRODUCT_SCENE_PRESETS[number]['id']
