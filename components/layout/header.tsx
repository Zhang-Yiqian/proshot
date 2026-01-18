'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LogOut, Images, CreditCard, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const pathname = usePathname()
  const { user, profile, loading } = useUser()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg group-hover:text-gradient transition-colors">
            ProShot
          </span>
        </Link>

        {/* 导航 */}
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Link href="/gallery">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={pathname === '/gallery' ? 'text-primary' : ''}
                >
                  <Images className="h-4 w-4 mr-1.5" />
                  我的作品
                </Button>
              </Link>
              
              <Link href="/pricing">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={pathname === '/pricing' ? 'text-primary' : ''}
                >
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  充值
                </Button>
              </Link>

              {/* 积分显示 */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm">
                <span className="text-primary font-mono font-bold">
                  {profile?.credits ?? 0}
                </span>
                <span className="text-muted-foreground">积分</span>
              </div>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            !loading && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="btn-glow">
                    免费注册
                  </Button>
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  )
}
