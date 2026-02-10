# Dify 工作流集成总结

## 已完成的工作

### 1. 创建的新文件

#### `/lib/ai/dify-client.ts` - Dify API 客户端
**功能**:
- 封装 Dify 工作流 API 调用
- 提供场景描述映射 (`buildScenePrompt`)
- 支持 Mock 模式用于开发测试
- 处理工作流响应解析

**核心函数**:
```typescript
runDifyWorkflow(input: DifyWorkflowInput): Promise<DifyWorkflowResult>
buildScenePrompt(sceneId: string): string
```

#### `/app/api/generate/dify/route.ts` - Dify 生成 API
**功能**:
- 接收前端请求（图片URL + 场景类型）
- 验证用户身份
- 调用 Dify 工作流
- 创建和更新生成记录
- 返回生成结果

**路由**: `POST /api/generate/dify`

### 2. 修改的文件

#### `/app/page.tsx` - 前端主页
**改动**: 将生成 API 调用从 `/api/generate/main` 改为 `/api/generate/dify`

```typescript
// 修改前
const response = await fetch('/api/generate/main', {...})

// 修改后
const response = await fetch('/api/generate/dify', {...})
```

#### `/config/models.ts` - 模型配置
**改动**: 新增 Gemini 2.5 Pro 模型配置

```typescript
export const AI_MODELS = {
  // ...existing models
  DIFY_IMAGE: "google/gemini-2.5-pro", // 新增
}
```

#### `/env.example` - 环境变量示例
**改动**: 新增 Dify 相关环境变量配置

```env
DIFY_API_KEY=app-your-dify-api-key
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=your-workflow-id
```

#### `/README.md` - 项目文档
**改动**: 
- 在核心功能中添加 Dify 工作流说明
- 更新技术栈说明
- 更新环境变量配置说明
- 更新 AI 接口层说明

### 3. 创建的文档

#### `/DIFY_SETUP.md` - 完整配置指南
详细的 Dify 工作流配置文档，包含：
- 工作流节点配置
- 提示词模板
- 环境变量设置
- 场景映射说明
- 常见问题解答

#### `/DIFY_WORKFLOW_CONFIG.md` - 快速配置指南
简化的配置文档，方便快速上手：
- 工作流结构
- 提示词模板
- 测试步骤
- 调试技巧

#### `/INTEGRATION_SUMMARY.md` (本文件)
集成工作的总结和使用说明

---

## 工作流程说明

### 用户使用流程

```
用户上传白底图 
    ↓
用户选择场景（如"街拍风格"）
    ↓
前端调用 /api/generate/dify
    ↓
后端将场景ID转换为场景描述
    ↓
调用 Dify 工作流（传入图片URL + 场景描述）
    ↓
Dify 工作流执行（Gemini 2.5 Pro 生成图片）
    ↓
返回生成的图片URL
    ↓
前端在画布上渲染显示
```

### 数据流转

```typescript
// 1. 前端发送
{
  originalImageUrl: "https://storage.supabase.co/xxx.jpg",
  sceneType: "street"  // 场景ID
}

// 2. 后端转换场景描述
const scenePrompt = buildScenePrompt("street")
// => "都市街头场景，现代时尚风格，自然光线"

// 3. 调用 Dify 工作流
{
  inputs: {
    image_url: "https://storage.supabase.co/xxx.jpg",
    scene: "都市街头场景，现代时尚风格，自然光线"
  },
  response_mode: "blocking"
}

// 4. Dify 返回
{
  data: {
    outputs: {
      image_url: "https://generated-image-url.jpg"
    }
  }
}

// 5. 返回前端
{
  success: true,
  imageUrl: "https://generated-image-url.jpg"
}
```

---

## 配置步骤

### 步骤 1: 在 Dify 平台创建工作流

1. 登录 Dify 平台
2. 创建新的工作流
3. 配置输入变量：`image_url` 和 `scene`
4. 添加 Gemini 2.5 Pro 生图节点
5. 配置提示词（参考 `DIFY_WORKFLOW_CONFIG.md`）
6. 配置输出：`image_url`
7. 发布工作流，获取 API Key 和 Workflow ID

### 步骤 2: 配置 ProShot 项目

创建 `.env.local` 文件：

```bash
# Supabase 配置（如已配置可跳过）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Dify 配置
DIFY_API_KEY=app-xxxxxxxxxxxxx
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=your-workflow-id

# 开发模式（先使用 Mock 模式测试）
NEXT_PUBLIC_MOCK_MODE=true
```

### 步骤 3: 测试

#### Mock 模式测试（无需配置 Dify）

```bash
npm run dev
```

访问 http://localhost:3000，测试上传和生成功能。Mock 模式会返回固定的测试图片。

#### 真实环境测试

```bash
# 修改 .env.local
NEXT_PUBLIC_MOCK_MODE=false

# 重启服务
npm run dev
```

上传真实图片测试生成功能。

---

## 场景映射表

| 场景 ID | 前端显示 | 传入 Dify 的描述 |
|---------|----------|------------------|
| `white-bg` | ⬜ 极简白底 | 纯白背景，极简风格，突出服装细节 |
| `street` | 🏙️ 街拍风格 | 都市街头场景，现代时尚风格，自然光线 |
| `home` | 🏠 居家场景 | 温馨家居场景，舒适自然氛围，柔和光线 |
| `cafe` | ☕ 咖啡馆 | 文艺咖啡馆场景，小资情调，温暖灯光 |
| `office` | 💼 商务办公 | 商务办公场景，专业职业风格，明亮光线 |
| `outdoor` | 🌿 户外自然 | 户外自然场景，清新活力，自然阳光 |

**修改场景描述**: 编辑 `/lib/ai/dify-client.ts` 中的 `buildScenePrompt` 函数

---

## 关键代码位置

### 后端

| 文件 | 功能 | 说明 |
|------|------|------|
| `/lib/ai/dify-client.ts` | Dify 客户端 | 核心 API 调用逻辑 |
| `/app/api/generate/dify/route.ts` | API 路由 | 处理前端请求 |
| `/config/models.ts` | 模型配置 | AI 模型定义 |

### 前端

| 文件 | 功能 | 说明 |
|------|------|------|
| `/app/page.tsx` | 主页面 | 调用生成 API |
| `/config/presets.ts` | 场景配置 | 场景选项定义 |

### 配置

| 文件 | 功能 |
|------|------|
| `/env.example` | 环境变量模板 |
| `/DIFY_SETUP.md` | 完整配置文档 |
| `/DIFY_WORKFLOW_CONFIG.md` | 快速配置指南 |

---

## 调试和日志

### 查看日志

开发环境下，所有调用日志都会输出到控制台：

```bash
npm run dev
```

控制台会显示：

```
[Dify API] 收到生成请求
[Dify API] 请求参数: { originalImageUrl: '...', sceneType: 'street' }
[Dify API] 场景: { sceneName: '街拍风格', scenePrompt: '都市街头场景...' }
[Dify Client] 开始调用工作流...
[Dify Client] 输入参数: { originalImageUrl: '...', scene: '...' }
[Dify Client] API 响应: { ... }
[Dify Client] 工作流执行成功，图片URL: ...
[Dify API] 生成成功!
```

### 常见错误

**错误 1**: `Dify API Key 未配置`
- **原因**: 环境变量 `DIFY_API_KEY` 未设置
- **解决**: 在 `.env.local` 中配置正确的 API Key

**错误 2**: `工作流响应中未找到图片URL`
- **原因**: Dify 工作流输出字段名不正确
- **解决**: 确保 Dify 工作流输出字段名为 `image_url`

**错误 3**: `API 请求失败: 401`
- **原因**: API Key 无效或已过期
- **解决**: 在 Dify 平台重新生成 API Key

---

## 优化建议

### 1. 提示词优化

根据实际生成效果，在 Dify 工作流中调整提示词：
- 增加服装细节保持的强调
- 调整模特风格描述
- 优化场景氛围描述

### 2. 性能优化

- 考虑使用 Dify 的流式响应模式（`response_mode: 'streaming'`）
- 在前端增加进度提示
- 对于批量生成，考虑使用队列

### 3. 扩展功能

- 支持用户自定义场景描述
- 支持选择模特性别/年龄
- 支持多视角生成（一次生成多张不同角度）

---

## 后续工作

1. **测试生成效果**: 使用真实服装图片测试各场景生成效果
2. **优化提示词**: 根据测试结果调整 Dify 工作流中的提示词
3. **错误处理**: 完善错误提示和重试机制
4. **监控和日志**: 接入日志服务（如 Sentry）
5. **成本控制**: 监控 API 调用次数和成本

---

## 技术支持

如有问题，请参考：
- Dify 官方文档: https://docs.dify.ai/
- Gemini API 文档: https://ai.google.dev/docs
- 项目 Issue: https://github.com/your-repo/ProShot/issues

---

**集成完成时间**: 2026-02-11  
**版本**: v1.0
