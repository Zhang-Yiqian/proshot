-- ============================================
-- 步骤 1: 启用 UUID 扩展（如果还没有启用）
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 步骤 2: 创建 profiles 表（用户信息表）
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 5,
  is_subscriber BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ============================================
-- 步骤 3: 创建 generations 表（生成记录表）
-- ============================================
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  prompt_used TEXT NOT NULL,
  style_preset TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ============================================
-- 步骤 4: 创建索引（提高查询性能）
-- ============================================
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

-- ============================================
-- 步骤 5: 创建函数和触发器
-- ============================================

-- 5.1 创建自动创建 Profile 的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, is_subscriber)
  VALUES (NEW.id, 5, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 绑定触发器到 auth.users 表
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.3 创建自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.4 为 profiles 表添加自动更新 updated_at 触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5.5 为 generations 表添加自动更新 updated_at 触发器
DROP TRIGGER IF EXISTS update_generations_updated_at ON generations;
CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 步骤 6: 启用 RLS (Row Level Security)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 7: 创建 RLS 策略
-- ============================================

-- 7.1 Profile 表的策略
DROP POLICY IF EXISTS "用户可以查看自己的Profile" ON profiles;
CREATE POLICY "用户可以查看自己的Profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户可以更新自己的Profile" ON profiles;
CREATE POLICY "用户可以更新自己的Profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 7.2 Generations 表的策略
DROP POLICY IF EXISTS "用户可以查看自己的生成记录" ON generations;
CREATE POLICY "用户可以查看自己的生成记录"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以创建自己的生成记录" ON generations;
CREATE POLICY "用户可以创建自己的生成记录"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的生成记录" ON generations;
CREATE POLICY "用户可以更新自己的生成记录"
  ON generations FOR UPDATE
  USING (auth.uid() = user_id);
