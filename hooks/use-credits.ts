/**
 * 积分管理Hook
 */

'use client'

import { useState, useCallback } from 'react'
import { useUser } from './use-user'

export function useCredits() {
  const { profile } = useUser()
  const [loading, setLoading] = useState(false)

  const credits = profile?.credits ?? 0

  const refreshCredits = useCallback(async () => {
    // 通过重新获取profile来刷新积分
    // 实际实现会在useUser中自动更新
  }, [])

  const deductCredit = useCallback(async (amount: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deduct', amount }),
      })

      const result = await response.json()
      
      if (result.success) {
        await refreshCredits()
        return { success: true, newBalance: result.newBalance }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: '扣除积分失败' }
    } finally {
      setLoading(false)
    }
  }, [refreshCredits])

  return {
    credits,
    loading,
    deductCredit,
    refreshCredits,
  }
}
