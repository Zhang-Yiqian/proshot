'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { VogueLogo } from '@/components/VogueLogo'

export function Header() {
  const pathname = usePathname()
  const { user, profile, loading } = useUser()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-black">
      <div className="flex h-16 items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Editorial Logo */}
        <Link href="/" className="group flex items-center gap-4">
          <VogueLogo className="scale-90 origin-left transition-transform group-hover:scale-100" />
        </Link>

        {/* Navigation - Minimalist */}
        <nav className="flex items-center gap-6">
          {loading ? (
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-100 animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 animate-pulse" />
            </div>
          ) : user ? (
            <>
              <Link href="/pricing" className="text-sm font-medium uppercase tracking-widest hover:text-black/60 transition-colors">
                 Pricing
              </Link>

              {/* Credits Display - Minimal Text */}
              <div className="flex items-center gap-2 text-sm font-serif italic border-l border-black pl-6 ml-2">
                <span className="font-bold not-italic font-sans">{profile?.credits ?? 0}</span>
                <span className="text-gray-500">Credits</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 hover:bg-black hover:text-white rounded-none transition-colors ml-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium uppercase tracking-widest hover:text-black/60 transition-colors">
                Log In
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-black text-white hover:bg-white hover:text-black border border-black rounded-none uppercase tracking-widest text-xs px-6">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}