/**
 * 积分显示徽章组件
 */

'use client'

import { Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/use-user'

export function CreditsBadge() {
  const { profile, loading } = useUser()

  if (loading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Coins className="h-3 w-3" />
        <span>...</span>
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="gap-1">
      <Coins className="h-3 w-3" />
      <span>{profile?.credits ?? 0} 积分</span>
    </Badge>
  )
}
