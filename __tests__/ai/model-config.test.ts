/**
 * AI 模型配置测试用例
 *
 * 覆盖范围：
 * - AI_MODELS 常量值验证
 * - 上身图生成和多姿势图使用同一模型
 * - 模型名称格式合法性
 */

import { AI_MODELS } from '@/config/models'

describe('AI_MODELS 模型配置', () => {
  describe('上身图生成模型', () => {
    it('MAIN_IMAGE 应为 google/gemini-3.1-flash-image-preview', () => {
      expect(AI_MODELS.MAIN_IMAGE).toBe('google/gemini-3.1-flash-image-preview')
    })

    it('MAIN_IMAGE 应以 google/ 开头', () => {
      expect(AI_MODELS.MAIN_IMAGE).toMatch(/^google\//)
    })

    it('MAIN_IMAGE 不应为空字符串', () => {
      expect(AI_MODELS.MAIN_IMAGE).not.toBe('')
    })
  })

  describe('多姿势图生成模型', () => {
    it('MULTI_POSE 应为 google/gemini-3.1-flash-image-preview', () => {
      expect(AI_MODELS.MULTI_POSE).toBe('google/gemini-3.1-flash-image-preview')
    })

    it('MULTI_POSE 应以 google/ 开头', () => {
      expect(AI_MODELS.MULTI_POSE).toMatch(/^google\//)
    })

    it('MULTI_POSE 不应为空字符串', () => {
      expect(AI_MODELS.MULTI_POSE).not.toBe('')
    })
  })

  describe('上身图与多姿势图使用同一模型', () => {
    it('MAIN_IMAGE 与 MULTI_POSE 应使用相同模型', () => {
      expect(AI_MODELS.MAIN_IMAGE).toBe(AI_MODELS.MULTI_POSE)
    })
  })

  describe('图片扩展（预留）模型', () => {
    it('EXPAND_IMAGE 不应为空字符串', () => {
      expect(AI_MODELS.EXPAND_IMAGE).not.toBe('')
    })

    it('EXPAND_IMAGE 应以 google/ 开头', () => {
      expect(AI_MODELS.EXPAND_IMAGE).toMatch(/^google\//)
    })
  })

  describe('模型名称格式合法性', () => {
    const allModels = Object.values(AI_MODELS)

    it('所有模型名称格式应为 provider/model-name', () => {
      allModels.forEach((model) => {
        expect(model).toMatch(/^[a-z0-9-]+\/[a-z0-9._-]+$/)
      })
    })

    it('不应含有空格', () => {
      allModels.forEach((model) => {
        expect(model).not.toContain(' ')
      })
    })
  })
})
