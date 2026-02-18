# 📦 Supabase Storage Buckets 设置指南

本文档详细说明如何为 ProShot 项目创建和配置 Supabase Storage Buckets。

---

## 📋 前置要求

- ✅ 已有 Supabase 项目
- ✅ 能访问 Supabase Dashboard
- ✅ 已完成数据库初始化

---

## 🎯 需要创建的 Buckets

ProShot 需要 2 个 Storage Buckets：

| Bucket 名称 | 用途 | 公开访问 | 大小限制 |
|------------|------|---------|---------|
| `originals` | 存储用户上传的原图 | ✅ 是 | 50MB |
| `generated` | 存储 AI 生成的图片 | ✅ 是 | 50MB |

---

## 🖱️ 方案 1：通过 Dashboard 创建（推荐新手）

### 步骤 1：访问 Storage 页面

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧菜单 **Storage**

### 步骤 2：创建 originals Bucket

1. 点击右上角 **"New bucket"** 按钮
2. 填写表单：
   ```
   Name: originals
   Public bucket: ✅ 勾选（重要！）
   File size limit: 50 MB
   Allowed MIME types: (留空，允许所有图片)
   ```
3. 点击 **"Create bucket"**

### 步骤 3：创建 generated Bucket

1. 再次点击 **"New bucket"**
2. 填写表单：
   ```
   Name: generated
   Public bucket: ✅ 勾选（重要！）
   File size limit: 50 MB
   Allowed MIME types: (留空)
   ```
3. 点击 **"Create bucket"**

### 步骤 4：配置 Policies（权限）

#### 为 `originals` 创建 Policies：

1. 点击 `originals` bucket
2. 切换到 **"Policies"** 标签
3. 点击 **"New Policy"**

**Policy 1: 允许上传**
- Policy name: `Allow authenticated users to upload`
- Allowed operation: **INSERT** ✅
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'originals' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

**Policy 2: 允许读取**
- Policy name: `Allow public read access`
- Allowed operation: **SELECT** ✅
- Target roles: `public`（默认）
- Policy definition:
  ```sql
  bucket_id = 'originals'
  ```

**Policy 3: 允许删除**
- Policy name: `Allow users to delete own files`
- Allowed operation: **DELETE** ✅
- Target roles: `authenticated`
- Policy definition:
  ```sql
  bucket_id = 'originals' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

#### 为 `generated` 创建相同的 Policies

重复上述步骤，将 `originals` 替换为 `generated`。

---

## 💻 方案 2：通过 SQL Editor 创建（推荐开发者）

### 步骤 1：打开 SQL Editor

1. 在 Supabase Dashboard 左侧菜单点击 **SQL Editor**
2. 点击 **"New query"**

### 步骤 2：执行创建脚本

复制并执行项目中的 SQL 脚本：

**文件位置：** `supabase/migrations/004_create_storage_buckets.sql`

或直接复制以下内容：

```sql
-- 创建 originals bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'originals',
  'originals',
  true,
  52428800,  -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 创建 generated bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated',
  'generated',
  true,
  52428800,  -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- originals bucket policies
CREATE POLICY "Allow authenticated users to upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'originals' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public read access to originals"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'originals');

CREATE POLICY "Allow users to delete own files in originals"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'originals'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- generated bucket policies
CREATE POLICY "Allow authenticated users to upload generated images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'generated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public read access to generated"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'generated');

CREATE POLICY "Allow users to delete own generated images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'generated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 步骤 3：点击 **"Run"** 执行

执行成功后会显示：`Success. No rows returned`

---

## ✅ 验证创建结果

### 方法 1：通过 Dashboard 验证

1. 回到 **Storage** 页面
2. 应该看到 2 个 buckets：
   - ✅ `originals` (Public)
   - ✅ `generated` (Public)

### 方法 2：通过 SQL 验证

在 SQL Editor 中执行：

```sql
-- 查看 buckets
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
WHERE id IN ('originals', 'generated');

-- 查看 policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
AND (policyname LIKE '%originals%' OR policyname LIKE '%generated%')
ORDER BY policyname;
```

预期结果：
- 2 个 buckets（originals, generated）
- 至少 6 个 policies（每个 bucket 3 个）

---

## 🧪 测试 Storage 功能

### 测试上传（通过 Dashboard）

1. 进入 `originals` bucket
2. 点击 **"Upload file"**
3. 选择一张图片上传
4. 上传成功后，点击图片查看 Public URL

### 测试上传（通过代码）

在项目中运行测试：

```javascript
// 测试上传到 originals
const { data, error } = await supabase.storage
  .from('originals')
  .upload('test/sample.jpg', file)

console.log('Upload result:', { data, error })

// 获取 Public URL
const { data: urlData } = supabase.storage
  .from('originals')
  .getPublicUrl('test/sample.jpg')

console.log('Public URL:', urlData.publicUrl)
```

---

## 🔧 常见问题

### Q1: 创建 Bucket 时提示 "Bucket already exists"

**解决方法：** 
- 该 bucket 已存在，无需重复创建
- 检查 Storage 页面确认

### Q2: 上传时提示 "new row violates row-level security policy"

**原因：** Policies 未正确配置

**解决方法：**
1. 检查 bucket 是否设置为 Public
2. 确认已创建正确的 Policies
3. 重新执行 Policy 创建 SQL

### Q3: 图片上传成功但无法访问

**原因：** Bucket 未设置为 Public

**解决方法：**
1. 进入 Storage → 选择 bucket
2. 点击 Settings
3. 确保 **"Public bucket"** 已勾选

### Q4: Policy 创建失败

**可能原因：**
- Policy 名称重复
- SQL 语法错误

**解决方法：**
```sql
-- 先删除已有的 policy（如果需要）
DROP POLICY IF EXISTS "policy_name" ON storage.objects;

-- 再重新创建
CREATE POLICY "policy_name" ...
```

---

## 📚 相关文档

- [Supabase Storage 官方文档](https://supabase.com/docs/guides/storage)
- [Storage Policies 指南](https://supabase.com/docs/guides/storage/security/access-control)
- 项目数据库设置：`DATABASE_SETUP.md`
- 环境变量配置：`SETUP_ENV.md`

---

## 🎉 下一步

Storage Buckets 创建完成后：

1. ✅ 确认 `.env.local` 配置正确
2. ✅ 重启开发服务器：`npm run dev`
3. ✅ 测试上传功能
4. ✅ 开始使用 ProShot！

---

<div align="center">
  <strong>Storage 配置完成！现在可以正常上传和生成图片了 🚀</strong>
</div>
