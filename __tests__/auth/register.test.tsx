/**
 * 注册页面测试用例（三步防刷注册流程）
 *
 * 注册流程：
 *   Step 1 (form)  — 填写邮箱 + 密码 + 确认密码 → 点击"获取验证码" → 发送 OTP
 *   Step 2 (otp)   — 输入6位邮箱验证码 → verifyOtp → updateUser(password) → 跳转首页
 *
 * 覆盖范围：
 * - 页面渲染
 * - 密码可见性切换
 * - Step 1 客户端表单验证（密码规则、确认密码）
 * - Step 1 发送 OTP（成功/失败）
 * - Step 2 OTP 验证（成功/失败/过期/位数不足）
 * - Step 2 重新发送倒计时
 * - 步骤间返回操作
 * - 加载状态
 * - API 调用参数正确性
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '@/app/(auth)/register/page'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('next/link', () => {
  const Link = ({ href, children, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>{children}</a>
  )
  Link.displayName = 'Link'
  return Link
})

jest.mock('@/config/site', () => ({
  siteConfig: { credits: { initial: 6 } },
}))

const mockSignInWithOtp = jest.fn()
const mockVerifyOtp = jest.fn()
const mockUpdateUser = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      updateUser: mockUpdateUser,
    },
  }),
}))

// ── 辅助函数 ────────────────────────────────────────────────────────────────

function renderRegister() {
  const user = userEvent.setup()
  render(<RegisterPage />)
  return { user }
}

/** 填写 Step 1 表单并发送 OTP（mock 成功），进入 Step 2 */
async function goToOtpStep(
  user: ReturnType<typeof userEvent.setup>,
  opts: { email?: string; password?: string; confirm?: string } = {}
) {
  const email = opts.email ?? 'newuser@example.com'
  const password = opts.password ?? 'Password123'
  const confirm = opts.confirm ?? password

  mockSignInWithOtp.mockResolvedValueOnce({ error: null })
  await user.type(screen.getByTestId('register-email'), email)
  await user.type(screen.getByTestId('register-password'), password)
  await user.type(screen.getByTestId('register-confirm-password'), confirm)
  await user.click(screen.getByTestId('register-send-otp'))
  await screen.findByTestId('form-otp')
  return { email, password }
}

// ── 测试套件 ────────────────────────────────────────────────────────────────

describe('注册页面 - RegisterPage（邮箱OTP三步注册）', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 1. 页面渲染（Step 1）────────────────────────────────────────────────

  describe('Step 1 页面渲染', () => {
    it('应正确渲染邮箱、密码、确认密码字段和发送按钮', () => {
      renderRegister()
      expect(screen.getByTestId('register-email')).toBeInTheDocument()
      expect(screen.getByTestId('register-password')).toBeInTheDocument()
      expect(screen.getByTestId('register-confirm-password')).toBeInTheDocument()
      expect(screen.getByTestId('register-send-otp')).toBeInTheDocument()
    })

    it('应显示"创建账号"标题', () => {
      renderRegister()
      expect(screen.getByText('创建账号')).toBeInTheDocument()
    })

    it('应显示新用户赠送积分提示', () => {
      renderRegister()
      expect(screen.getByText(/新用户注册即送.*积分/)).toBeInTheDocument()
    })

    it('应显示"返回登录"链接，指向 /login', () => {
      renderRegister()
      expect(screen.getByText('返回登录').closest('a')).toHaveAttribute('href', '/login')
    })

    it('应显示"直接登录"跳转链接', () => {
      renderRegister()
      expect(screen.getByText('直接登录').closest('a')).toHaveAttribute('href', '/login')
    })

    it('密码和确认密码输入框默认为 type=password', () => {
      renderRegister()
      expect(screen.getByTestId('register-password')).toHaveAttribute('type', 'password')
      expect(screen.getByTestId('register-confirm-password')).toHaveAttribute('type', 'password')
    })

    it('OTP 表单在 Step 1 时不应显示', () => {
      renderRegister()
      expect(screen.queryByTestId('form-otp')).not.toBeInTheDocument()
    })
  })

  // ── 2. 密码可见性切换 ────────────────────────────────────────────────────

  describe('密码可见性切换', () => {
    it('点击密码眼睛图标后应变为可见', async () => {
      const { user } = renderRegister()
      const pwdInput = screen.getByTestId('register-password')
      await user.click(screen.getByTestId('toggle-password'))
      expect(pwdInput).toHaveAttribute('type', 'text')
    })

    it('再次点击应重新隐藏密码', async () => {
      const { user } = renderRegister()
      const pwdInput = screen.getByTestId('register-password')
      await user.click(screen.getByTestId('toggle-password'))
      await user.click(screen.getByTestId('toggle-password'))
      expect(pwdInput).toHaveAttribute('type', 'password')
    })

    it('点击确认密码眼睛图标后应变为可见', async () => {
      const { user } = renderRegister()
      const confirmInput = screen.getByTestId('register-confirm-password')
      await user.click(screen.getByTestId('toggle-confirm'))
      expect(confirmInput).toHaveAttribute('type', 'text')
    })
  })

  // ── 3. Step 1 客户端表单验证 ─────────────────────────────────────────────

  describe('Step 1 表单验证', () => {
    it('密码少于8个字符时应显示错误，不调用 signInWithOtp', async () => {
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), 'Ab1')
      await user.type(screen.getByTestId('register-confirm-password'), 'Ab1')
      await user.click(screen.getByTestId('register-send-otp'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('密码至少需要8个字符')
      expect(mockSignInWithOtp).not.toHaveBeenCalled()
    })

    it('密码不含字母时应显示错误', async () => {
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), '12345678')
      await user.type(screen.getByTestId('register-confirm-password'), '12345678')
      await user.click(screen.getByTestId('register-send-otp'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('密码需包含至少一个字母')
      expect(mockSignInWithOtp).not.toHaveBeenCalled()
    })

    it('密码不含数字时应显示错误', async () => {
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), 'abcdefgh')
      await user.type(screen.getByTestId('register-confirm-password'), 'abcdefgh')
      await user.click(screen.getByTestId('register-send-otp'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('密码需包含至少一个数字')
      expect(mockSignInWithOtp).not.toHaveBeenCalled()
    })

    it('两次密码不一致时应显示错误', async () => {
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), 'Password123')
      await user.type(screen.getByTestId('register-confirm-password'), 'Password456')
      await user.click(screen.getByTestId('register-send-otp'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('两次输入的密码不一致')
      expect(mockSignInWithOtp).not.toHaveBeenCalled()
    })

    it('密码验证按优先级：长度不足时先报长度错误', async () => {
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), 'Ab1')
      await user.type(screen.getByTestId('register-confirm-password'), 'Ab1')
      await user.click(screen.getByTestId('register-send-otp'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('密码至少需要8个字符')
    })
  })

  // ── 4. Step 1 发送 OTP ───────────────────────────────────────────────────

  describe('Step 1 发送 OTP', () => {
    it('验证通过后应调用 signInWithOtp 发送验证码', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user, { email: 'newuser@example.com', password: 'Password123' })
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        options: { shouldCreateUser: true },
      })
    })

    it('发送成功后应切换到 Step 2（OTP 验证界面）', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      expect(screen.getByTestId('form-otp')).toBeInTheDocument()
      expect(screen.queryByTestId('form-register')).not.toBeInTheDocument()
    })

    it('Step 2 应显示目标邮箱地址', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user, { email: 'myemail@test.com' })
      expect(screen.getByText('myemail@test.com')).toBeInTheDocument()
    })

    it('Step 2 应显示"验证邮箱"标题', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      expect(screen.getByText('验证邮箱')).toBeInTheDocument()
    })

    it('发送 OTP 失败时应显示错误，保持在 Step 1', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: { message: 'Rate limit exceeded' } })
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), 'Password123')
      await user.type(screen.getByTestId('register-confirm-password'), 'Password123')
      await user.click(screen.getByTestId('register-send-otp'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('Rate limit exceeded')
      expect(screen.queryByTestId('form-otp')).not.toBeInTheDocument()
    })

    it('发送期间按钮应显示"发送中..."并禁用', async () => {
      let resolve: (v: any) => void
      mockSignInWithOtp.mockReturnValueOnce(new Promise((r) => { resolve = r }))
      const { user } = renderRegister()
      await user.type(screen.getByTestId('register-email'), 'test@example.com')
      await user.type(screen.getByTestId('register-password'), 'Password123')
      await user.type(screen.getByTestId('register-confirm-password'), 'Password123')
      const clickPromise = user.click(screen.getByTestId('register-send-otp'))
      await waitFor(() => expect(screen.getByTestId('register-send-otp')).toBeDisabled())
      expect(screen.getByText('发送中...')).toBeInTheDocument()
      resolve!({ error: null })
      await clickPromise
    })
  })

  // ── 5. Step 2 OTP 验证 ───────────────────────────────────────────────────

  describe('Step 2 OTP 验证', () => {
    it('输入正确验证码后应调用 verifyOtp 和 updateUser，并跳转首页', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ error: null })
      mockUpdateUser.mockResolvedValueOnce({ error: null })
      const { user } = renderRegister()
      const { password } = await goToOtpStep(user, { password: 'MyPass123' })
      await user.type(screen.getByTestId('register-otp-input'), '123456')
      await user.click(screen.getByTestId('register-verify-btn'))
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
      expect(mockRefresh).toHaveBeenCalled()
      expect(mockUpdateUser).toHaveBeenCalledWith({ password })
    })

    it('应使用正确参数调用 verifyOtp', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ error: null })
      mockUpdateUser.mockResolvedValueOnce({ error: null })
      const { user } = renderRegister()
      await goToOtpStep(user, { email: 'user@test.com' })
      await user.type(screen.getByTestId('register-otp-input'), '654321')
      await user.click(screen.getByTestId('register-verify-btn'))
      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          email: 'user@test.com',
          token: '654321',
          type: 'email',
        })
      )
    })

    it('验证码少于6位时应显示错误，不调用 API', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      await user.type(screen.getByTestId('register-otp-input'), '123')
      await user.click(screen.getByTestId('register-verify-btn'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('请输入6位验证码')
      expect(mockVerifyOtp).not.toHaveBeenCalled()
    })

    it('验证码输入框应过滤非数字字符', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      const input = screen.getByTestId('register-otp-input')
      await user.type(input, 'abc123def')
      expect(input).toHaveValue('123')
    })

    it('验证码最长只允许输入6位', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      const input = screen.getByTestId('register-otp-input')
      await user.type(input, '1234567890')
      expect(input).toHaveValue('123456')
    })

    it('验证码错误/过期时应显示友好提示', async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        error: { message: 'Token has expired or is invalid' },
      })
      const { user } = renderRegister()
      await goToOtpStep(user)
      await user.type(screen.getByTestId('register-otp-input'), '000000')
      await user.click(screen.getByTestId('register-verify-btn'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('验证码错误或已过期，请重试')
    })

    it('verifyOtp 成功但 updateUser 失败时应显示错误', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ error: null })
      mockUpdateUser.mockResolvedValueOnce({ error: { message: 'Password too weak' } })
      const { user } = renderRegister()
      await goToOtpStep(user)
      await user.type(screen.getByTestId('register-otp-input'), '123456')
      await user.click(screen.getByTestId('register-verify-btn'))
      expect(await screen.findByTestId('register-error')).toHaveTextContent('Password too weak')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('验证期间按钮应显示"注册中..."并禁用', async () => {
      let resolve: (v: any) => void
      mockVerifyOtp.mockReturnValueOnce(new Promise((r) => { resolve = r }))
      const { user } = renderRegister()
      await goToOtpStep(user)
      await user.type(screen.getByTestId('register-otp-input'), '123456')
      const clickPromise = user.click(screen.getByTestId('register-verify-btn'))
      await waitFor(() => expect(screen.getByTestId('register-verify-btn')).toBeDisabled())
      expect(screen.getByText('注册中...')).toBeInTheDocument()
      resolve!({ error: null })
      await clickPromise
    })
  })

  // ── 6. Step 2 重新发送与倒计时 ───────────────────────────────────────────

  describe('Step 2 重新发送与倒计时', () => {
    it('进入 Step 2 后"重新发送"按钮应处于倒计时禁用状态', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      expect(screen.getByTestId('register-resend-btn')).toBeDisabled()
      expect(screen.getByTestId('register-resend-btn')).toHaveTextContent(/\d+s 后重发/)
    })

    it('60秒后"重新发送"按钮应恢复可用', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<RegisterPage />)
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.type(screen.getByTestId('register-email'), 'user@example.com')
      await user.type(screen.getByTestId('register-password'), 'Password123')
      await user.type(screen.getByTestId('register-confirm-password'), 'Password123')
      await user.click(screen.getByTestId('register-send-otp'))
      await screen.findByTestId('form-otp')
      act(() => { jest.advanceTimersByTime(60000) })
      await waitFor(() => {
        expect(screen.getByTestId('register-resend-btn')).not.toBeDisabled()
        expect(screen.getByTestId('register-resend-btn')).toHaveTextContent('重新发送')
      })
      jest.useRealTimers()
    })

    it('倒计时结束后点击"重新发送"应再次调用 signInWithOtp', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<RegisterPage />)
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.type(screen.getByTestId('register-email'), 'user@example.com')
      await user.type(screen.getByTestId('register-password'), 'Password123')
      await user.type(screen.getByTestId('register-confirm-password'), 'Password123')
      await user.click(screen.getByTestId('register-send-otp'))
      await screen.findByTestId('form-otp')
      act(() => { jest.advanceTimersByTime(60000) })
      await waitFor(() => expect(screen.getByTestId('register-resend-btn')).not.toBeDisabled())
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.click(screen.getByTestId('register-resend-btn'))
      await waitFor(() => expect(mockSignInWithOtp).toHaveBeenCalledTimes(2))
      jest.useRealTimers()
    })
  })

  // ── 7. 步骤间返回操作 ────────────────────────────────────────────────────

  describe('步骤间返回操作', () => {
    it('Step 2 点击"重新输入信息"应返回 Step 1', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      await user.click(screen.getByTestId('otp-back-btn'))
      expect(screen.getByTestId('form-register')).toBeInTheDocument()
      expect(screen.queryByTestId('form-otp')).not.toBeInTheDocument()
    })

    it('返回 Step 1 后验证码输入框应被清空', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      await user.type(screen.getByTestId('register-otp-input'), '123')
      await user.click(screen.getByTestId('otp-back-btn'))
      // 重新进入 Step 2
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.click(screen.getByTestId('register-send-otp'))
      await screen.findByTestId('form-otp')
      expect(screen.getByTestId('register-otp-input')).toHaveValue('')
    })

    it('返回 Step 1 后 Step 1 错误信息应被清空', async () => {
      const { user } = renderRegister()
      await goToOtpStep(user)
      // 触发 Step 2 错误
      mockVerifyOtp.mockResolvedValueOnce({ error: { message: 'Token has expired or is invalid' } })
      await user.type(screen.getByTestId('register-otp-input'), '000000')
      await user.click(screen.getByTestId('register-verify-btn'))
      await screen.findByTestId('register-error')
      // 返回 Step 1
      await user.click(screen.getByTestId('otp-back-btn'))
      expect(screen.queryByTestId('register-error')).not.toBeInTheDocument()
    })
  })
})
