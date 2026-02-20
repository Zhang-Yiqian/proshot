'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/user'

async function fetchProfile(supabase: ReturnType<typeof createClient>, userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!data) return null
  return {
    id: (data as any).id,
    credits: (data as any).credits,
    isSubscriber: (data as any).is_subscriber,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  }
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 用 ref 持有 supabase 实例，避免 effect 中闭包捕获过时实例
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const p = await fetchProfile(supabase, user.id)
          setProfile(p)
        }
      } catch (err) {
        console.error('[useUser] getUser 失败:', err)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        try {
          if (session?.user) {
            const p = await fetchProfile(supabase, session.user.id)
            setProfile(p)
          } else {
            setProfile(null)
          }
        } catch (err) {
          console.error('[useUser] onAuthStateChange profile 获取失败:', err)
          setProfile(null)
        } finally {
          // 无论成功或失败，都必须关闭 loading，防止导航栏卡在骨架屏状态
          setLoading(false)
        }
      }
    )

    // 页面从后台恢复时主动刷新 session，避免长时间空闲后 token 过期导致状态不同步
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // 有 session 时触发一次刷新，让 onAuthStateChange 处理后续更新
            await supabase.auth.refreshSession()
          }
        } catch (err) {
          console.error('[useUser] visibilitychange 刷新 session 失败:', err)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { user, profile, loading }
}
