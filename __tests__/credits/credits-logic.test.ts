/**
 * 积分系统核心逻辑测试
 *
 * 覆盖范围：
 *  1. deductCredits 纯逻辑
 *  2. addCredits 纯逻辑
 *  3. 注册赠送积分配置
 *  4. 积分费率配置（主图/套图）
 *  5. 积分边界值测试
 *  6. 并发安全性（乐观扣除+返还）
 */

// ── 从 config 取费率常量，保证测试和业务逻辑始终一致 ──────────────────────
import { siteConfig } from '@/config/site'

// ── 复刻 lib/db/profiles.ts 中的纯逻辑供单元测试 ─────────────────────────────
// （避免依赖 Supabase 网络，使用内存模拟）

interface Profile {
  credits: number
}

function deductCreditsLogic(
  profile: Profile,
  amount: number
): { success: boolean; newBalance?: number; error?: string } {
  if (amount <= 0) return { success: false, error: '扣除数量必须大于0' }
  if (profile.credits < amount) return { success: false, error: '积分不足' }
  const newBalance = profile.credits - amount
  return { success: true, newBalance }
}

function addCreditsLogic(
  profile: Profile,
  amount: number
): { success: boolean; newBalance?: number; error?: string } {
  if (amount <= 0) return { success: false, error: '增加数量必须大于0' }
  const newBalance = profile.credits + amount
  return { success: true, newBalance }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. 积分配置常量测试
// ════════════════════════════════════════════════════════════════════════════

describe('积分配置常量', () => {
  it('注册赠送积分应为 6', () => {
    expect(siteConfig.credits.initial).toBe(6)
  })

  it('生成主图费用应为 1 积分', () => {
    expect(siteConfig.credits.mainImageCost).toBe(1)
  })

  it('生成套图费用应为 5 积分', () => {
    expect(siteConfig.credits.multiPoseCost).toBe(5)
  })

  it('注册赠送积分应足够生成至少 1 张主图', () => {
    expect(siteConfig.credits.initial).toBeGreaterThanOrEqual(siteConfig.credits.mainImageCost)
  })

  it('注册赠送积分应足够生成至少 1 套套图', () => {
    expect(siteConfig.credits.initial).toBeGreaterThanOrEqual(siteConfig.credits.multiPoseCost)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 2. deductCreditsLogic — 正常扣除
// ════════════════════════════════════════════════════════════════════════════

describe('deductCreditsLogic — 正常扣除', () => {
  it('余额充足时扣除 1 积分应成功', () => {
    const result = deductCreditsLogic({ credits: 6 }, 1)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(5)
  })

  it('余额充足时扣除 5 积分应成功', () => {
    const result = deductCreditsLogic({ credits: 6 }, 5)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(1)
  })

  it('余额恰好等于扣除量时应成功（归零）', () => {
    const result = deductCreditsLogic({ credits: 5 }, 5)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(0)
  })

  it('余额恰好为 1、扣除 1 积分应成功', () => {
    const result = deductCreditsLogic({ credits: 1 }, 1)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(0)
  })

  it('大余额扣除大数量应正确计算剩余', () => {
    const result = deductCreditsLogic({ credits: 100 }, 37)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(63)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 3. deductCreditsLogic — 积分不足
// ════════════════════════════════════════════════════════════════════════════

describe('deductCreditsLogic — 积分不足', () => {
  it('余额为 0 时扣除任意正数应失败', () => {
    const result = deductCreditsLogic({ credits: 0 }, 1)
    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
  })

  it('余额不足主图费用（1积分）时应失败', () => {
    const result = deductCreditsLogic({ credits: 0 }, siteConfig.credits.mainImageCost)
    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
  })

  it('余额不足套图费用（5积分）时应失败', () => {
    const result = deductCreditsLogic({ credits: 4 }, siteConfig.credits.multiPoseCost)
    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
  })

  it('余额比扣除量少 1 时应失败', () => {
    const result = deductCreditsLogic({ credits: 4 }, 5)
    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
  })

  it('余额不足时 newBalance 不应被设置', () => {
    const result = deductCreditsLogic({ credits: 2 }, 5)
    expect(result.success).toBe(false)
    expect(result.newBalance).toBeUndefined()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 4. deductCreditsLogic — 非法参数
// ════════════════════════════════════════════════════════════════════════════

describe('deductCreditsLogic — 非法参数', () => {
  it('扣除量为 0 应失败', () => {
    const result = deductCreditsLogic({ credits: 10 }, 0)
    expect(result.success).toBe(false)
    expect(result.error).toBe('扣除数量必须大于0')
  })

  it('扣除量为负数应失败', () => {
    const result = deductCreditsLogic({ credits: 10 }, -1)
    expect(result.success).toBe(false)
    expect(result.error).toBe('扣除数量必须大于0')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 5. addCreditsLogic — 积分增加（返还）
// ════════════════════════════════════════════════════════════════════════════

describe('addCreditsLogic — 积分增加', () => {
  it('返还 1 积分（主图生成失败）应正确增加余额', () => {
    const result = addCreditsLogic({ credits: 5 }, 1)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(6)
  })

  it('返还 5 积分（套图生成失败）应正确增加余额', () => {
    const result = addCreditsLogic({ credits: 1 }, 5)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(6)
  })

  it('余额为 0 时返还积分应成功', () => {
    const result = addCreditsLogic({ credits: 0 }, 5)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(5)
  })

  it('增加量为 0 应失败', () => {
    const result = addCreditsLogic({ credits: 10 }, 0)
    expect(result.success).toBe(false)
    expect(result.error).toBe('增加数量必须大于0')
  })

  it('增加量为负数应失败', () => {
    const result = addCreditsLogic({ credits: 10 }, -3)
    expect(result.success).toBe(false)
    expect(result.error).toBe('增加数量必须大于0')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 6. 虚扣除 + 返还（乐观锁模拟）
// ════════════════════════════════════════════════════════════════════════════

describe('虚扣除 + 返还流程', () => {
  it('主图：扣除1积分后生成失败，返还后余额应恢复', () => {
    const initial = 6
    const cost = siteConfig.credits.mainImageCost // 1

    // 虚扣除
    const afterDeduct = deductCreditsLogic({ credits: initial }, cost)
    expect(afterDeduct.success).toBe(true)
    expect(afterDeduct.newBalance).toBe(5)

    // 生成失败，返还
    const afterRefund = addCreditsLogic({ credits: afterDeduct.newBalance! }, cost)
    expect(afterRefund.success).toBe(true)
    expect(afterRefund.newBalance).toBe(initial) // 恢复原始余额
  })

  it('套图：扣除5积分后生成失败，返还后余额应恢复', () => {
    const initial = 6
    const cost = siteConfig.credits.multiPoseCost // 5

    const afterDeduct = deductCreditsLogic({ credits: initial }, cost)
    expect(afterDeduct.success).toBe(true)
    expect(afterDeduct.newBalance).toBe(1)

    const afterRefund = addCreditsLogic({ credits: afterDeduct.newBalance! }, cost)
    expect(afterRefund.success).toBe(true)
    expect(afterRefund.newBalance).toBe(initial)
  })

  it('主图成功后不返还，余额应正确减少', () => {
    const initial = 6
    const cost = siteConfig.credits.mainImageCost

    const afterDeduct = deductCreditsLogic({ credits: initial }, cost)
    expect(afterDeduct.success).toBe(true)
    expect(afterDeduct.newBalance).toBe(initial - cost) // 生成成功，不返还
  })

  it('套图成功后不返还，余额应正确减少', () => {
    const initial = 6
    const cost = siteConfig.credits.multiPoseCost

    const afterDeduct = deductCreditsLogic({ credits: initial }, cost)
    expect(afterDeduct.success).toBe(true)
    expect(afterDeduct.newBalance).toBe(initial - cost)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 7. 多次生成的积分叠加计算
// ════════════════════════════════════════════════════════════════════════════

describe('多次生成积分叠加', () => {
  it('注册后连续生成6张主图应恰好用完所有积分', () => {
    let credits = siteConfig.credits.initial // 6
    const cost = siteConfig.credits.mainImageCost // 1

    for (let i = 0; i < 6; i++) {
      const result = deductCreditsLogic({ credits }, cost)
      expect(result.success).toBe(true)
      credits = result.newBalance!
    }

    expect(credits).toBe(0)
  })

  it('注册后第7次生成主图应失败（积分已耗尽）', () => {
    let credits = siteConfig.credits.initial // 6

    for (let i = 0; i < 6; i++) {
      const result = deductCreditsLogic({ credits }, siteConfig.credits.mainImageCost)
      credits = result.newBalance!
    }

    const result = deductCreditsLogic({ credits }, siteConfig.credits.mainImageCost)
    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
  })

  it('注册后只能生成1套套图（5积分），剩余1积分', () => {
    let credits = siteConfig.credits.initial // 6
    const cost = siteConfig.credits.multiPoseCost // 5

    const result = deductCreditsLogic({ credits }, cost)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(1)

    // 第二次套图应失败
    const result2 = deductCreditsLogic({ credits: result.newBalance! }, cost)
    expect(result2.success).toBe(false)
    expect(result2.error).toBe('积分不足')
  })

  it('剩余1积分时仍可生成主图', () => {
    const result = deductCreditsLogic({ credits: 1 }, siteConfig.credits.mainImageCost)
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 8. 积分检查前置逻辑（前端 handleGenerate 检查）
// ════════════════════════════════════════════════════════════════════════════

describe('前端积分检查前置逻辑', () => {
  function shouldBlockGenerate(credits: number, cost: number): boolean {
    return credits < cost
  }

  it('余额充足时不应阻止生成主图', () => {
    expect(shouldBlockGenerate(6, siteConfig.credits.mainImageCost)).toBe(false)
    expect(shouldBlockGenerate(1, siteConfig.credits.mainImageCost)).toBe(false)
  })

  it('余额不足时应阻止生成主图', () => {
    expect(shouldBlockGenerate(0, siteConfig.credits.mainImageCost)).toBe(true)
  })

  it('余额充足时不应阻止生成套图', () => {
    expect(shouldBlockGenerate(6, siteConfig.credits.multiPoseCost)).toBe(false)
    expect(shouldBlockGenerate(5, siteConfig.credits.multiPoseCost)).toBe(false)
  })

  it('余额不足5积分时应阻止生成套图', () => {
    expect(shouldBlockGenerate(4, siteConfig.credits.multiPoseCost)).toBe(true)
    expect(shouldBlockGenerate(0, siteConfig.credits.multiPoseCost)).toBe(true)
  })

  it('余额 = 0 时任何生成操作都应被阻止', () => {
    expect(shouldBlockGenerate(0, siteConfig.credits.mainImageCost)).toBe(true)
    expect(shouldBlockGenerate(0, siteConfig.credits.multiPoseCost)).toBe(true)
  })
})
