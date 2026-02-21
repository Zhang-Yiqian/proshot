/**
 * 积分管理 Hook
 *
 * 提供：
 *  - deductCredit(amount)  立即向后端扣除积分，成功后刷新 UI
 *  - addCredit(amount)     向后端增加积分（生成失败后返还），成功后刷新 UI
 *  - credits               当前积分余额（来自 useUser profile）
 */

'use client'

import { useState, useCallback } from 'react'
import { useUser } from './use-user'

export function useCredits() {
  const { profile, refreshProfile, updateCredits } = useUser()
  const [loading, setLoading] = useState(false)

  const credits = profile?.credits ?? 0

  const deductCredit = useCallback(
    async (amount: number = 1): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
      setLoading(true)
      try {
        const response = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deduct', amount }),
        })

        const result = await response.json()

        if (result.success) {
          // 立即用 API 返回的余额更新 UI，不等 DB 二次读取
          updateCredits(result.newBalance)
          // 后台异步确认 DB 值（不阻塞主流程）
          refreshProfile().catch(() => {})
          return { success: true, newBalance: result.newBalance }
        } else {
          return { success: false, error: result.error }
        }
      } catch {
        return { success: false, error: '扣除积分失败，请重试' }
      } finally {
        setLoading(false)
      }
    },
    [refreshProfile, updateCredits]
  )

  const addCredit = useCallback(
    async (amount: number = 1): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
      setLoading(true)
      try {
        const response = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', amount }),
        })

        const result = await response.json()

        if (result.success) {
          // 立即用 API 返回的余额更新 UI，不等 DB 二次读取
          updateCredits(result.newBalance)
          // 后台异步确认 DB 值（不阻塞主流程）
          refreshProfile().catch(() => {})
          return { success: true, newBalance: result.newBalance }
        } else {
          return { success: false, error: result.error }
        }
      } catch {
        return { success: false, error: '返还积分失败' }
      } finally {
        setLoading(false)
      }
    },
    [refreshProfile, updateCredits]
  )

  return {
    credits,
    loading,
    deductCredit,
    addCredit,
  }
}
