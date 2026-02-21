/**
 * 登录页面测试用例
 *
 * 覆盖范围：
 * - 页面渲染与 Tab 切换
 * - 密码登录：正常登录、邮箱/密码错误、未验证邮箱
 * - OTP 登录：发送验证码、验证码校验、重新发送（倒计时）
 * - 加载状态、错误清除
 * - 跳转到注册页面
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('next/link', () => {
  const Link = ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
  Link.displayName = 'Link'
  return Link
})

const mockSignInWithPassword = jest.fn()
const mockSignInWithOtp = jest.fn()
const mockVerifyOtp = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  }),
}))

// ── 辅助函数 ────────────────────────────────────────────────────────────────

function renderLogin() {
  const user = userEvent.setup()
  render(<LoginPage />)
  return { user }
}

async function goToOtpTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('tab-otp'))
}

async function fillPasswordForm(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string
) {
  await user.type(screen.getByTestId('login-email'), email)
  await user.type(screen.getByTestId('login-password'), password)
}

async function sendOtp(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(screen.getByTestId('otp-email'), email)
  await user.click(screen.getByTestId('otp-send-btn'))
  await screen.findByTestId('form-otp-code')
}

// ── 测试套件 ────────────────────────────────────────────────────────────────

describe('登录页面 - LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 1. 页面渲染 ──────────────────────────────────────────────────────────

  describe('页面渲染', () => {
    it('应正确渲染登录页面标题', () => {
      renderLogin()
      expect(screen.getByText('欢迎回来')).toBeInTheDocument()
    })

    it('默认应显示密码登录 Tab 为选中状态', () => {
      renderLogin()
      expect(screen.getByTestId('tab-password')).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('tab-otp')).toHaveAttribute('aria-selected', 'false')
    })

    it('默认应显示密码登录表单', () => {
      renderLogin()
      expect(screen.getByTestId('form-password')).toBeInTheDocument()
      expect(screen.queryByTestId('form-otp-email')).not.toBeInTheDocument()
    })

    it('应显示"返回首页"链接', () => {
      renderLogin()
      expect(screen.getByText('返回首页').closest('a')).toHaveAttribute('href', '/')
    })

    it('应显示"免费注册"跳转链接，指向 /register', () => {
      renderLogin()
      expect(screen.getByText('免费注册').closest('a')).toHaveAttribute('href', '/register')
    })
  })

  // ── 2. Tab 切换 ──────────────────────────────────────────────────────────

  describe('Tab 切换', () => {
    it('点击"验证码登录" Tab 应切换到 OTP 表单', async () => {
      const { user } = renderLogin()
      await goToOtpTab(user)
      expect(screen.getByTestId('tab-otp')).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('form-otp-email')).toBeInTheDocument()
      expect(screen.queryByTestId('form-password')).not.toBeInTheDocument()
    })

    it('切换 Tab 时应清除错误信息', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'test@example.com', 'wrongpass')
      await user.click(screen.getByTestId('login-submit'))
      await screen.findByTestId('login-error')
      await goToOtpTab(user)
      expect(screen.queryByTestId('login-error')).not.toBeInTheDocument()
    })

    it('从 OTP 切换回密码登录应显示密码表单', async () => {
      const { user } = renderLogin()
      await goToOtpTab(user)
      await user.click(screen.getByTestId('tab-password'))
      expect(screen.getByTestId('form-password')).toBeInTheDocument()
      expect(screen.queryByTestId('form-otp-email')).not.toBeInTheDocument()
    })
  })

  // ── 3. 密码登录 ──────────────────────────────────────────────────────────

  describe('密码登录', () => {
    it('输入正确邮箱和密码后应成功登录并跳转到首页', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'user@example.com', 'Password123')
      await user.click(screen.getByTestId('login-submit'))
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('应使用正确参数调用 signInWithPassword', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'user@example.com', 'MyPass123')
      await user.click(screen.getByTestId('login-submit'))
      await waitFor(() =>
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'MyPass123',
        })
      )
    })

    it('邮箱或密码错误时应显示友好错误提示', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'user@example.com', 'wrongpass')
      await user.click(screen.getByTestId('login-submit'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('邮箱或密码错误，请重试')
    })

    it('邮箱未确认时应显示邮箱验证提示', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Email not confirmed' },
      })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'unverified@example.com', 'Password123')
      await user.click(screen.getByTestId('login-submit'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('邮箱尚未验证，请检查收件箱')
    })

    it('未知服务器错误时应显示原始错误信息', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Service unavailable' },
      })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'user@example.com', 'Password123')
      await user.click(screen.getByTestId('login-submit'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('Service unavailable')
    })

    it('提交期间按钮应显示"登录中..."并禁用', async () => {
      let resolveLogin: (v: any) => void
      mockSignInWithPassword.mockReturnValueOnce(
        new Promise((r) => { resolveLogin = r })
      )
      const { user } = renderLogin()
      await fillPasswordForm(user, 'user@example.com', 'Password123')
      // 不 await，让它卡住
      const clickPromise = user.click(screen.getByTestId('login-submit'))
      await waitFor(() => expect(screen.getByTestId('login-submit')).toBeDisabled())
      expect(screen.getByText('登录中...')).toBeInTheDocument()
      resolveLogin!({ error: null })
      await clickPromise
    })

    it('登录失败后不应跳转到首页', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      })
      const { user } = renderLogin()
      await fillPasswordForm(user, 'user@example.com', 'wrongpass')
      await user.click(screen.getByTestId('login-submit'))
      await screen.findByTestId('login-error')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // ── 4. OTP 验证码登录 - 发送阶段 ─────────────────────────────────────────

  describe('OTP 验证码登录 - 发送验证码', () => {
    it('输入邮箱后点击"获取验证码"应发送 OTP', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await goToOtpTab(user)
      await user.type(screen.getByTestId('otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('otp-send-btn'))
      await waitFor(() =>
        expect(mockSignInWithOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          options: { shouldCreateUser: false },
        })
      )
    })

    it('发送成功后应进入验证码输入步骤', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await goToOtpTab(user)
      await sendOtp(user, 'user@example.com')
      expect(screen.queryByTestId('form-otp-email')).not.toBeInTheDocument()
    })

    it('未注册邮箱发送 OTP 时应显示提示注册的错误', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({
        error: { message: 'Signups not allowed for otp' },
      })
      const { user } = renderLogin()
      await goToOtpTab(user)
      await user.type(screen.getByTestId('otp-email'), 'notexist@example.com')
      await user.click(screen.getByTestId('otp-send-btn'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('该邮箱尚未注册，请先注册')
    })

    it('发送失败时应显示错误信息', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({
        error: { message: 'Rate limit exceeded' },
      })
      const { user } = renderLogin()
      await goToOtpTab(user)
      await user.type(screen.getByTestId('otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('otp-send-btn'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('Rate limit exceeded')
    })
  })

  // ── 5. OTP 验证码登录 - 验证阶段 ─────────────────────────────────────────

  describe('OTP 验证码登录 - 验证码校验', () => {
    async function setupOtpCodeStep(user: ReturnType<typeof userEvent.setup>) {
      await goToOtpTab(user)
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await sendOtp(user, 'user@example.com')
    }

    it('输入正确6位验证码后应成功登录并跳转', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      await user.type(screen.getByTestId('otp-code-input'), '123456')
      await user.click(screen.getByTestId('otp-verify-btn'))
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    })

    it('验证码少于6位时应显示错误提示，不调用 API', async () => {
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      await user.type(screen.getByTestId('otp-code-input'), '123')
      await user.click(screen.getByTestId('otp-verify-btn'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('请输入6位验证码')
      expect(mockVerifyOtp).not.toHaveBeenCalled()
    })

    it('验证码输入框应过滤非数字字符', async () => {
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      const input = screen.getByTestId('otp-code-input')
      await user.type(input, 'abc123def')
      expect(input).toHaveValue('123')
    })

    it('验证码最长只允许6位', async () => {
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      const input = screen.getByTestId('otp-code-input')
      await user.type(input, '1234567890')
      expect(input).toHaveValue('123456')
    })

    it('验证码错误时应显示错误提示', async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        error: { message: 'Token has expired or is invalid' },
      })
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      await user.type(screen.getByTestId('otp-code-input'), '000000')
      await user.click(screen.getByTestId('otp-verify-btn'))
      expect(await screen.findByTestId('login-error')).toHaveTextContent('Token has expired or is invalid')
    })

    it('应使用正确参数调用 verifyOtp', async () => {
      mockVerifyOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      await user.type(screen.getByTestId('otp-code-input'), '654321')
      await user.click(screen.getByTestId('otp-verify-btn'))
      await waitFor(() =>
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          token: '654321',
          type: 'email',
        })
      )
    })

    it('点击"重新输入邮箱"应返回邮箱输入步骤', async () => {
      const { user } = renderLogin()
      await setupOtpCodeStep(user)
      await user.click(screen.getByTestId('otp-back-btn'))
      expect(screen.getByTestId('form-otp-email')).toBeInTheDocument()
      expect(screen.queryByTestId('form-otp-code')).not.toBeInTheDocument()
    })
  })

  // ── 6. OTP 重新发送与倒计时 ──────────────────────────────────────────────

  describe('OTP 重新发送与倒计时', () => {
    it('发送验证码后"重新发送"按钮应处于倒计时禁用状态', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await goToOtpTab(user)
      await sendOtp(user, 'user@example.com')
      expect(screen.getByTestId('otp-resend-btn')).toBeDisabled()
      expect(screen.getByTestId('otp-resend-btn')).toHaveTextContent(/\d+s 后重发/)
    })

    it('倒计时期间"重新发送"按钮应禁用', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderLogin()
      await goToOtpTab(user)
      await sendOtp(user, 'user@example.com')
      expect(screen.getByTestId('otp-resend-btn')).toBeDisabled()
    })

    it('60秒后倒计时结束，"重新发送"按钮应恢复可用', async () => {
      jest.useFakeTimers()
      // 使用 advanceTimers 选项让 userEvent 与 fake timers 协同
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<LoginPage />)
      await user.click(screen.getByTestId('tab-otp'))
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.type(screen.getByTestId('otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('otp-send-btn'))
      await screen.findByTestId('form-otp-code')
      act(() => { jest.advanceTimersByTime(60000) })
      await waitFor(() => {
        expect(screen.getByTestId('otp-resend-btn')).not.toBeDisabled()
        expect(screen.getByTestId('otp-resend-btn')).toHaveTextContent('重新发送')
      })
      jest.useRealTimers()
    })

    it('倒计时结束后点击"重新发送"应再次调用 signInWithOtp', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<LoginPage />)
      await user.click(screen.getByTestId('tab-otp'))
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.type(screen.getByTestId('otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('otp-send-btn'))
      await screen.findByTestId('form-otp-code')
      act(() => { jest.advanceTimersByTime(60000) })
      await waitFor(() => expect(screen.getByTestId('otp-resend-btn')).not.toBeDisabled())
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      await user.click(screen.getByTestId('otp-resend-btn'))
      await waitFor(() => expect(mockSignInWithOtp).toHaveBeenCalledTimes(2))
      jest.useRealTimers()
    })
  })
})
