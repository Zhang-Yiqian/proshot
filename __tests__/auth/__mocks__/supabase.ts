/**
 * Supabase client mock
 * 所有认证相关测试均使用此 mock，避免真实网络请求
 */

export const mockSignUp = jest.fn()
export const mockSignInWithPassword = jest.fn()
export const mockSignInWithOtp = jest.fn()
export const mockVerifyOtp = jest.fn()

export const mockSupabaseClient = {
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signInWithOtp: mockSignInWithOtp,
    verifyOtp: mockVerifyOtp,
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))
