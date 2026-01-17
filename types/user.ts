/**
 * 用户相关类型定义
 */

export interface UserProfile {
  id: string
  credits: number
  isSubscriber: boolean
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  userId: string
  email: string
  profile: UserProfile
}
