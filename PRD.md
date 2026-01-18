# ProShot 上镜 - 产品需求文档 (PRD)

## 1. 项目愿景

**产品名称：** 上镜 (ProShot)

**一句话介绍：** 电商智能商拍工具，让商品"一键入画"。

**核心价值：** 帮助中小电商卖家（淘宝/拼多多/Shopify）将普通的"人台图"或"平铺图"，低成本转化为高质量的"真人模特/场景化"营销图。

**长期目标：** 从服饰切入，未来拓展至家居、3C等全品类场景生成。

---

## 2. 用户画像

**目标用户：** 缺乏专业摄影预算的电商卖家。

**典型场景：** 用户上传一张衣服挂在塑料模特上的照片，希望立刻得到一张模特穿着这件衣服走在街头的照片。

**核心诉求：** 操作极简（傻瓜式）、衣服还原度高（Logo/版型不乱变）、图片有质感。

---

## 3. 业务流程

### 3.1 首页即工作台

用户进入网站后，**首页即为图片生成页面**，用户可以：
- 无需登录即可上传图片、选择配置、预览界面
- 点击生成时才要求注册/登录
- 注册后即可查看生成结果

### 3.2 功能模块

| 模块 | 描述 | 登录要求 |
|-----|------|---------|
| **服装上身** | 将服装穿到真人模特身上 | 生成时需登录 |
| **物品场景** | 将物品放置到场景中（预留功能） | 生成时需登录 |
| **我的作品** | 查看历史生成记录 | 需登录 |
| **积分充值** | 购买积分包 | 需登录 |
| **账号设置** | 管理个人信息 | 需登录 |

### 3.3 生成流程

```
上传图片 → 选择模式(服装上身/物品场景) → 配置参数 → 一键生成
    ↓
[未登录] → 弹出注册/登录弹窗 → 完成认证
    ↓
调用AI模型 → 展示预览图(免费) → 下载高清图(扣1积分)
```

---

## 4. 详细功能需求

### 4.1 核心生成引擎

**模型调用方式：** 
- ⚠️ **所有AI模型调用必须通过 OpenRouter 平台完成**
- OpenRouter 统一支付，便于成本控制和模型切换
- 使用 OpenAI 兼容的 API 格式

**模型配置：**
| 用途 | 模型 | 说明 |
|-----|------|------|
| 主图生成 | `google/gemini-3-pro-image-preview` | 高质量，适合首张生成 |
| 套图扩展 | `google/gemini-2.5-flash-image-preview` | 快速，适合批量生成 |

**环境变量：**
```env
OPENROUTER_API_KEY=sk-or-xxx        # OpenRouter API密钥
OPENROUTER_API_BASE_URL=https://openrouter.ai/api/v1
```

### 4.2 积分系统

| 操作 | 积分消耗 |
|-----|---------|
| 生成预览图 | 免费 |
| 下载高清无水印图 | 1积分/张 |
| 新用户注册 | 赠送5积分 |

### 4.3 图片管理

**状态机：**
```
Pending → Processing → Completed/Failed
```

**失败处理：** 生成失败时自动退还已扣积分

---

## 5. 技术架构

### 5.1 技术栈

| 层级 | 技术选型 |
|-----|---------|
| **前端框架** | Next.js 14 (App Router) |
| **样式方案** | Tailwind CSS |
| **组件库** | Shadcn/UI |
| **图标库** | Lucide React |
| **数据库** | Supabase (PostgreSQL) |
| **认证** | Supabase Auth |
| **存储** | Supabase Storage |
| **AI接口** | OpenRouter API |

### 5.2 UI/UX设计理念

本项目采用 **[ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** 的设计理念：

**视觉风格：**
- 采用 Glassmorphism（毛玻璃）风格，营造现代感
- 深色主题为主，配合渐变色彩点缀
- 强调视觉层次和空间感

**色彩系统：**
- 主色调：Electric Violet (#8B5CF6)
- 强调色：Cyan (#06B6D4)
- 背景：Deep Space (#0F0F23)
- 渐变：Purple to Cyan

**字体选择：**
- 标题：Clash Display / Plus Jakarta Sans
- 正文：Inter
- 代码/数字：JetBrains Mono

**交互原则：**
- 即时反馈：所有操作都有视觉/动画反馈
- 渐进式披露：复杂功能逐步展示
- 错误预防：输入验证和确认提示

---

## 6. 数据库设计

### profiles 表
```sql
id          UUID PRIMARY KEY  -- 关联 auth.users
credits     INT DEFAULT 5     -- 积分余额
is_subscriber BOOLEAN         -- 是否订阅用户
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### generations 表
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES profiles(id)
original_image_url  TEXT          -- 原图URL
generated_image_url TEXT          -- 生成图URL
prompt_used         TEXT          -- 使用的Prompt
style_preset        TEXT          -- 风格预设
mode                TEXT          -- 'clothing' | 'product'
status              TEXT          -- pending/completed/failed
created_at          TIMESTAMP
```

---

## 7. 页面结构

```
/                   # 首页（工作台）- 服装上身生成
/product            # 物品场景生成（预留）
/gallery            # 我的作品
/pricing            # 积分充值
/login              # 登录
/register           # 注册
```

---

## 8. 未来扩展

### 8.1 物品场景图生成（Phase 2）
- 支持家居、3C产品的场景化
- 更多场景预设：客厅、办公室、户外等
- 支持自定义场景描述

### 8.2 高级功能
- 批量生成
- 自定义模特
- API开放平台
- 企业团队版

---

## 9. 版本历史

| 版本 | 日期 | 更新内容 |
|-----|------|---------|
| v1.0 | 2024-01 | 初始版本 |
| v2.0 | 2026-01 | 重构版本：优化交互、引入OpenRouter、更新UI设计理念 |
