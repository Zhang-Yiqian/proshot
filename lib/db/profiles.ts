/**
 * 用户Profile数据库操作
 */

import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/config/site'
import { UserProfile } from '@/types/user'

/**
 * 获取用户Profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id as string,
    credits: data.credits as number,
    isSubscriber: data.is_subscriber as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * 创建新用户Profile
 */
export async function createUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      credits: siteConfig.credits.initial,  // 6
      is_subscriber: false,
    } as any)
    .select()
    .single()

  if (error || !data) {
    console.error('创建用户Profile失败:', error)
    return null
  }

  return {
    id: data.id as string,
    credits: data.credits as number,
    isSubscriber: data.is_subscriber as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

/**
 * 扣除用户积分
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = createClient()

  const profile = await getUserProfile(userId)
  if (!profile) {
    return { success: false, error: '用户不存在' }
  }

  if (profile.credits < amount) {
    return { success: false, error: '积分不足' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      credits: profile.credits - amount,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: '扣除积分失败' }
  }

  return { success: true, newBalance: (data as any).credits }
}

/**
 * 增加用户积分
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = createClient()

  const profile = await getUserProfile(userId)
  if (!profile) {
    return { success: false, error: '用户不存在' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      credits: profile.credits + amount,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: '增加积分失败' }
  }

  return { success: true, newBalance: (data as any).credits }
}
