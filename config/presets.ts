/**
 * 预设配置：模特类型、场景类型
 * 根据PRD要求的选择项
 */

export interface ModelPreset {
  id: string
  name: string
  description: string
  prompt: string
  thumbnail?: string
}

export interface ScenePreset {
  id: string
  name: string
  description: string
  prompt: string
  thumbnail?: string
}

// 模特类型预设
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "asian-female",
    name: "亚洲女性",
    description: "专业亚洲女性模特，适合东方审美",
    prompt: "professional Asian female model, natural makeup, elegant pose",
  },
  {
    id: "western-male",
    name: "欧美男性",
    description: "欧美男性模特，阳光帅气",
    prompt: "professional Western male model, confident pose, athletic build",
  },
  {
    id: "asian-male",
    name: "亚洲男性",
    description: "亚洲男性模特，时尚干练",
    prompt: "professional Asian male model, stylish appearance, modern pose",
  },
  {
    id: "western-female",
    name: "欧美女性",
    description: "欧美女性模特，时尚前卫",
    prompt: "professional Western female model, fashion pose, modern style",
  },
  {
    id: "mannequin",
    name: "虚拟人台",
    description: "保留人台展示，简洁大方",
    prompt: "clothing on professional mannequin, clean studio setup",
  },
]

// 场景类型预设
export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "white-bg",
    name: "极简白底",
    description: "纯白背景，突出商品",
    prompt: "pure white background, studio lighting, professional product photography",
  },
  {
    id: "street-style",
    name: "街拍风格",
    description: "都市街头场景",
    prompt: "urban street photography, natural outdoor lighting, city background, casual lifestyle",
  },
  {
    id: "home-cozy",
    name: "居家场景",
    description: "温馨家居环境",
    prompt: "cozy home interior, soft natural lighting, comfortable living space",
  },
  {
    id: "cafe",
    name: "咖啡馆",
    description: "文艺咖啡馆氛围",
    prompt: "modern cafe interior, warm ambient lighting, artistic atmosphere",
  },
  {
    id: "office",
    name: "办公室",
    description: "专业办公场景",
    prompt: "professional office setting, business environment, clean modern interior",
  },
  {
    id: "nature",
    name: "自然户外",
    description: "自然风光背景",
    prompt: "natural outdoor setting, scenic background, soft daylight",
  },
]
