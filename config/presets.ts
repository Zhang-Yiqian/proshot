/**
 * ProShot 预设配置
 */

// ────────────────────────────────────────────────────────
// 模特类型配置
// ────────────────────────────────────────────────────────

export interface ModelType {
  id: string
  name: string
  icon: string
  promptDetail: string
}

export const MODEL_TYPES: ModelType[] = [
  {
    id: 'western-female',
    name: '欧美女模特',
    icon: '👱‍♀️',
    promptDetail: '20-28岁欧美女性模特，深邃立体的五官，高挑纤细的身材，金棕色头发，气质时尚大气',
  },
  {
    id: 'western-male',
    name: '欧美男模特',
    icon: '👱‍♂️',
    promptDetail: '22-32岁欧美男性模特，轮廓分明的面部，强健匀称的身材，浅棕或深色头发，阳刚帅气',
  },
  {
    id: 'asian-female',
    name: '亚洲女模特',
    icon: '👩',
    promptDetail: '20-28岁亚洲女性模特，精致秀丽的面容，纤细优雅的身材，黑色直发，温柔知性气质',
  },
  {
    id: 'asian-male',
    name: '亚洲男模特',
    icon: '👨',
    promptDetail: '22-32岁亚洲男性模特，清秀英俊的面容，匀称干练的身材，黑色整洁头发，时尚有型',
  },
]

export const DEFAULT_MODEL_TYPE_ID = 'asian-female'

export type ModelTypeId = typeof MODEL_TYPES[number]['id']

// ────────────────────────────────────────────────────────
// 场景配置
// ────────────────────────────────────────────────────────

export interface SceneItem {
  id: string
  name: string
  promptDetail: string
}

export interface SceneCategory {
  id: string
  name: string
  icon: string
  scenes: SceneItem[]
}

// 场景分类（5 大类 × 10 细分）
export const SCENE_CATEGORIES: SceneCategory[] = [
  {
    id: 'minimal-color',
    name: '极简纯色',
    icon: '⬜',
    scenes: [
      { id: 'pure-white',      name: '纯白背景', promptDetail: '纯白色无缝背景，专业摄影棚灯光，突出商品，简约时尚' },
      { id: 'neutral-gray',    name: '中性浅灰', promptDetail: '浅灰色无缝背景，柔和均匀光线，干净专业的摄影棚效果' },
      { id: 'oat-milk',        name: '燕麦奶色', promptDetail: '温暖燕麦奶白色调无缝背景，柔和自然光，温馨简约' },
      { id: 'morandi-pink',    name: '莫兰迪粉', promptDetail: '莫兰迪粉色调背景，低饱和度高雅色彩氛围，柔光效果' },
      { id: 'sage-green',      name: '鼠尾草绿', promptDetail: '鼠尾草绿色调无缝背景，清新自然，柔和雅致' },
      { id: 'haze-blue-gray',  name: '雾霾灰蓝', promptDetail: '雾霾灰蓝色调背景，冷调高级感，简约现代' },
      { id: 'vintage-khaki',   name: '复古卡其', promptDetail: '复古卡其色调无缝背景，温暖土地色，自然质朴' },
      { id: 'deep-black',      name: '深邃纯黑', promptDetail: '纯黑色无缝背景，专业摄影棚强光，高对比度，高级感' },
      { id: 'cream-texture',   name: '奶油肌理', promptDetail: '奶油色细腻肌理背景，温柔奶油风，质感细腻' },
      { id: 'earth-coffee',    name: '大地深咖', promptDetail: '深咖啡色大地色调无缝背景，沉稳高级，自然温暖' },
    ],
  },
  {
    id: 'street-style',
    name: '街拍风格',
    icon: '🏙️',
    scenes: [
      { id: 'busy-crossroads',       name: '繁华十字', promptDetail: '繁华城市十字路口，高楼林立，都市时尚氛围，街拍风格' },
      { id: 'quiet-alley',           name: '宁静小巷', promptDetail: '安静的城市小巷，斑驳砖墙，散落绿植，文艺复古街头风' },
      { id: 'glass-curtain-wall',    name: '玻璃幕墙', promptDetail: '现代玻璃幕墙建筑前，光滑反光表面，都市感，时尚商务' },
      { id: 'retro-red-brick',       name: '复古红砖', promptDetail: '复古红砖墙背景，工业感美学，文艺街头氛围' },
      { id: 'platform-commute',      name: '站台通勤', promptDetail: '地铁或公交站台，城市通勤场景，都市日常生活感' },
      { id: 'vending-machine-side',  name: '贩卖机旁', promptDetail: '便利店自动贩卖机旁，城市街头日本风，便利潮流感' },
      { id: 'zebra-crossing-front',  name: '斑马线前', promptDetail: '城市斑马线前，街头抓拍风格，真实都市生活气息' },
      { id: 'tree-shadow-avenue',    name: '树影林荫', promptDetail: '城市绿化带树影斑驳，自然光透过树叶，清新街头' },
      { id: 'street-corner-shop',    name: '街角小店', promptDetail: '街角特色小店前，橱窗装饰，市井烟火气息' },
      { id: 'inside-cafe',           name: '咖啡店内', promptDetail: '精品咖啡馆室内，暖色调灯光，文艺小资氛围，木质装饰' },
    ],
  },
  {
    id: 'home-scene',
    name: '居家场景',
    icon: '🏠',
    scenes: [
      { id: 'natural-wood-living',  name: '原木客厅', promptDetail: '原木风格客厅，温暖木质家具，自然光线，北欧简约生活' },
      { id: 'tatami-room',          name: '榻榻米房', promptDetail: '日式榻榻米房间，低矮家具，木质格栅，宁静禅意空间' },
      { id: 'window-light-shadow',  name: '光影窗前', promptDetail: '大窗户光影，自然光透窗而入，明亮温馨的室内空间' },
      { id: 'fabric-sofa',          name: '布艺沙发', promptDetail: '柔软布艺沙发旁，温馨客厅，毛绒地毯，家居舒适感' },
      { id: 'minimal-bedroom',      name: '极简卧室', promptDetail: '极简风格卧室，白色床品，整洁清爽，北欧极简美学' },
      { id: 'vanity-table',         name: '梳妆台前', promptDetail: '精致梳妆台前，化妆镜灯光，轻奢优雅的闺房氛围' },
      { id: 'paper-sliding-door',   name: '纸拉门旁', promptDetail: '日式纸拉门旁，传统与现代融合，柔和扩散光，宁静优雅' },
      { id: 'green-plant-balcony',  name: '绿植阳台', promptDetail: '阳台绿植环绕，自然光充足，清新植物生活美学' },
      { id: 'island-kitchen',       name: '岛台厨房', promptDetail: '现代开放式岛台厨房，整洁明亮，生活品质感' },
      { id: 'bright-washroom',      name: '明亮洗漱', promptDetail: '明亮洁净的卫浴空间，大理石台面，精致生活日常' },
    ],
  },
  {
    id: 'business-office',
    name: '商务办公',
    icon: '💼',
    scenes: [
      { id: 'open-workspace',     name: '开放工位', promptDetail: '现代开放式办公区，整洁工位，协作氛围，专业干练' },
      { id: 'glass-meeting-room', name: '玻璃会议', promptDetail: '玻璃幕墙会议室，商务洽谈场景，专业高端会议空间' },
      { id: 'creative-office',    name: '创意空间', promptDetail: '创意型办公室，彩色装饰，年轻活力，互联网公司风格' },
      { id: 'private-office',     name: '独立办公', promptDetail: '独立私人办公室，书架背景，高端专业，总裁气质' },
      { id: 'grand-lobby',        name: '气派大堂', promptDetail: '商务大楼宽敞气派大堂，高级感装修，专业商务人士形象' },
      { id: 'office-lounge',      name: '休闲沙发', promptDetail: '办公室休息区沙发，轻松商务氛围，洽谈角落' },
      { id: 'design-workbench',   name: '设计工台', promptDetail: '设计师创意工作台，手绘板和屏幕，创意工作环境' },
      { id: 'bright-pantry',      name: '明亮茶水', promptDetail: '明亮整洁的茶水间，休闲咖啡角，办公室生活片段' },
      { id: 'corridor-depth',     name: '走廊纵深', promptDetail: '办公室走廊纵深感，透视线条，现代建筑美学' },
      { id: 'whiteboard-screen',  name: '白板幕布', promptDetail: '会议室白板和投影幕布前，专业演讲或汇报场景' },
    ],
  },
  {
    id: 'outdoor-nature',
    name: '户外自然',
    icon: '🌿',
    scenes: [
      { id: 'light-through-forest', name: '透光森林', promptDetail: '阳光透过茂密树林，斑驳光影，森林浴清新感，自然静谧' },
      { id: 'picnic-lawn',          name: '野餐草坪', promptDetail: '开阔青翠草坪，野餐休闲，蓝天白云，户外轻松惬意' },
      { id: 'sparkling-lakeside',   name: '粼粼湖畔', promptDetail: '湖水粼粼倒影，湖畔草地，自然风光，清新宁静' },
      { id: 'azure-beach',          name: '蔚蓝海滩', promptDetail: '蔚蓝大海沙滩，海风气息，度假风，阳光活力' },
      { id: 'glass-greenhouse',     name: '玻璃温室', promptDetail: '植物园玻璃温室，绿植丛生，温暖湿润，自然与现代融合' },
      { id: 'ginkgo-avenue',        name: '银杏大道', promptDetail: '金黄银杏叶铺成的大道，秋日暖阳，诗意秋天美景' },
      { id: 'sunset-seaside',       name: '落日海边', promptDetail: '橙红落日余晖海边，浪漫晚霞，暖色调，唯美自然光' },
      { id: 'winter-snow-forest',   name: '冬日雪林', promptDetail: '白雪覆盖的冬日树林，宁静纯净，冷调银白自然美景' },
      { id: 'blossoms-under-tree',  name: '繁花树下', promptDetail: '繁花盛开树下，春日樱花或梨花，粉白烂漫，自然浪漫' },
      { id: 'wilderness-road',      name: '荒野公路', promptDetail: '荒野公路延伸向远方，开阔大地，公路片风格，自由旷野' },
    ],
  },
]

// 扁平化预设列表，用于 prompt 查找、场景名称展示等
export const SCENE_PRESETS = SCENE_CATEGORIES.flatMap((cat) =>
  cat.scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    description: scene.name,
    icon: cat.icon,
    promptDetail: scene.promptDetail,
    categoryId: cat.id,
    categoryName: cat.name,
  }))
)

// 旧版场景 ID 映射（向后兼容 DB 中的历史记录，避免显示「未知场景」）
const LEGACY_SCENE_MAP: Record<string, { name: string; icon: string; promptDetail: string }> = {
  'white-bg': { name: '极简白底', icon: '⬜', promptDetail: '纯白色背景，专业摄影棚灯光，简约时尚' },
  'street':   { name: '街拍风格', icon: '🏙️', promptDetail: '都市街头场景，现代建筑背景，自然光线，时尚潮流氛围' },
  'home':     { name: '居家场景', icon: '🏠', promptDetail: '温馨的家居环境，柔和的室内光线，舒适自然的氛围' },
  'cafe':     { name: '咖啡馆',   icon: '☕',  promptDetail: '文艺咖啡馆室内，暖色调灯光，小资情调，休闲氛围' },
  'office':   { name: '商务办公', icon: '💼', promptDetail: '现代办公室环境，简约专业，商务职业氛围' },
  'outdoor':  { name: '户外自然', icon: '🌿', promptDetail: '户外自然环境，绿色植物背景，自然光线，清新活力' },
}

/**
 * 根据场景 ID 查找场景信息（同时支持新旧 ID）
 */
export function findSceneById(sceneId: string): { name: string; icon: string; promptDetail: string } | null {
  const newScene = SCENE_PRESETS.find((s) => s.id === sceneId)
  if (newScene) return { name: newScene.name, icon: newScene.icon, promptDetail: newScene.promptDetail }
  const legacy = LEGACY_SCENE_MAP[sceneId]
  if (legacy) return legacy
  return null
}

// 产品场景预设（预留）
export const PRODUCT_SCENE_PRESETS = [
  { id: 'living-room', name: '客厅',   description: '现代客厅场景',   icon: '🛋️' },
  { id: 'desk',        name: '办公桌', description: '简约办公环境',   icon: '🖥️' },
  { id: 'kitchen',     name: '厨房',   description: '明亮厨房场景',   icon: '🍳' },
  { id: 'studio',      name: '摄影棚', description: '专业产品摄影',   icon: '📷' },
] as const

export type ScenePresetId = string
export type ProductScenePresetId = typeof PRODUCT_SCENE_PRESETS[number]['id']
