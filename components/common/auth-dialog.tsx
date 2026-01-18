'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Mail, Lock, Sparkles, Loader2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'

interface AuthDialogProps {
  open: boolean
  onClose: () => void
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setError('密码长度至少为6位')
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })

        if (error) throw error
        onClose()
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        onClose()
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 遮罩 */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* 弹窗 */}
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animate-scale-in">
        <div className="glass-card p-6 mx-4">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* 头部 */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            
            <h2 className="text-2xl font-display font-bold mb-2">
              {mode === 'register' ? '创建账户' : '欢迎回来'}
            </h2>
            
            {mode === 'register' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm">
                <Gift className="h-3.5 w-3.5" />
                <span>注册即送 {siteConfig.credits.initial} 积分</span>
              </div>
            )}
          </div>
          
          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={mode === 'register' ? '至少6位字符' : '输入密码'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full btn-glow" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'register' ? '注册中...' : '登录中...'}
                </>
              ) : (
                mode === 'register' ? '注册并继续' : '登录'
              )}
            </Button>
          </form>

          {/* 切换模式 */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'register' ? (
              <>
                已有账户？{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary font-medium hover:underline"
                >
                  立即登录
                </button>
              </>
            ) : (
              <>
                还没有账户？{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-primary font-medium hover:underline"
                >
                  免费注册
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
