/**
 * 场景预设与 Prompt 构建器测试
 *
 * 覆盖范围：
 *  1. SCENE_CATEGORIES 数据结构完整性
 *  2. SCENE_PRESETS 扁平化列表一致性
 *  3. findSceneById 新旧 ID 兼容性
 *  4. buildClothingPrompt 标准场景 + 自定义场景
 *  5. buildProductPrompt 基础验证
 *  6. 场景 ID 唯一性校验
 */

import {
  SCENE_CATEGORIES,
  SCENE_PRESETS,
  findSceneById,
} from '@/config/presets'
import {
  buildClothingPrompt,
  buildProductPrompt,
} from '@/lib/ai/prompt-builder'

// ════════════════════════════════════════════════════════════════════════════
// 1. SCENE_CATEGORIES 数据结构完整性
// ════════════════════════════════════════════════════════════════════════════

describe('SCENE_CATEGORIES 数据结构', () => {
  it('应包含 5 个大类', () => {
    expect(SCENE_CATEGORIES).toHaveLength(5)
  })

  it('每个大类应包含 10 个细分场景', () => {
    SCENE_CATEGORIES.forEach((cat) => {
      expect(cat.scenes).toHaveLength(10)
    })
  })

  it('每个大类应具备 id、name、icon、scenes 字段', () => {
    SCENE_CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(cat.icon).toBeTruthy()
      expect(Array.isArray(cat.scenes)).toBe(true)
    })
  })

  it('每个细分场景应具备 id、name、promptDetail 字段', () => {
    SCENE_CATEGORIES.forEach((cat) => {
      cat.scenes.forEach((scene) => {
        expect(scene.id).toBeTruthy()
        expect(scene.name).toBeTruthy()
        expect(scene.promptDetail).toBeTruthy()
      })
    })
  })

  it('5 大类名称应符合产品设计规范', () => {
    const expectedNames = ['极简纯色', '街拍风格', '居家场景', '商务办公', '户外自然']
    const actualNames = SCENE_CATEGORIES.map((c) => c.name)
    expect(actualNames).toEqual(expectedNames)
  })

  it('极简纯色分类应包含所有规定的 10 个场景名称', () => {
    const minimalColorCat = SCENE_CATEGORIES.find((c) => c.id === 'minimal-color')!
    const names = minimalColorCat.scenes.map((s) => s.name)
    expect(names).toContain('纯白背景')
    expect(names).toContain('中性浅灰')
    expect(names).toContain('燕麦奶色')
    expect(names).toContain('莫兰迪粉')
    expect(names).toContain('鼠尾草绿')
    expect(names).toContain('雾霾灰蓝')
    expect(names).toContain('复古卡其')
    expect(names).toContain('深邃纯黑')
    expect(names).toContain('奶油肌理')
    expect(names).toContain('大地深咖')
  })

  it('街拍风格分类应包含所有规定的 10 个场景名称', () => {
    const cat = SCENE_CATEGORIES.find((c) => c.id === 'street-style')!
    const names = cat.scenes.map((s) => s.name)
    expect(names).toContain('繁华十字')
    expect(names).toContain('宁静小巷')
    expect(names).toContain('玻璃幕墙')
    expect(names).toContain('复古红砖')
    expect(names).toContain('站台通勤')
    expect(names).toContain('贩卖机旁')
    expect(names).toContain('斑马线前')
    expect(names).toContain('树影林荫')
    expect(names).toContain('街角小店')
    expect(names).toContain('咖啡店内')
  })

  it('居家场景分类应包含所有规定的 10 个场景名称', () => {
    const cat = SCENE_CATEGORIES.find((c) => c.id === 'home-scene')!
    const names = cat.scenes.map((s) => s.name)
    expect(names).toContain('原木客厅')
    expect(names).toContain('榻榻米房')
    expect(names).toContain('光影窗前')
    expect(names).toContain('布艺沙发')
    expect(names).toContain('极简卧室')
    expect(names).toContain('梳妆台前')
    expect(names).toContain('纸拉门旁')
    expect(names).toContain('绿植阳台')
    expect(names).toContain('岛台厨房')
    expect(names).toContain('明亮洗漱')
  })

  it('商务办公分类应包含所有规定的 10 个场景名称', () => {
    const cat = SCENE_CATEGORIES.find((c) => c.id === 'business-office')!
    const names = cat.scenes.map((s) => s.name)
    expect(names).toContain('开放工位')
    expect(names).toContain('玻璃会议')
    expect(names).toContain('创意空间')
    expect(names).toContain('独立办公')
    expect(names).toContain('气派大堂')
    expect(names).toContain('休闲沙发')
    expect(names).toContain('设计工台')
    expect(names).toContain('明亮茶水')
    expect(names).toContain('走廊纵深')
    expect(names).toContain('白板幕布')
  })

  it('户外自然分类应包含所有规定的 10 个场景名称', () => {
    const cat = SCENE_CATEGORIES.find((c) => c.id === 'outdoor-nature')!
    const names = cat.scenes.map((s) => s.name)
    expect(names).toContain('透光森林')
    expect(names).toContain('野餐草坪')
    expect(names).toContain('粼粼湖畔')
    expect(names).toContain('蔚蓝海滩')
    expect(names).toContain('玻璃温室')
    expect(names).toContain('银杏大道')
    expect(names).toContain('落日海边')
    expect(names).toContain('冬日雪林')
    expect(names).toContain('繁花树下')
    expect(names).toContain('荒野公路')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 2. SCENE_PRESETS 扁平化列表一致性
// ════════════════════════════════════════════════════════════════════════════

describe('SCENE_PRESETS 扁平化列表', () => {
  it('总共应有 50 个场景（5 大类 × 10 细分）', () => {
    expect(SCENE_PRESETS).toHaveLength(50)
  })

  it('每个预设应包含 id、name、icon、promptDetail、categoryId、categoryName', () => {
    SCENE_PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy()
      expect(preset.name).toBeTruthy()
      expect(preset.icon).toBeTruthy()
      expect(preset.promptDetail).toBeTruthy()
      expect(preset.categoryId).toBeTruthy()
      expect(preset.categoryName).toBeTruthy()
    })
  })

  it('极简纯色分类的所有预设图标应为 ⬜', () => {
    const presets = SCENE_PRESETS.filter((p) => p.categoryId === 'minimal-color')
    presets.forEach((p) => expect(p.icon).toBe('⬜'))
  })

  it('街拍风格分类的所有预设图标应为 🏙️', () => {
    const presets = SCENE_PRESETS.filter((p) => p.categoryId === 'street-style')
    presets.forEach((p) => expect(p.icon).toBe('🏙️'))
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 3. 场景 ID 唯一性校验
// ════════════════════════════════════════════════════════════════════════════

describe('场景 ID 唯一性', () => {
  it('所有细分场景 ID 应全局唯一', () => {
    const allIds = SCENE_PRESETS.map((p) => p.id)
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(allIds.length)
  })

  it('所有大类 ID 应全局唯一', () => {
    const catIds = SCENE_CATEGORIES.map((c) => c.id)
    const uniqueCatIds = new Set(catIds)
    expect(uniqueCatIds.size).toBe(catIds.length)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 4. findSceneById 新旧 ID 兼容性
// ════════════════════════════════════════════════════════════════════════════

describe('findSceneById 兼容性', () => {
  it('应能查找新场景 ID：pure-white', () => {
    const scene = findSceneById('pure-white')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('纯白背景')
    expect(scene!.icon).toBe('⬜')
    expect(scene!.promptDetail).toContain('纯白')
  })

  it('应能查找新场景 ID：azure-beach', () => {
    const scene = findSceneById('azure-beach')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('蔚蓝海滩')
  })

  it('应能查找旧场景 ID：white-bg（向后兼容）', () => {
    const scene = findSceneById('white-bg')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('极简白底')
    expect(scene!.icon).toBe('⬜')
  })

  it('应能查找旧场景 ID：street（向后兼容）', () => {
    const scene = findSceneById('street')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('街拍风格')
  })

  it('应能查找旧场景 ID：home（向后兼容）', () => {
    const scene = findSceneById('home')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('居家场景')
  })

  it('应能查找旧场景 ID：cafe（向后兼容）', () => {
    const scene = findSceneById('cafe')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('咖啡馆')
  })

  it('应能查找旧场景 ID：office（向后兼容）', () => {
    const scene = findSceneById('office')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('商务办公')
  })

  it('应能查找旧场景 ID：outdoor（向后兼容）', () => {
    const scene = findSceneById('outdoor')
    expect(scene).not.toBeNull()
    expect(scene!.name).toBe('户外自然')
  })

  it('不存在的 ID 应返回 null', () => {
    expect(findSceneById('non-existent-id-xyz')).toBeNull()
    expect(findSceneById('')).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 5. buildClothingPrompt：标准场景 + 自定义场景
// ════════════════════════════════════════════════════════════════════════════

describe('buildClothingPrompt', () => {
  it('使用标准场景 ID 应生成包含该场景描述的 prompt', () => {
    const prompt = buildClothingPrompt('pure-white')
    expect(prompt).toContain('时尚摄影大师')
    expect(prompt).toContain('纯白')
    expect(prompt).toContain('亚洲模特')
  })

  it('使用旧场景 ID 应正常生成 prompt（向后兼容）', () => {
    const prompt = buildClothingPrompt('white-bg')
    expect(prompt).toContain('时尚摄影大师')
    expect(prompt).toContain('纯白色背景')
  })

  it('自定义场景非空时应优先使用自定义描述', () => {
    const prompt = buildClothingPrompt('pure-white', '黄昏雨天，湿润地面倒影')
    expect(prompt).toContain('黄昏雨天')
    expect(prompt).toContain('湿润地面倒影')
  })

  it('自定义场景为空字符串时应回退到标准场景', () => {
    const prompt = buildClothingPrompt('azure-beach', '')
    expect(prompt).toContain('蔚蓝')
  })

  it('自定义场景为纯空格时应回退到标准场景', () => {
    const prompt = buildClothingPrompt('azure-beach', '   ')
    expect(prompt).toContain('蔚蓝')
  })

  it('不存在的 ID 且无自定义场景时应使用默认 prompt', () => {
    const prompt = buildClothingPrompt('unknown-scene-id')
    expect(prompt).toContain('时尚摄影大师')
    expect(prompt).toContain('亚洲模特')
  })

  it('自定义场景优先于不存在的场景 ID', () => {
    const prompt = buildClothingPrompt('unknown-id', '极地冰川')
    expect(prompt).toContain('极地冰川')
  })

  it('生成的 prompt 应包含 5 条拍摄要求', () => {
    const prompt = buildClothingPrompt('tatami-room')
    // 检查是否包含编号 1~5
    expect(prompt).toMatch(/1\. /)
    expect(prompt).toMatch(/2\. /)
    expect(prompt).toMatch(/3\. /)
    expect(prompt).toMatch(/4\. /)
    expect(prompt).toMatch(/5\. /)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 6. buildProductPrompt 基础验证
// ════════════════════════════════════════════════════════════════════════════

describe('buildProductPrompt', () => {
  it('应生成包含摄影大师角色描述的 prompt', () => {
    const prompt = buildProductPrompt('living-room')
    expect(prompt).toContain('产品摄影大师')
    expect(prompt).toContain('客厅')
  })

  it('未知场景 ID 应降级为默认客厅场景', () => {
    const prompt = buildProductPrompt('non-existent-product-scene')
    expect(prompt).toContain('客厅')
  })
})
