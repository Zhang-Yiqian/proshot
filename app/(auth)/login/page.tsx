'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, MessageSquare, Sparkles, Loader2, ArrowLeft, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

type LoginMethod = 'password' | 'otp'
type OtpStep = 'email' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [method, setMethod] = useState<LoginMethod>('password')

  // 密码登录状态
  const [pwdEmail, setPwdEmail] = useState('')
  const [pwdPassword, setPwdPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 验证码登录状态
  const [otpStep, setOtpStep] = useState<OtpStep>('email')
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const switchMethod = (m: LoginMethod) => {
    setMethod(m)
    setError('')
  }

  // ── 验证码倒计时 ──────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── 密码登录 ──────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: pwdEmail,
        password: pwdPassword,
      })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('邮箱或密码错误，请重试')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('邮箱尚未验证，请检查收件箱')
      } else {
        setError(err.message || '登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── OTP：发送验证码 ───────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      setOtpStep('code')
      startCountdown()
    } catch (err: any) {
      if (err.message?.includes('Signups not allowed')) {
        setError('该邮箱尚未注册，请先注册')
      } else {
        setError(err.message || '发送失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── OTP：验证码校验 ───────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) { setError('请输入6位验证码'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otp,
        type: 'email',
      })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '验证码错误或已过期，请重试')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP：重新发送 ─────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      startCountdown()
    } catch (err: any) {
      setError(err.message || '重新发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <div className="glass-card p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">欢迎回来</h1>
            <p className="text-muted-foreground mt-1 text-sm">选择登录方式</p>
          </div>

          {/* 登录方式切换 Tab */}
          <div className="flex rounded-xl bg-muted/40 p-1 mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={method === 'password'}
              onClick={() => switchMethod('password')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
                method === 'password'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-password"
            >
              <Lock className="h-3.5 w-3.5" />
              密码登录
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === 'otp'}
              onClick={() => switchMethod('otp')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
                method === 'otp'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-otp"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              验证码登录
            </button>
          </div>

          {/* ── 密码登录表单 ── */}
          {method === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4" data-testid="form-password">
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={pwdEmail}
                    onChange={(e) => setPwdEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                    data-testid="login-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={pwdPassword}
                    onChange={(e) => setPwdPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="login-error">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full btn-glow" disabled={loading} data-testid="login-submit">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>
          )}

          {/* ── 验证码登录表单 ── */}
          {method === 'otp' && (
            <>
              {otpStep === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-4" data-testid="form-otp-email">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                        data-testid="otp-email"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="login-error">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full btn-glow" disabled={loading} data-testid="otp-send-btn">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        获取验证码
                      </>
                    )}
                  </Button>
                </form>
              )}

              {otpStep === 'code' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4" data-testid="form-otp-code">
                  <button
                    type="button"
                    onClick={() => { setOtpStep('email'); setOtp(''); setError('') }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="otp-back-btn"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    重新输入邮箱
                  </button>

                  <p className="text-sm text-muted-foreground">
                    验证码已发送至{' '}
                    <span className="font-medium text-foreground">{otpEmail}</span>
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">验证码</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="输入6位验证码"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl leading-none font-mono tracking-[0.5em] placeholder:text-sm placeholder:tracking-normal placeholder:font-sans"
                      required
                      autoFocus
                      data-testid="otp-code-input"
                    />
                    <p className="text-xs text-muted-foreground">请检查收件箱及垃圾邮件文件夹</p>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="login-error">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full btn-glow" disabled={loading} data-testid="otp-verify-btn">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        验证中...
                      </>
                    ) : (
                      '登录'
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    没有收到邮件？{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0 || loading}
                      className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                      data-testid="otp-resend-btn"
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* 底部注册入口 */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              免费注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
