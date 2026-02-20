'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/user'

async function fetchProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserProfile | null> {
  console.log(`[useUser] fetchProfile 开始, userId=${userId}`)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.warn('[useUser] fetchProfile 查询错误:', error.code, error.message)
  }

  if (!data) {
    console.warn('[useUser] fetchProfile 未找到 profile，尝试自动创建...')
    // Profile 不存在时自动创建（兜底，防止触发器未执行）
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId, credits: 5, is_subscriber: false } as any)
      .select()
      .single()

    if (createError) {
      console.error('[useUser] 自动创建 profile 失败:', createError.message)
      return null
    }
    console.log('[useUser] 自动创建 profile 成功:', created)
    return {
      id: (created as any).id,
      credits: (created as any).credits,
      isSubscriber: (created as any).is_subscriber,
      createdAt: (created as any).created_at,
      updatedAt: (created as any).updated_at,
    }
  }

  const profile = {
    id: (data as any).id,
    credits: (data as any).credits,
    isSubscriber: (data as any).is_subscriber,
    createdAt: (data as any).created_at,
    updatedAt: (data as any).updated_at,
  }
  console.log(`[useUser] fetchProfile 成功: credits=${profile.credits}`)
  return profile
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 用 ref 持有 supabase 实例，避免 effect 中闭包捕获过时实例
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    let mounted = true

    // 仅通过 onAuthStateChange 管理状态，避免与 getUser() 并发竞态：
    // - INITIAL_SESSION 在订阅注册时立即触发，提供当前 session（来自 cookie/localStorage）
    // - middleware 已在服务端调用 getUser() 刷新了 cookie，所以 INITIAL_SESSION 是最新状态
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log(`[useUser] Auth 事件: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id ?? null,
          email: session?.user?.email ?? null,
        })

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          try {
            const p = await fetchProfile(supabase, currentUser.id)
            if (mounted) setProfile(p)
          } catch (err) {
            console.error('[useUser] profile 获取异常:', err)
            if (mounted) setProfile(null)
          }
        } else {
          setProfile(null)
        }

        // 必须在所有异步操作后才关闭 loading，避免 UI 闪烁
        if (mounted) {
          setLoading(false)
          console.log(`[useUser] loading 已关闭, user=${currentUser?.id ?? 'null'}`)
        }
      }
    )

    // 页面从后台恢复时主动刷新 session，避免长时间空闲后 token 过期导致状态不同步
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('[useUser] 页面变为可见，检查 session...')
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            await supabase.auth.refreshSession()
            console.log('[useUser] session 刷新成功')
          } else {
            console.log('[useUser] 无活跃 session，无需刷新')
          }
        } catch (err) {
          console.error('[useUser] visibilitychange 刷新 session 失败:', err)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { user, profile, loading }
}
