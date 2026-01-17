/**
 * Supabase数据库类型定义
 * 根据PRD中的数据库设计
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          credits: number
          is_subscriber: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          credits?: number
          is_subscriber?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          credits?: number
          is_subscriber?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          original_image_url: string
          generated_image_url: string | null
          prompt_used: string
          style_preset: string
          status: 'pending' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_image_url: string
          generated_image_url?: string | null
          prompt_used: string
          style_preset: string
          status?: 'pending' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_image_url?: string
          generated_image_url?: string | null
          prompt_used?: string
          style_preset?: string
          status?: 'pending' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
