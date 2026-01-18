# ProShot 项目结构说明

## 📂 目录结构

```
ProShot/
│
├── 📄 配置文件
│   ├── package.json              # 项目依赖
│   ├── tsconfig.json             # TypeScript配置
│   ├── next.config.js            # Next.js配置
│   ├── tailwind.config.ts        # Tailwind CSS配置
│   ├── postcss.config.js         # PostCSS配置
│   ├── components.json           # Shadcn/UI配置
│   └── middleware.ts             # Next.js中间件
│
├── 📱 app/                        # Next.js App Router
│   ├── layout.tsx                # 全局布局
│   ├── page.tsx                  # 首页（工作台）
│   ├── globals.css               # 全局样式
│   │
│   ├── (auth)/                   # 认证页面
│   │   ├── login/page.tsx        # 登录
│   │   └── register/page.tsx     # 注册
│   │
│   ├── gallery/page.tsx          # 我的作品
│   ├── pricing/page.tsx          # 积分充值
│   ├── about/page.tsx            # 关于我们
│   │
│   └── api/                      # API Routes
│       ├── auth/callback/route.ts
│       ├── generate/main/route.ts
│       ├── credits/route.ts
│       └── generations/route.ts
│
├── 🧩 components/                 # React组件
│   ├── ui/                       # 基础UI组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   │
│   ├── layout/                   # 布局组件
│   │   ├── header.tsx
│   │   └── footer.tsx
│   │
│   ├── workbench/                # 工作台组件
│   │   ├── upload-zone.tsx
│   │   └── config-panel.tsx
│   │
│   └── common/                   # 通用组件
│       └── auth-dialog.tsx
│
├── 🔧 lib/                        # 工具库
│   ├── supabase/                 # Supabase集成
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   │
│   ├── ai/                       # AI接口
│   │   ├── gemini-client.ts      # OpenRouter调用
│   │   └── prompt-builder.ts     # Prompt构建
│   │
│   ├── db/                       # 数据库操作
│   │   ├── profiles.ts
│   │   └── generations.ts
│   │
│   └── utils.ts                  # 工具函数
│
├── ⚙️ config/                     # 配置中心
│   ├── site.ts                   # 站点配置
│   ├── models.ts                 # AI模型配置
│   └── presets.ts                # 预设配置
│
├── 📘 types/                      # 类型定义
│   ├── database.ts
│   ├── generation.ts
│   └── user.ts
│
├── 🪝 hooks/                      # React Hooks
│   ├── use-user.ts
│   └── use-credits.ts
│
└── 🗄️ supabase/                  # 数据库
    └── migrations/
        └── *.sql
```

---

## 🎨 设计系统

### 色彩

| 变量 | 用途 | 值 |
|------|------|-----|
| `--primary` | 主色调 | Electric Violet |
| `--secondary` | 强调色 | Cyan |
| `--background` | 背景色 | Deep Space |

### 组件样式

- `glass-card` - 毛玻璃卡片
- `btn-glow` - 发光按钮
- `text-gradient` - 渐变文字
- `upload-zone` - 上传区域

### 字体

- 标题：Plus Jakarta Sans
- 正文：Inter
- 数字：JetBrains Mono

---

## 🔌 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) |
| 样式方案 | Tailwind CSS |
| 组件库 | Shadcn/UI |
| 图标 | Lucide React |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 存储 | Supabase Storage |
| AI接口 | OpenRouter → Gemini |

---

## 🚀 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

---

## 🔐 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_API_BASE_URL=https://openrouter.ai/api/v1

# 站点
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
