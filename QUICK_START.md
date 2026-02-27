# 🚀 ProShot 快速启动指南

## ✅ 项目已创建完成

恭喜！您的 ProShot（上镜）项目已经完整搭建完成。

---

## 📦 第一步：安装依赖

在项目根目录执行：

```bash
npm install
```

这将安装以下核心依赖：
- ✅ Next.js 14 (App Router)
- ✅ React 18
- ✅ Tailwind CSS
- ✅ Shadcn/UI 组件库
- ✅ Supabase Client
- ✅ TypeScript
- ✅ Lucide Icons

---

## 🔧 第二步：配置环境变量

### 1. 创建 Supabase 项目

访问 [supabase.com](https://supabase.com)，创建新项目并获取：
- Project URL
- Anon Key
- Service Role Key

### 2. 配置 OpenRouter API

访问 [OpenRouter](https://openrouter.ai/keys) 并获取：
- API Key（格式：sk-or-v1-xxxxx）
- Base URL：https://openrouter.ai/api/v1

### 3. 创建 `.env.local` 文件

在项目根目录创建文件并填入：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter 配置
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxx
OPENROUTER_API_BASE_URL=https://openrouter.ai/api/v1

# 网站配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 开发调试(可选)
NEXT_PUBLIC_MOCK_MODE=true
```

---

## 🗄️ 第三步：初始化数据库

### 1. 进入 Supabase Dashboard

打开您的 Supabase 项目控制台

### 2. 执行 SQL 脚本

在 SQL Editor 中执行 `supabase/migrations/001_initial_schema.sql` 文件内容

这将创建：
- ✅ `profiles` 表（用户信息和积分）
- ✅ `generations` 表（生成记录）
- ✅ RLS 安全策略
- ✅ 自动创建 Profile 的触发器

### 3. 创建 Storage Bucket

在 Storage 页面创建以下 Bucket（设置为 Public）：
- `originals` - 存储用户上传的原图
- `generated` - 存储生成的结果图

---

## 🎨 第四步：启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

---

## 🧪 第五步：测试功能

### 1. 注册新用户
- 访问 http://localhost:3000/register
- 输入邮箱和密码注册
- 系统自动赠送 5 积分

### 2. 上传商品图
- 进入工作台 http://localhost:3000/workbench
- 拖拽上传一张服装图片

### 3. 选择风格
- 选择模特类型（例如：亚洲女性）
- 选择场景（例如：街拍风格）

### 4. 生成图片
- 点击"一键上镜"按钮
- 等待 AI 生成结果（约30秒）

### 5. 下载图片
- 预览生成的图片
- 点击下载（消耗1积分）

---

## 📚 项目结构说明

详细的项目结构请查看：
- 📄 `PROJECT_STRUCTURE.md` - 完整目录树和文件说明
- 📄 `README.md` - 项目介绍和技术栈
- 📄 `PRD.md` - 产品需求文档

---

## 🔑 核心文件位置

| 功能 | 文件路径 |
|------|----------|
| 首页 | `app/page.tsx` |
| 工作台 | `app/workbench/page.tsx` |
| 登录页 | `app/(auth)/login/page.tsx` |
| 生成API | `app/api/generate/main/route.ts` |
| AI封装 | `lib/ai/gemini-client.ts` |
| 预设配置 | `config/presets.ts` |
| 数据库Schema | `supabase/migrations/001_initial_schema.sql` |

---

## 🛠️ 常用命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

---

## ⚠️ 注意事项

### OpenRouter API 调用

当前 `lib/ai/gemini-client.ts` 通过 OpenRouter 调用 Google Gemini 3.1 Flash Image Preview：

```typescript
// 请求格式
POST /api/v1/chat/completions
{
  "model": "google/gemini-3.1-flash-image-preview",
  "messages": [{ 
    "role": "user", 
    "content": [
      { "type": "image_url", "image_url": { "url": "..." } },
      { "type": "text", "text": "..." }
    ]
  }],
  "modalities": ["image", "text"],
  "image_config": {
    "aspect_ratio": "3:4",
    "image_size": "2K"
  }
}
```

输出配置：
- 宽高比：3:4（适合电商商拍）
- 分辨率：2K 高清
- 模态：图片+文本（仅提取图片）

### Storage Bucket 权限

确保 Supabase Storage Bucket 设置为 **Public**，否则生成的图片 URL 无法访问。

### 数据库触发器

注册新用户时，数据库触发器会自动创建 Profile 并赠送 5 积分。如果触发器未生效，请检查 SQL 脚本是否执行成功。

---

## 🎯 后续优化建议

### 功能扩展
- [ ] 多姿势图扩展功能（生成4张不同姿态）
- [ ] 批量生成（一次上传多张）
- [ ] 历史记录筛选和搜索
- [ ] 水印添加功能
- [ ] 支付集成（积分充值）

### 性能优化
- [ ] 图片压缩和优化
- [ ] CDN 加速
- [ ] 缓存策略
- [ ] 生成队列（Redis）

### 体验优化
- [ ] 生成进度实时显示
- [ ] 预览图自动刷新
- [ ] 拖拽排序生成结果
- [ ] 一键分享到社交平台

---

## 🤝 需要帮助？

如有问题，请检查：
1. 环境变量是否配置正确
2. Supabase 数据库是否初始化成功
3. Storage Bucket 是否创建并设置为 Public
4. Gemini API 是否可用

---

## 🎉 开始使用

现在您可以：
1. ✅ 运行 `npm install`
2. ✅ 配置 `.env.local`
3. ✅ 初始化 Supabase 数据库
4. ✅ 运行 `npm run dev`
5. ✅ 访问 http://localhost:3000

**祝您使用愉快！🚀**

---

<div align="center">
  <strong>Made with ❤️ by ProShot Team</strong>
</div>
