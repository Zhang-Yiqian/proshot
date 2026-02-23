'use client'

import Link from 'next/link'
import { ProShotIcon } from '@/components/common/ProShotIcon'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <ProShotIcon size={24} />
            <span className="font-display font-semibold">ProShot</span>
          </div>

          {/* 链接 */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              关于我们
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              价格方案
            </Link>
            <a href="mailto:support@proshot.ai" className="hover:text-foreground transition-colors">
              联系我们
            </a>
          </div>

          {/* 版权 */}
          <p className="text-sm text-muted-foreground">
            © 2024 ProShot. Powered by Gemini.
          </p>
        </div>
      </div>
    </footer>
  )
}
