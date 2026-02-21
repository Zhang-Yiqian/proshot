/**
 * lib/db/profiles.ts 数据库层测试
 *
 * 覆盖范围：
 *  - getUserProfile
 *  - createUserProfile（初始积分为6）
 *  - deductCredits（含事务安全、余额不足）
 *  - addCredits（含返还场景）
 */

// ── 构造可配置的 Supabase mock ────────────────────────────────────────────

let mockSelectSingle: jest.Mock
let mockUpdateSelectSingle: jest.Mock
let mockInsertSelectSingle: jest.Mock

const createMockFrom = () => {
  mockSelectSingle = jest.fn()
  mockUpdateSelectSingle = jest.fn()
  mockInsertSelectSingle = jest.fn()

  return jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: mockSelectSingle,
      }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockUpdateSelectSingle,
        }),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockInsertSelectSingle,
      }),
    }),
  })
}

let mockFrom: jest.Mock

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}))

jest.mock('@/config/site', () => ({
  siteConfig: {
    credits: {
      initial: 6,
      mainImageCost: 1,
      multiPoseCost: 5,
    },
  },
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getUserProfile, createUserProfile, deductCredits, addCredits } = require('@/lib/db/profiles')

beforeEach(() => {
  jest.clearAllMocks()
  mockFrom = createMockFrom()
})

// ════════════════════════════════════════════════════════════════════════════
// getUserProfile
// ════════════════════════════════════════════════════════════════════════════

describe('getUserProfile', () => {
  it('存在的用户应返回完整的 Profile 对象', async () => {
    mockSelectSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        credits: 6,
        is_subscriber: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    })

    const profile = await getUserProfile('user-1')

    expect(profile).not.toBeNull()
    expect(profile!.id).toBe('user-1')
    expect(profile!.credits).toBe(6)
    expect(profile!.isSubscriber).toBe(false)
  })

  it('不存在的用户应返回 null', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const profile = await getUserProfile('ghost')
    expect(profile).toBeNull()
  })

  it('数据库错误时应返回 null', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const profile = await getUserProfile('any')
    expect(profile).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// createUserProfile
// ════════════════════════════════════════════════════════════════════════════

describe('createUserProfile', () => {
  it('新用户应以初始 6 积分创建 Profile', async () => {
    mockInsertSelectSingle.mockResolvedValue({
      data: {
        id: 'new-user',
        credits: 6,
        is_subscriber: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    })

    const profile = await createUserProfile('new-user')

    expect(profile).not.toBeNull()
    expect(profile!.credits).toBe(6)
    expect(profile!.id).toBe('new-user')
    expect(profile!.isSubscriber).toBe(false)
  })

  it('创建失败时应返回 null', async () => {
    mockInsertSelectSingle.mockResolvedValue({ data: null, error: { message: 'insert error' } })

    const profile = await createUserProfile('fail-user')
    expect(profile).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// deductCredits
// ════════════════════════════════════════════════════════════════════════════

describe('deductCredits', () => {
  it('余额充足时扣除1积分应成功', async () => {
    // getUserProfile 返回 6 积分
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    // update 后返回 5 积分
    mockUpdateSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 5, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await deductCredits('u1', 1)

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(5)
  })

  it('余额充足时扣除5积分应成功', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    mockUpdateSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 1, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await deductCredits('u1', 5)

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(1)
  })

  it('余额恰好等于扣除量时应成功（归零）', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 5, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    mockUpdateSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 0, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await deductCredits('u1', 5)

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(0)
  })

  it('用户不存在时应返回错误', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const result = await deductCredits('ghost', 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('用户不存在')
  })

  it('积分不足时不应调用数据库 update', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 0, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await deductCredits('u1', 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
    // update 不应被调用
    expect(mockUpdateSelectSingle).not.toHaveBeenCalled()
  })

  it('套图积分不足时（余额4 < 5）应失败', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 4, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await deductCredits('u1', 5)

    expect(result.success).toBe(false)
    expect(result.error).toBe('积分不足')
  })

  it('数据库 update 失败时应返回错误', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    mockUpdateSelectSingle.mockResolvedValue({ data: null, error: { message: 'update failed' } })

    const result = await deductCredits('u1', 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('扣除积分失败')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// addCredits（返还）
// ════════════════════════════════════════════════════════════════════════════

describe('addCredits', () => {
  it('返还1积分（主图生成失败）应成功', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 5, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    mockUpdateSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await addCredits('u1', 1)

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(6)
  })

  it('返还5积分（套图生成失败）应成功', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 1, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    mockUpdateSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })

    const result = await addCredits('u1', 5)

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(6)
  })

  it('用户不存在时应返回错误', async () => {
    mockSelectSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const result = await addCredits('ghost', 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('用户不存在')
  })

  it('数据库 update 失败时应返回错误', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { id: 'u1', credits: 5, is_subscriber: false, created_at: '', updated_at: '' },
      error: null,
    })
    mockUpdateSelectSingle.mockResolvedValue({ data: null, error: { message: 'update failed' } })

    const result = await addCredits('u1', 1)

    expect(result.success).toBe(false)
    expect(result.error).toBe('增加积分失败')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 虚扣除 + 返还完整流程（模拟数据库层）
// ════════════════════════════════════════════════════════════════════════════

describe('虚扣除 + 返还完整流程（DB 层）', () => {
  it('扣除1积分 → 生成失败 → 返还1积分 → 余额恢复为6', async () => {
    // 第一次调用 getUserProfile (deductCredits 内)
    mockSelectSingle
      .mockResolvedValueOnce({
        data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
        error: null,
      })
      // 第二次调用 getUserProfile (addCredits 内)
      .mockResolvedValueOnce({
        data: { id: 'u1', credits: 5, is_subscriber: false, created_at: '', updated_at: '' },
        error: null,
      })

    mockUpdateSelectSingle
      .mockResolvedValueOnce({
        data: { id: 'u1', credits: 5, is_subscriber: false, created_at: '', updated_at: '' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'u1', credits: 6, is_subscriber: false, created_at: '', updated_at: '' },
        error: null,
      })

    // 扣除
    const deductResult = await deductCredits('u1', 1)
    expect(deductResult.success).toBe(true)
    expect(deductResult.newBalance).toBe(5)

    // 模拟生成失败，返还
    const addResult = await addCredits('u1', 1)
    expect(addResult.success).toBe(true)
    expect(addResult.newBalance).toBe(6) // 恢复原始余额
  })
})
