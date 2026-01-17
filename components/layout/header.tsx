/**
 * 全局头部导航组件
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreditsBadge } from '@/components/common/credits-badge'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const pathname = usePathname()
  const { user, loading } = useUser()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      {/* 顶部卖点横幅 */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b">
        <div className="container py-2 text-center">
          <p className="text-sm">
            <span className="font-semibold">🚀 由 Google Gemini 最先进大模型驱动</span>
            <span className="mx-2 text-muted-foreground">|</span>
            <span className="text-muted-foreground">30秒生成专业商拍图</span>
            <span className="mx-2 text-muted-foreground">|</span>
            <span className="text-primary font-medium">新用户注册送5积分</span>
          </p>
        </div>
      </div>

      {/* 主导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>ProShot 上镜</span>
          </Link>

          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  href="/gallery"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/gallery' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  我的作品
                </Link>
                <Link
                  href="/pricing"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/pricing' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  充值
                </Link>
                <CreditsBadge />
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {!loading && (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        登录
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">免费注册</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}
