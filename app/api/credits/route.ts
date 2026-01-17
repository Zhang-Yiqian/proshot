/**
 * 积分管理API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deductCredits, addCredits, getUserProfile, createUserProfile } from '@/lib/db/profiles'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 确保用户 Profile 存在
    let profile = await getUserProfile(user.id)
    if (!profile) {
      console.log(`用户 ${user.id} 的 Profile 不存在，正在创建...`)
      profile = await createUserProfile(user.id)
      if (!profile) {
        return NextResponse.json({ success: false, error: '创建用户资料失败' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      credits: profile.credits,
      isSubscriber: profile.isSubscriber,
    })
  } catch (error) {
    console.error('获取积分失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '未登录' }, { status: 401 })
    }

    // 确保用户 Profile 存在
    let profile = await getUserProfile(user.id)
    if (!profile) {
      console.log(`用户 ${user.id} 的 Profile 不存在，正在创建...`)
      profile = await createUserProfile(user.id)
      if (!profile) {
        return NextResponse.json({ success: false, error: '创建用户资料失败' }, { status: 500 })
      }
    }

    const { action, amount } = await request.json()

    if (!action || !amount) {
      return NextResponse.json({ success: false, error: '参数缺失' }, { status: 400 })
    }

    let result

    if (action === 'deduct') {
      result = await deductCredits(user.id, amount)
    } else if (action === 'add') {
      result = await addCredits(user.id, amount)
    } else {
      return NextResponse.json({ success: false, error: '无效操作' }, { status: 400 })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        newBalance: result.newBalance,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('积分操作失败:', error)
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 })
  }
}
