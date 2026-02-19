'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LogOut, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const { user, profile, loading } = useUser()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 1px 0 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
        <div className="flex h-12 items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, hsl(250,80%,60%), hsl(195,85%,50%))',
              boxShadow: '0 2px 8px hsla(250,80%,60%,0.35)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-base tracking-tight group-hover:text-gradient transition-all duration-200">
            ProShot
          </span>
        </Link>

        {/* 导航 */}
        <nav className="flex items-center gap-1">
          {loading ? (
            /* loading 骨架占位，防止导航区闪烁消失 */
            <div className="flex items-center gap-1.5">
              <div className="h-8 w-14 rounded-lg bg-muted/30 animate-pulse" />
              <div className="h-7 w-20 rounded-full bg-muted/20 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-muted/20 animate-pulse" />
            </div>
          ) : user ? (
            <>
              <Link href="/pricing">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-3 text-xs rounded-lg transition-all',
                    pathname === '/pricing'
                      ? 'text-primary bg-primary/8'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  充值
                </Button>
              </Link>

              {/* 积分显示 - 玻璃胶囊 */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                <span className="text-primary font-mono font-bold">{profile?.credits ?? 0}</span>
                <span className="text-muted-foreground/70">积分</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                >
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs rounded-lg btn-glow"
                >
                  免费注册
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
