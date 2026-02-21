-- 更新新用户注册默认积分：5 → 6
-- 同时更新 profiles 表的列默认值和触发器函数

-- 1. 更新 profiles 表默认值
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 6;

-- 2. 重建触发器函数，赋予新用户 6 积分
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits, is_subscriber)
  VALUES (NEW.id, 6, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
