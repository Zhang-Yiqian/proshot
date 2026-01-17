-- ============================================
-- 修复缺失的 Profile 记录
-- 为所有已注册但还没有 Profile 的用户创建 Profile
-- ============================================

-- 为所有在 auth.users 中存在但在 profiles 中不存在的用户创建 Profile
INSERT INTO profiles (id, credits, is_subscriber)
SELECT 
  id,
  5,  -- 初始赠送 5 积分
  FALSE  -- 默认不是订阅用户
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 验证：查看所有用户及其 Profile
-- SELECT 
--   u.id,
--   u.email,
--   p.credits,
--   p.is_subscriber
-- FROM auth.users u
-- LEFT JOIN profiles p ON u.id = p.id;
