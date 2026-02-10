# Dify 工作流配置指南

本文档说明如何在 Dify 平台上配置服饰上身工作流，并与 ProShot 应用集成。

## 1. Dify 工作流概述

**工作流名称**: 服饰上身生成  
**功能**: 将商家上传的白底服装图，通过 AI 生成穿在模特身上的场景化图片  
**模型**: Gemini 2.5 Pro (图像生成)

---

## 2. 工作流输入参数

在 Dify 工作流中，需要配置以下输入变量：

| 变量名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `image_url` | String | 商家上传的白底服装图URL | `https://storage.example.com/shirt.jpg` |
| `scene` | String | 用户选择的场景描述 | `都市街头场景，现代时尚风格，自然光线` |

### 输入参数配置步骤

1. 在 Dify 工作流编辑器中，点击「开始」节点
2. 添加输入字段：
   - 字段名：`image_url`，类型：文本
   - 字段名：`scene`，类型：文本

---

## 3. 工作流节点配置

### 节点 1: 图像加载节点

**节点类型**: HTTP 请求 / 图像加载  
**功能**: 加载用户上传的白底服装图

**配置**:
- 方法: GET
- URL: `{{image_url}}`
- 输出变量: `original_image`

---

### 节点 2: 提示词构建节点

**节点类型**: 代码执行 / 文本处理  
**功能**: 构建完整的生图提示词

**代码示例** (Python):

```python
def main(scene: str) -> dict:
    """
    构建服饰上身的完整提示词
    """
    
    base_prompt = """你是一个专业的人像摄影大师和服装造型师。
请根据提供的服装白底图，生成一张模特穿着该服装的高质量照片。

要求：
1. 模特特征：选择合适的亚洲模特（根据服装风格选择性别和体型）
2. 服装还原：服装的款式、颜色、图案、细节必须与原图完全一致
3. 姿态自然：模特姿态优美自然，符合服装风格
4. 光线质感：光线柔和自然，突出服装质感
5. 场景氛围：{scene}
6. 图片质量：高清晰度，专业摄影质感

请直接输出生成的图片。"""
    
    final_prompt = base_prompt.format(scene=scene)
    
    return {
        "result": final_prompt
    }
```

**输入**:
- `scene`: `{{scene}}` (来自工作流输入)

**输出**:
- `final_prompt`: 完整的提示词

---

### 节点 3: Gemini 2.5 Pro 图像生成节点

**节点类型**: LLM - 图像生成  
**模型**: Gemini 2.5 Pro  
**功能**: 根据提示词和原图生成服饰上身效果图

**配置**:

#### 系统提示词 (System)
```
你是一个专业的AI图像生成助手，擅长生成高质量的服装展示图片。
```

#### 用户提示词 (User)
```
{{final_prompt}}

参考图片如下：
[图片] {{original_image}}
```

#### 模型参数
- **Temperature**: 0.7
- **Top P**: 0.9
- **图片尺寸**: 1024x1536 (3:4 比例)
- **输出格式**: URL

**输出变量**: `generated_image`

---

### 节点 4: 输出节点

**节点类型**: 结束  
**功能**: 返回生成的图片URL

**输出字段**:
- `image_url`: `{{generated_image.url}}`

---

## 4. 环境变量配置

在 ProShot 项目中，需要配置以下环境变量：

创建 `.env.local` 文件：

```bash
# Dify 工作流配置
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxx
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=your-workflow-id
```

### 获取配置信息

1. **DIFY_API_KEY**: 
   - 登录 Dify 平台
   - 进入「设置」→「API 密钥」
   - 创建新的 API 密钥

2. **DIFY_WORKFLOW_ID**:
   - 打开你的工作流
   - 点击右上角「发布」→「API」
   - 复制工作流 ID

---

## 5. 场景映射配置

ProShot 前端的场景选项会自动映射为详细的场景描述：

| 场景 ID | 场景名称 | 传入 Dify 的描述 |
|---------|----------|------------------|
| `white-bg` | 极简白底 | 纯白背景，极简风格，突出服装细节 |
| `street` | 街拍风格 | 都市街头场景，现代时尚风格，自然光线 |
| `home` | 居家场景 | 温馨家居场景，舒适自然氛围，柔和光线 |
| `cafe` | 咖啡馆 | 文艺咖啡馆场景，小资情调，温暖灯光 |
| `office` | 商务办公 | 商务办公场景，专业职业风格，明亮光线 |
| `outdoor` | 户外自然 | 户外自然场景，清新活力，自然阳光 |

这些映射在 `/lib/ai/dify-client.ts` 的 `buildScenePrompt()` 函数中定义。

---

## 6. 测试工作流

### 6.1 在 Dify 平台测试

1. 打开工作流编辑器
2. 点击右上角「运行」
3. 输入测试数据：
   - `image_url`: 一个真实的服装白底图URL
   - `scene`: `都市街头场景，现代时尚风格，自然光线`
4. 查看输出结果

### 6.2 在 ProShot 中测试

启动开发环境（Mock 模式）：

```bash
# 设置 Mock 模式
echo "NEXT_PUBLIC_MOCK_MODE=true" >> .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，上传图片并测试生成功能。

---

## 7. 生产环境部署

### 7.1 配置真实的 Dify API

```bash
# .env.local 或 .env.production
DIFY_API_KEY=app-your-real-api-key
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_WORKFLOW_ID=your-real-workflow-id
NEXT_PUBLIC_MOCK_MODE=false
```

### 7.2 监控和日志

工作流执行的日志会输出到控制台，包括：

- `[Dify Client]` - Dify 客户端日志
- `[Dify API]` - API 路由日志

在生产环境中，建议配置日志收集服务（如 Sentry）。

---

## 8. 常见问题

### Q1: 工作流返回错误 "未找到图片URL"

**原因**: Dify 响应格式与预期不符

**解决方案**: 
1. 检查 Dify 工作流的输出节点配置
2. 确保输出字段名为 `image_url`
3. 修改 `/lib/ai/dify-client.ts` 中的响应解析逻辑

### Q2: 生成的图片质量不理想

**优化方向**:
1. 调整提示词：增加更详细的场景和风格描述
2. 调整模型参数：尝试不同的 Temperature 和 Top P 值
3. 提高图片分辨率：修改 `image_size` 参数

### Q3: API 请求超时

**原因**: Gemini 2.5 Pro 生成图片需要较长时间

**解决方案**:
1. 使用 Dify 的异步模式 (`response_mode: 'streaming'`)
2. 在前端增加轮询机制
3. 考虑使用更快的模型（如 Gemini 2.5 Flash）

---

## 9. 进阶配置

### 9.1 添加图像优化节点

在生成后添加图像后处理节点：
- 去除水印
- 调整亮度/对比度
- 裁剪到合适尺寸

### 9.2 多模特风格支持

扩展提示词支持多种模特风格：
- 性别选择（男/女）
- 年龄段（青年/中年）
- 体型选择（标准/偏瘦/偏胖）

### 9.3 批量生成

修改工作流支持一次生成多张图片（多视角/多姿势）。

---

## 10. 相关文件

- Dify 客户端: `/lib/ai/dify-client.ts`
- API 路由: `/app/api/generate/dify/route.ts`
- 场景配置: `/config/presets.ts`
- 前端页面: `/app/page.tsx`

---

**最后更新**: 2026-02-11  
**作者**: ProShot Team
