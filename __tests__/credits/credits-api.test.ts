/**
 * 积分 API 路由测试（/api/credits）
 *
 * 覆盖范围：
 *  GET  /api/credits  — 查询积分
 *  POST /api/credits  — 扣除/增加积分
 *
 * 所有数据库和认证操作均通过 mock 完成，不发起真实网络请求
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// ── Mock Supabase server client ───────────────────────────────────────────
const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

// ── Mock lib/db/profiles ──────────────────────────────────────────────────
const mockGetUserProfile = jest.fn()
const mockDeductCredits = jest.fn()
const mockAddCredits = jest.fn()
const mockCreateUserProfile = jest.fn()

jest.mock('@/lib/db/profiles', () => ({
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  deductCredits: (...args: unknown[]) => mockDeductCredits(...args),
  addCredits: (...args: unknown[]) => mockAddCredits(...args),
  createUserProfile: (...args: unknown[]) => mockCreateUserProfile(...args),
}))

// ── 工具函数：构造 NextRequest ─────────────────────────────────────────────
function makeRequest(method: string, body?: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/credits', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── 导入被测模块（在 mock 设置后导入）────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET, POST } = require('@/app/api/credits/route')

// ════════════════════════════════════════════════════════════════════════════
// GET /api/credits
// ════════════════════════════════════════════════════════════════════════════

describe('GET /api/credits', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('未登录用户应返回 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: '未登录' } })

    const res = await GET(makeRequest('GET'))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error).toBe('未登录')
  })

  it('已登录用户应返回当前积分余额', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    mockGetUserProfile.mockResolvedValue({ id: 'user-123', credits: 6, isSubscriber: false })

    const res = await GET(makeRequest('GET'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.credits).toBe(6)
  })

  it('用户 Profile 不存在时应自动创建并返回初始积分', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null })
    mockGetUserProfile.mockResolvedValue(null)
    mockCreateUserProfile.mockResolvedValue({ id: 'new-user', credits: 6, isSubscriber: false })

    const res = await GET(makeRequest('GET'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.credits).toBe(6)
    expect(mockCreateUserProfile).toHaveBeenCalledWith('new-user')
  })

  it('Profile 不存在且创建失败时应返回 500', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-err' } }, error: null })
    mockGetUserProfile.mockResolvedValue(null)
    mockCreateUserProfile.mockResolvedValue(null)

    const res = await GET(makeRequest('GET'))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.success).toBe(false)
  })

  it('isSubscriber 字段应随 Profile 一并返回', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'sub-user' } }, error: null })
    mockGetUserProfile.mockResolvedValue({ id: 'sub-user', credits: 50, isSubscriber: true })

    const res = await GET(makeRequest('GET'))
    const json = await res.json()

    expect(json.isSubscriber).toBe(true)
    expect(json.credits).toBe(50)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// POST /api/credits — deduct（扣除）
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/credits — action: deduct', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    mockGetUserProfile.mockResolvedValue({ id: 'user-123', credits: 6, isSubscriber: false })
  })

  it('未登录时扣除应返回 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: '未登录' } })

    const res = await POST(makeRequest('POST', { action: 'deduct', amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.success).toBe(false)
  })

  it('扣除上身图费用（1积分）成功应返回新余额', async () => {
    mockDeductCredits.mockResolvedValue({ success: true, newBalance: 5 })

    const res = await POST(makeRequest('POST', { action: 'deduct', amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.newBalance).toBe(5)
    expect(mockDeductCredits).toHaveBeenCalledWith('user-123', 1)
  })

  it('扣除多姿势图费用（5积分）成功应返回新余额', async () => {
    mockDeductCredits.mockResolvedValue({ success: true, newBalance: 1 })

    const res = await POST(makeRequest('POST', { action: 'deduct', amount: 5 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.newBalance).toBe(1)
    expect(mockDeductCredits).toHaveBeenCalledWith('user-123', 5)
  })

  it('积分不足时应返回 400 及错误信息', async () => {
    mockDeductCredits.mockResolvedValue({ success: false, error: '积分不足' })

    const res = await POST(makeRequest('POST', { action: 'deduct', amount: 5 }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('积分不足')
  })

  it('缺少 amount 参数应返回 400', async () => {
    const res = await POST(makeRequest('POST', { action: 'deduct' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('参数缺失')
  })

  it('缺少 action 参数应返回 400', async () => {
    const res = await POST(makeRequest('POST', { amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('无效 action 应返回 400', async () => {
    const res = await POST(makeRequest('POST', { action: 'invalid', amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('无效操作')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// POST /api/credits — add（增加/返还）
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/credits — action: add', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    mockGetUserProfile.mockResolvedValue({ id: 'user-123', credits: 5, isSubscriber: false })
  })

  it('返还上身图费用（1积分）应成功', async () => {
    mockAddCredits.mockResolvedValue({ success: true, newBalance: 6 })

    const res = await POST(makeRequest('POST', { action: 'add', amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.newBalance).toBe(6)
    expect(mockAddCredits).toHaveBeenCalledWith('user-123', 1)
  })

  it('返还多姿势图费用（5积分）应成功', async () => {
    mockAddCredits.mockResolvedValue({ success: true, newBalance: 6 })

    const res = await POST(makeRequest('POST', { action: 'add', amount: 5 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.newBalance).toBe(6)
    expect(mockAddCredits).toHaveBeenCalledWith('user-123', 5)
  })

  it('未登录时增加积分应返回 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: '未登录' } })

    const res = await POST(makeRequest('POST', { action: 'add', amount: 1 }))
    expect(res.status).toBe(401)
  })

  it('增加积分失败时应返回 400', async () => {
    mockAddCredits.mockResolvedValue({ success: false, error: '数据库错误' })

    const res = await POST(makeRequest('POST', { action: 'add', amount: 1 }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('数据库错误')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// POST /api/credits — 自动创建 Profile
// ════════════════════════════════════════════════════════════════════════════

describe('POST /api/credits — 新用户自动创建 Profile', () => {
  it('Profile 不存在时应自动创建后再执行操作', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'brand-new' } }, error: null })
    mockGetUserProfile.mockResolvedValue(null)
    mockCreateUserProfile.mockResolvedValue({ id: 'brand-new', credits: 6, isSubscriber: false })
    mockDeductCredits.mockResolvedValue({ success: true, newBalance: 5 })

    const res = await POST(makeRequest('POST', { action: 'deduct', amount: 1 }))
    const json = await res.json()

    expect(mockCreateUserProfile).toHaveBeenCalledWith('brand-new')
    expect(json.success).toBe(true)
  })
})
