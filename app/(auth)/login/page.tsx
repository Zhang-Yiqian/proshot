'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black hover:text-gray-500 mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Studio
        </Link>

        <div className="bg-white border border-black p-8 shadow-[12px_12px_0px_0px_#000]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-black bg-black text-white">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-serif font-bold italic tracking-tight">Welcome Back</h1>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-2">Log in to your ProShot account</p>
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
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-black focus-visible:ring-black rounded-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 border border-red-600 bg-red-50 p-3 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-black text-white hover:bg-white hover:text-black border border-black rounded-none uppercase tracking-widest font-bold text-sm transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center text-xs uppercase tracking-widest text-gray-500 border-t border-gray-100 pt-6">
            New here?{' '}
            <Link href="/register" className="text-black font-bold border-b border-black hover:opacity-70 ml-1">
              Join Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}