# ProShot 上镜 - 电商智能商拍工具

<div align="center">
  <h3>让商品一键入画</h3>
  <p>将普通商品图转化为高质量真人模特营销图</p>
</div>

## 📖 项目简介

ProShot（上镜）是一款面向电商卖家的AI驱动商拍工具，专为淘宝、拼多多、Shopify卖家打造。通过AI技术，将普通的人台图、平铺图低成本转化为专业的真人模特营销图。

## ✨ 核心功能

- 🎨 **智能生成**：基于Gemini AI模型，30秒内生成高质量营销图
- 🔗 **Dify 工作流**：支持通过Dify平台编排AI工作流，灵活配置生成逻辑
- 👔 **多种预设**：支持多种模特类型（亚洲/欧美，男/女）和场景（街拍/居家/咖啡馆等）
- 💎 **高还原度**：精准保留商品Logo、版型、细节
- 💰 **积分系统**：预览免费，下载仅需1积分
- 📱 **现代UI**：基于Shadcn/UI构建，界面美观专业

## 🛠️ 技术栈

### 前端
- **Next.js 14** (App Router) - React框架
- **Tailwind CSS** - 样式处理
- **Shadcn/UI** - 组件库
- **Lucide React** - 图标库
- **TypeScript** - 类型安全

### 后端
- **Next.js API Routes** - API层
- **Supabase** - 数据库、认证、存储
  - PostgreSQL数据库
  - Auth认证系统
  - Storage文件存储
- **Dify 工作流** - AI 工作流编排（主推）
  - Gemini 2.5 Pro (服饰上身生成)
  - 可视化配置提示词和流程
- **OpenRouter** - AI模型调用（备选方案）
  - gemini-3-pro-image (主图生成)
  - gemini-2-flash-image (套图扩展)

## 📁 项目结构

```
ProShot/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证页面组
│   │   ├── login/           # 登录页
│   │   └── register/        # 注册页
│   ├── workbench/           # 工作台
│   ├── gallery/             # 作品画廊
│   ├── pricing/             # 定价页面
│   └── api/                 # API Routes
│       ├── auth/            # 认证相关
│       ├── generate/        # 图片生成
│       ├── credits/         # 积分管理
│       └── generations/     # 生成记录
├── components/              # React组件
│   ├── ui/                  # Shadcn/UI基础组件
│   ├── layout/              # 布局组件
│   ├── workbench/           # 工作台组件
│   └── common/              # 通用组件
├── lib/                     # 工具库
│   ├── supabase/            # Supabase集成
│   ├── ai/                  # AI接口封装
│   ├── db/                  # 数据库操作
│   └── utils/               # 工具函数
├── config/                  # 配置文件
│   ├── site.ts              # 网站配置
│   ├── models.ts            # AI模型配置
│   └── presets.ts           # 预设配置
├── types/                   # TypeScript类型
└── hooks/                   # 自定义Hooks
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Dify 工作流配置（推荐）
DIFY_API_KEY=app-your-dify-api-key
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=your-workflow-id

# OpenRouter 配置（可选）
OPENROUTER_API_KEY=sk-or-v1-your-api-key
OPENROUTER_API_BASE_URL=https://openrouter.ai/api/v1

# 网站配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 开发模式（可选）
NEXT_PUBLIC_MOCK_MODE=true
```

详细配置说明请参考：
- **Dify 工作流**: 查看 [DIFY_WORKFLOW_CONFIG.md](./DIFY_WORKFLOW_CONFIG.md)
- **完整配置文档**: 查看 [DIFY_SETUP.md](./DIFY_SETUP.md)

### 3. 初始化Supabase数据库

在Supabase项目中执行 `supabase/migrations/001_initial_schema.sql` 脚本

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📊 数据库设计

### profiles 表（用户信息）
- `id` - 用户ID（关联auth.users）
- `credits` - 积分余额
- `is_subscriber` - 是否订阅用户
- `created_at` / `updated_at` - 时间戳

### generations 表（生成记录）
- `id` - 记录ID
- `user_id` - 用户ID
- `original_image_url` - 原图URL
- `generated_image_url` - 生成图URL
- `prompt_used` - 使用的Prompt
- `style_preset` - 风格预设
- `status` - 状态（pending/completed/failed）
- `created_at` / `updated_at` - 时间戳

## 🎯 核心业务流程

1. **用户注册** → 自动创建Profile，赠送5积分
2. **上传商品图** → 保存到Supabase Storage
3. **选择预设** → 模特类型 + 场景类型
4. **生成预览图** → 调用Gemini API生成（免费）
5. **下载高清图** → 扣除1积分，下载无水印大图

## 🔑 核心文件说明

### AI接口层
- `lib/ai/dify-client.ts` - Dify工作流客户端（主推）
- `lib/ai/gemini-client.ts` - Gemini API封装（OpenRouter）
- `lib/ai/prompt-builder.ts` - Prompt构建器

### 数据库操作
- `lib/db/profiles.ts` - 用户Profile CRUD
- `lib/db/generations.ts` - 生成记录 CRUD

### 配置中心
- `config/presets.ts` - 模特和场景预设
- `config/models.ts` - AI模型配置

## 📝 开发规范

- ✅ 使用TypeScript确保类型安全
- ✅ 遵循Next.js 14 App Router最佳实践
- ✅ 组件采用"use client"标记客户端组件
- ✅ API Routes使用服务端Supabase客户端
- ✅ 统一使用Shadcn/UI组件保持UI一致性

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

<div align="center">
  Made with ❤️ by ProShot Team
</div>
