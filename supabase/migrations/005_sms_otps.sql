-- SMS OTP 验证码表（自建短信登录流程使用）
CREATE TABLE IF NOT EXISTS sms_otps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 按手机号查询（获取最新有效验证码）
CREATE INDEX IF NOT EXISTS idx_sms_otps_phone ON sms_otps(phone, created_at DESC);

-- 不启用 RLS（仅服务端通过 service_role key 操作）
ALTER TABLE sms_otps DISABLE ROW LEVEL SECURITY;

-- 自动清理过期验证码（可选，防止表膨胀）
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM sms_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
