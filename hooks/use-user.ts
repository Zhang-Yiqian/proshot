'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/user'

// ─── Profile 本地缓存（stale-while-revalidate）────────────────────────────────
// 解决 Supabase profile 接口响应慢时积分区闪烁/空白的问题：
// 登录后将 profile 写入 localStorage；下次加载时立即从缓存恢复，
// 再后台刷新——有变化时才触发重渲染，用户感知不到延迟。
const PROFILE_CACHE_PREFIX = 'proshot_profile_'

function readCachedProfile(userId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_PREFIX + userId)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

function writeCachedProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_CACHE_PREFIX + profile.id, JSON.stringify(profile))
  } catch {}
}

function clearCachedProfile(userId: string): void {
  try {
    localStorage.removeItem(PROFILE_CACHE_PREFIX + userId)
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

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

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        console.log(`[useUser] Auth 事件: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id ?? null,
          email: session?.user?.email ?? null,
        })

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          // Stale-while-revalidate：先从缓存立即恢复，消除接口慢时的空白积分
          const cached = readCachedProfile(currentUser.id)
          if (cached) {
            setProfile(cached)
            console.log(`[useUser] 从缓存恢复 profile: credits=${cached.credits}`)
          }

          // loading 在有无缓存时都立即关闭，Header 不等接口
          setLoading(false)
          console.log(`[useUser] loading 已关闭, user=${currentUser.id}`)

          // 后台刷新，有变化时才更新 UI
          console.log('[useUser] 后台刷新 profile...')
          fetchProfile(supabase, currentUser.id)
            .then((fresh) => {
              if (!mounted || !fresh) return
              // 只在数据变化时更新，避免无意义重渲染
              if (!cached || fresh.credits !== cached.credits || fresh.isSubscriber !== cached.isSubscriber) {
                setProfile(fresh)
                console.log(`[useUser] profile 已刷新: credits=${fresh.credits}（缓存=${cached?.credits ?? 'N/A'}）`)
              } else {
                console.log(`[useUser] profile 无变化，跳过更新: credits=${fresh.credits}`)
              }
              writeCachedProfile(fresh)
            })
            .catch((err) => {
              console.error('[useUser] profile 后台刷新失败:', err)
              // 刷新失败时保留缓存数据，不清空 UI
            })
        } else {
          // 登出时清理缓存
          if (user?.id) clearCachedProfile(user.id)
          setProfile(null)
          setLoading(false)
          console.log('[useUser] loading 已关闭, user=null')
        }
      }
    )

    // 页面从后台恢复时主动刷新 session
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
