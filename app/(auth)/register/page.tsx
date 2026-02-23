'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, MessageSquare, Loader2,
  ArrowLeft, ChevronLeft, Gift, Eye, EyeOff, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'
import { ProShotIcon } from '@/components/common/ProShotIcon'

/**
 * 注册流程（三步防刷）：
 * 1. form  — 填写邮箱 + 密码 + 确认密码，发送 OTP 到邮箱
 * 2. otp   — 输入6位验证码，验证邮箱真实性
 * 3. done  — 注册成功（调 updateUser 设置密码后跳转）
 */
type Step = 'form' | 'otp'

function validatePassword(pwd: string): string {
  if (pwd.length < 8) return '密码至少需要8个字符'
  if (!/[A-Za-z]/.test(pwd)) return '密码需包含至少一个字母'
  if (!/[0-9]/.test(pwd)) return '密码需包含至少一个数字'
  return ''
}

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('form')

  // Step 1 状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Step 2 状态
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── 倒计时 ──────────────────────────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── Step 1：验证表单并发送 OTP ───────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(password)
    if (pwdError) { setError(pwdError); return }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return }

    setLoading(true)
    try {
      // 用 signInWithOtp 发送验证码（shouldCreateUser: true 允许新用户）
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setStep('otp')
      startCountdown()
    } catch (err: any) {
      setError(err.message || '发送验证码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2：验证 OTP，然后设置密码完成注册 ──────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (otp.length !== 6) { setError('请输入6位验证码'); return }
    setLoading(true)
    try {
      // 验证 OTP（同时完成邮箱确认 & 创建账号 & 登录）
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })
      if (verifyError) throw verifyError

      // OTP 验证通过后，立即设置用户密码
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // 注册完成，跳转首页
      router.push('/')
      router.refresh()
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('验证码错误或已过期，请重试')
      } else {
        setError(err.message || '验证失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── 重新发送 OTP ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
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
          href={step === 'otp' ? '#' : '/login'}
          onClick={step === 'otp' ? (e) => { e.preventDefault(); setStep('form'); setOtp(''); setError('') } : undefined}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 'otp' ? '返回修改信息' : '返回登录'}
        </Link>

        <div className="glass-card p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex justify-center">
              <ProShotIcon size={56} />
            </div>
            {step === 'form' && (
              <>
                <h1 className="text-2xl font-display font-bold">创建账号</h1>
                <p className="text-muted-foreground mt-1 text-sm">填写信息，通过邮箱验证后完成注册</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 rounded-full bg-secondary/10 text-secondary text-sm">
                  <Gift className="h-3.5 w-3.5" />
                  <span>新用户注册即送 {siteConfig.credits.initial} 积分</span>
                </div>
              </>
            )}
            {step === 'otp' && (
              <>
                <h1 className="text-2xl font-display font-bold">验证邮箱</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  验证码已发送至<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </>
            )}
          </div>

          {/* ── Step 1：填写注册信息 ── */}
          {step === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-4" data-testid="form-register">
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                    data-testid="register-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="至少8位，含字母和数字"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    data-testid="register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    data-testid="register-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    data-testid="toggle-confirm"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="register-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-glow"
                disabled={loading}
                data-testid="register-send-otp"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    获取邮箱验证码
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                已有账号？{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  直接登录
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2：输入 OTP 验证邮箱 ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4" data-testid="form-otp">
              <button
                type="button"
                onClick={() => { setStep('form'); setOtp(''); setError('') }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="otp-back-btn"
              >
                <ChevronLeft className="h-4 w-4" />
                重新输入信息
              </button>

              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱验证码</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="输入6位验证码"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl leading-none font-mono tracking-[0.5em] placeholder:text-sm placeholder:tracking-normal placeholder:font-sans"
                  required
                  autoFocus
                  data-testid="register-otp-input"
                />
                <p className="text-xs text-muted-foreground">请检查收件箱及垃圾邮件文件夹</p>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg" data-testid="register-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-glow"
                disabled={loading}
                data-testid="register-verify-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    完成注册
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                没有收到邮件？{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                  data-testid="register-resend-btn"
                >
                  {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
