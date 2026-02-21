/**
 * AuthDialog 弹窗组件测试用例
 *
 * 覆盖范围：
 * - 弹窗显示/隐藏
 * - Tab 切换（密码 / 验证码）
 * - 密码登录完整流程
 * - OTP 验证码登录完整流程
 * - 关闭时重置状态
 * - 注册链接
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthDialog } from '@/components/common/auth-dialog'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRefresh }),
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

function renderDialog(open = true, onClose = jest.fn()) {
  const user = userEvent.setup()
  const result = render(<AuthDialog open={open} onClose={onClose} />)
  return { ...result, user }
}

// ── 测试套件 ────────────────────────────────────────────────────────────────

describe('AuthDialog 弹窗组件', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 1. 显示与隐藏 ────────────────────────────────────────────────────────

  describe('显示与隐藏', () => {
    it('open=true 时应渲染弹窗内容', () => {
      renderDialog(true)
      expect(screen.getByText('欢迎使用 ProShot')).toBeInTheDocument()
    })

    it('open=false 时不应渲染任何内容', () => {
      renderDialog(false)
      expect(screen.queryByText('欢迎使用 ProShot')).not.toBeInTheDocument()
    })

    it('点击关闭按钮应调用 onClose', async () => {
      const onClose = jest.fn()
      const { user } = renderDialog(true, onClose)
      await user.click(screen.getByTestId('dialog-close'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('点击遮罩层应调用 onClose', async () => {
      const onClose = jest.fn()
      const { user } = renderDialog(true, onClose)
      const overlays = document.querySelectorAll('.fixed.inset-0')
      const overlay = overlays[0] as HTMLElement
      await user.click(overlay)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  // ── 2. 显示内容 ──────────────────────────────────────────────────────────

  describe('显示内容', () => {
    it('应显示新用户赠送积分提示', () => {
      renderDialog()
      expect(screen.getByText(/新用户注册即送.*积分/)).toBeInTheDocument()
    })

    it('应显示密码登录和验证码登录两个 Tab', () => {
      renderDialog()
      expect(screen.getByTestId('dialog-tab-password')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-tab-otp')).toBeInTheDocument()
    })

    it('默认应显示密码登录表单', () => {
      renderDialog()
      expect(screen.getByTestId('dialog-form-password')).toBeInTheDocument()
    })

    it('应显示"免费注册"链接，指向 /register', () => {
      renderDialog()
      const registerLink = screen.getByText('免费注册')
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
    })
  })

  // ── 3. Tab 切换 ──────────────────────────────────────────────────────────

  describe('Tab 切换', () => {
    it('点击"验证码登录" Tab 应切换到 OTP 表单', async () => {
      const { user } = renderDialog()
      await user.click(screen.getByTestId('dialog-tab-otp'))
      expect(screen.getByTestId('dialog-form-otp-email')).toBeInTheDocument()
      expect(screen.queryByTestId('dialog-form-password')).not.toBeInTheDocument()
    })

    it('"验证码登录" Tab 切换后 aria-selected 应为 true', async () => {
      const { user } = renderDialog()
      await user.click(screen.getByTestId('dialog-tab-otp'))
      expect(screen.getByTestId('dialog-tab-otp')).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('dialog-tab-password')).toHaveAttribute('aria-selected', 'false')
    })

    it('切换 Tab 应清除上一个表单的错误', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      })
      const { user } = renderDialog()
      await user.type(screen.getByTestId('dialog-login-email'), 'test@example.com')
      await user.type(screen.getByTestId('dialog-login-password'), 'wrongpass')
      await user.click(screen.getByTestId('dialog-login-submit'))
      await screen.findByTestId('dialog-error')
      await user.click(screen.getByTestId('dialog-tab-otp'))
      expect(screen.queryByTestId('dialog-error')).not.toBeInTheDocument()
    })

    it('从 OTP 切换回密码登录应显示密码表单', async () => {
      const { user } = renderDialog()
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.click(screen.getByTestId('dialog-tab-password'))
      expect(screen.getByTestId('dialog-form-password')).toBeInTheDocument()
      expect(screen.queryByTestId('dialog-form-otp-email')).not.toBeInTheDocument()
    })
  })

  // ── 4. 密码登录 ──────────────────────────────────────────────────────────

  describe('密码登录', () => {
    it('正确凭证登录成功后应调用 onClose 和 router.refresh', async () => {
      const onClose = jest.fn()
      mockSignInWithPassword.mockResolvedValueOnce({ error: null })
      const { user } = renderDialog(true, onClose)
      await user.type(screen.getByTestId('dialog-login-email'), 'user@example.com')
      await user.type(screen.getByTestId('dialog-login-password'), 'Password123')
      await user.click(screen.getByTestId('dialog-login-submit'))
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('密码错误时应显示友好提示，不关闭弹窗', async () => {
      const onClose = jest.fn()
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      })
      const { user } = renderDialog(true, onClose)
      await user.type(screen.getByTestId('dialog-login-email'), 'user@example.com')
      await user.type(screen.getByTestId('dialog-login-password'), 'wrongpass')
      await user.click(screen.getByTestId('dialog-login-submit'))
      expect(await screen.findByTestId('dialog-error')).toHaveTextContent('邮箱或密码错误，请重试')
      expect(onClose).not.toHaveBeenCalled()
    })

    it('邮箱未验证时应显示邮箱验证提示', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Email not confirmed' },
      })
      const { user } = renderDialog()
      await user.type(screen.getByTestId('dialog-login-email'), 'unverified@example.com')
      await user.type(screen.getByTestId('dialog-login-password'), 'Password123')
      await user.click(screen.getByTestId('dialog-login-submit'))
      expect(await screen.findByTestId('dialog-error')).toHaveTextContent('邮箱尚未验证，请检查收件箱')
    })

    it('应使用正确参数调用 signInWithPassword', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null })
      const { user } = renderDialog()
      await user.type(screen.getByTestId('dialog-login-email'), 'test@example.com')
      await user.type(screen.getByTestId('dialog-login-password'), 'MyPass123')
      await user.click(screen.getByTestId('dialog-login-submit'))
      await waitFor(() =>
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'MyPass123',
        })
      )
    })
  })

  // ── 5. OTP 验证码登录 ─────────────────────────────────────────────────────

  describe('OTP 验证码登录', () => {
    it('发送 OTP 成功后应进入验证码输入步骤', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderDialog()
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.type(screen.getByTestId('dialog-otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('dialog-otp-send-btn'))
      await screen.findByTestId('dialog-form-otp-code')
      expect(screen.queryByTestId('dialog-form-otp-email')).not.toBeInTheDocument()
    })

    it('验证码正确时应登录成功并关闭弹窗', async () => {
      const onClose = jest.fn()
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      mockVerifyOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderDialog(true, onClose)
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.type(screen.getByTestId('dialog-otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('dialog-otp-send-btn'))
      await screen.findByTestId('dialog-form-otp-code')
      await user.type(screen.getByTestId('dialog-otp-code-input'), '123456')
      await user.click(screen.getByTestId('dialog-otp-verify-btn'))
      await waitFor(() => expect(onClose).toHaveBeenCalled())
    })

    it('验证码错误时应显示错误提示', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      mockVerifyOtp.mockResolvedValueOnce({ error: { message: 'Token has expired or is invalid' } })
      const { user } = renderDialog()
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.type(screen.getByTestId('dialog-otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('dialog-otp-send-btn'))
      await screen.findByTestId('dialog-form-otp-code')
      await user.type(screen.getByTestId('dialog-otp-code-input'), '000000')
      await user.click(screen.getByTestId('dialog-otp-verify-btn'))
      expect(await screen.findByTestId('dialog-error')).toHaveTextContent('Token has expired or is invalid')
    })

    it('点击"重新输入邮箱"应返回邮箱输入步骤', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const { user } = renderDialog()
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.type(screen.getByTestId('dialog-otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('dialog-otp-send-btn'))
      await screen.findByTestId('dialog-form-otp-code')
      await user.click(screen.getByTestId('dialog-otp-back-btn'))
      expect(screen.getByTestId('dialog-form-otp-email')).toBeInTheDocument()
    })
  })

  // ── 6. OTP 倒计时（需要 fake timers）────────────────────────────────────

  describe('OTP 倒计时', () => {
    it('发送验证码后重新发送按钮应处于倒计时禁用状态', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      // 使用 real timers + setup，先触发发送
      const user = userEvent.setup()
      render(<AuthDialog open={true} onClose={jest.fn()} />)
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.type(screen.getByTestId('dialog-otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('dialog-otp-send-btn'))
      await screen.findByTestId('dialog-form-otp-code')
      // 刚发送后倒计时按钮应禁用
      expect(screen.getByTestId('dialog-otp-resend-btn')).toBeDisabled()
    })

    it('倒计时期间重新发送按钮文字应显示剩余秒数', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null })
      const user = userEvent.setup()
      render(<AuthDialog open={true} onClose={jest.fn()} />)
      await user.click(screen.getByTestId('dialog-tab-otp'))
      await user.type(screen.getByTestId('dialog-otp-email'), 'user@example.com')
      await user.click(screen.getByTestId('dialog-otp-send-btn'))
      await screen.findByTestId('dialog-form-otp-code')
      expect(screen.getByTestId('dialog-otp-resend-btn')).toHaveTextContent(/\d+s 后重发/)
    })
  })

  // ── 7. 关闭时重置状态 ────────────────────────────────────────────────────

  describe('关闭时重置状态', () => {
    it('密码登录失败后关闭弹窗应调用 onClose', async () => {
      const onClose = jest.fn()
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      })
      const { user } = renderDialog(true, onClose)
      await user.type(screen.getByTestId('dialog-login-email'), 'test@example.com')
      await user.type(screen.getByTestId('dialog-login-password'), 'wrong')
      await user.click(screen.getByTestId('dialog-login-submit'))
      await screen.findByTestId('dialog-error')
      await user.click(screen.getByTestId('dialog-close'))
      expect(onClose).toHaveBeenCalled()
    })
  })
})
