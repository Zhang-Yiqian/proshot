-- ============================================
-- ProShot Storage Buckets 创建脚本
-- ============================================

-- 创建 originals bucket（存储用户上传的原图）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'originals',
  'originals',
  true,  -- 公开访问
  52428800,  -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 创建 generated bucket（存储AI生成的图片）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated',
  'generated',
  true,  -- 公开访问
  52428800,  -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for originals bucket
-- ============================================

-- Policy 1: 允许认证用户上传到自己的文件夹
CREATE POLICY "Allow authenticated users to upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'originals' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: 允许所有人读取
CREATE POLICY "Allow public read access to originals"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'originals');

-- Policy 3: 允许用户删除自己的文件
CREATE POLICY "Allow users to delete own files in originals"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'originals'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Storage Policies for generated bucket
-- ============================================

-- Policy 1: 允许服务端（service_role）上传生成的图片
CREATE POLICY "Allow service role to upload generated images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'generated');

-- Policy 2: 允许认证用户上传（如果需要客户端直接上传）
CREATE POLICY "Allow authenticated users to upload generated images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: 允许所有人读取
CREATE POLICY "Allow public read access to generated"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated');

-- Policy 4: 允许用户删除自己的生成图片
CREATE POLICY "Allow users to delete own generated images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 验证创建结果
-- ============================================

-- 查看已创建的 buckets
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
WHERE id IN ('originals', 'generated');

-- 查看 policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%originals%' OR policyname LIKE '%generated%';
