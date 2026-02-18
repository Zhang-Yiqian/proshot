# 🔑 环境变量配置指南

## 快速开始

### 方法一：手动创建（推荐）

1. **在项目根目录创建 `.env.local` 文件**
   ```bash
   touch .env.local
   ```

2. **复制以下内容到 `.env.local` 文件中**
   ```env
   # Supabase 配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here

   # OpenRouter 配置
   OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   OPENROUTER_API_BASE_URL=https://openrouter.ai/api/v1

   # 网站配置
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # 开发调试(可选)
   NEXT_PUBLIC_MOCK_MODE=true
   ```

3. **替换占位符为您的实际秘钥**

### 方法二：使用模板文件

```bash
# 复制模板文件
cp env.example .env.local

# 编辑 .env.local 文件，填入您的秘钥
nano .env.local
# 或使用 VS Code
code .env.local
```

---

## 📋 秘钥清单

需要配置的 **6 个环境变量**：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公开密钥 | `eyJhbGci...` (很长的字符串) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 | `eyJhbGci...` (很长的字符串) |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 | `sk-or-v1-xxxxxxxxxxxxxx` |
| `OPENROUTER_API_BASE_URL` | OpenRouter API 基础 URL | `https://openrouter.ai/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL | `http://localhost:3000` |

---

## 🔍 获取秘钥详细步骤

### 1️⃣ Supabase 秘钥

**步骤：**
1. 访问 [supabase.com](https://supabase.com) 并登录
2. 选择您的项目（或创建新项目）
3. 点击左侧菜单 **Settings** (设置)
4. 点击 **API** 选项
5. 找到以下信息：
   - **Project URL** → 复制到 `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** 下的 **anon public** → 复制到 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** 下的 **service_role** → 复制到 `SUPABASE_SERVICE_ROLE_KEY`

**注意事项：**
- ⚠️ `service_role` 密钥拥有完整数据库权限，请勿泄露
- ✅ `anon` 密钥是公开的，可以在客户端使用

### 2️⃣ OpenRouter API 秘钥

**获取 OpenRouter API Key：**
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册并登录账号
3. 进入 [API Keys 页面](https://openrouter.ai/keys)
4. 点击 **Create Key** 创建新密钥
5. 复制密钥 → `OPENROUTER_API_KEY`
6. Base URL 使用默认值：`https://openrouter.ai/api/v1`

**OpenRouter 优势：**
- ✅ 统一接口调用多个 AI 模型
- ✅ 支持 Google Gemini 2.5 Flash Image（图像生成）
- ✅ 按需付费，无需单独配置各模型 API
- ✅ 自动负载均衡和容错

**注意事项：**
- 项目使用 OpenRouter 的标准接口
- 模型配置在 `config/models.ts` 中
- 支持多模态输入（图片+文本）

---

## ✅ 配置检查

配置完成后，请确认：

```bash
# 检查文件是否存在
ls -la .env.local

# 查看文件内容（不会显示在终端历史）
cat .env.local
```

**检查清单：**
- [ ] `.env.local` 文件已创建
- [ ] 所有 6 个变量都已填写
- [ ] 没有占位符（如 `your_api_key_here`）
- [ ] Supabase URL 以 `https://` 开头
- [ ] API Keys 已正确复制（无多余空格）

---

## 🚀 启动项目

配置完成后，启动开发服务器：

```bash
npm run dev
```

如果之前已经启动过，需要重启：

```bash
# 按 Ctrl+C 停止当前服务器
# 然后重新运行
npm run dev
```

访问：http://localhost:3000

---

## ⚠️ 常见问题

### Q1: 提示 "Supabase URL is required"
**解决方法：** 检查 `.env.local` 文件是否在项目根目录，且变量名拼写正确。

### Q2: 提示 "API Key is invalid"
**解决方法：** 
- 检查 API Key 是否完整复制
- 确认没有多余的空格或换行
- 验证 API Key 是否有效（未过期/被删除）

### Q3: 修改 `.env.local` 后不生效
**解决方法：** 必须重启开发服务器（Ctrl+C 后重新 `npm run dev`）

### Q4: `.env.local` 文件被 Git 追踪
**解决方法：** 
```bash
# 从 Git 追踪中移除（文件本身不会被删除）
git rm --cached .env.local

# .gitignore 已经包含了 .env.local，所以不会再被追踪
```

---

## 🔒 安全建议

1. **永远不要提交 `.env.local` 到 Git**
   - 已在 `.gitignore` 中排除
   - 如果误提交，立即重置密钥

2. **不要在代码中硬编码密钥**
   - 使用 `process.env.VARIABLE_NAME` 访问

3. **区分公开和私密密钥**
   - `NEXT_PUBLIC_*` 前缀的变量会暴露给客户端
   - 其他变量仅在服务端可用

4. **生产环境配置**
   - 在 Vercel/Netlify 等平台的环境变量设置中配置
   - 不要将 `.env.local` 部署到服务器

---

## 📞 需要帮助？

如果配置过程中遇到问题：
1. 检查 `env.example` 文件中的注释
2. 查看 `QUICK_START.md` 完整指南
3. 确认 Supabase 项目已创建并运行
4. 验证 API Keys 是否有效

---

<div align="center">
  <strong>配置完成后即可开始使用 ProShot！</strong> 🎉
</div>
