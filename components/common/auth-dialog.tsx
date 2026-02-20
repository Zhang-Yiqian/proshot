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
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters')
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
      setError(err.message || 'Operation failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md animate-scale-in">
        <div className="bg-white border border-black p-8 shadow-[12px_12px_0px_0px_#000] mx-4">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-black hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-black bg-black text-white">
              <Sparkles className="h-8 w-8" />
            </div>
            
            <h2 className="text-3xl font-serif font-bold italic mb-2 tracking-tight">
              {mode === 'register' ? 'Join the Studio' : 'Welcome Back'}
            </h2>
            
            {mode === 'register' && (
              <div className="inline-flex items-center gap-2 px-4 py-1 border border-black text-xs font-bold uppercase tracking-widest mt-2">
                <Gift className="h-3 w-3" />
                <span>Get {siteConfig.credits.initial} Credits Free</span>
              </div>
            )}
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-black focus-visible:ring-black rounded-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder={mode === 'register' ? 'Min 6 chars' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-black focus-visible:ring-black rounded-none"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 border-black focus-visible:ring-black rounded-none"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 border border-red-600 bg-red-50 p-3 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-black text-white hover:bg-white hover:text-black border border-black rounded-none uppercase tracking-widest font-bold text-sm transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                mode === 'register' ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-8 text-center text-xs uppercase tracking-widest text-gray-500 border-t border-gray-100 pt-6">
            {mode === 'register' ? (
              <>
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-black font-bold border-b border-black hover:opacity-70 ml-1"
                >
                  Log In
                </button>
              </>
            ) : (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-black font-bold border-b border-black hover:opacity-70 ml-1"
                >
                  Join Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}