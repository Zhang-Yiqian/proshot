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
    id: data.id,
    credits: data.credits,
    isSubscriber: data.is_subscriber,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 创建新用户Profile（注册时调用）
 */
export async function createUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      credits: siteConfig.initialCredits, // 初始赠送积分
      is_subscriber: false,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('创建用户Profile失败:', error)
    return null
  }

  return {
    id: data.id,
    credits: data.credits,
    isSubscriber: data.is_subscriber,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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

  // 先检查余额
  const profile = await getUserProfile(userId)
  if (!profile) {
    return { success: false, error: '用户不存在' }
  }

  if (profile.credits < amount) {
    return { success: false, error: '积分不足' }
  }

  // 扣除积分
  const { data, error } = await supabase
    .from('profiles')
    .update({
      credits: profile.credits - amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: '扣除积分失败' }
  }

  return { success: true, newBalance: data.credits }
}

/**
 * 增加用户积分（充值或退款）
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
    })
    .eq('id', userId)
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: '增加积分失败' }
  }

  return { success: true, newBalance: data.credits }
}
