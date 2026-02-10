# Dify 工作流快速上手指南 🚀

本指南帮助你在 **5 分钟内** 完成 Dify 工作流的配置和测试。

---

## 第一步: 在 Dify 平台创建工作流 (3分钟)

### 1. 登录 Dify

访问 [https://dify.ai](https://dify.ai) 并登录你的账户

### 2. 创建新工作流

1. 点击「创建应用」→「工作流」
2. 命名为：`ProShot-服饰上身`

### 3. 配置输入节点

点击「开始」节点，添加输入字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `image_url` | 文本 | 服装白底图URL |
| `scene` | 文本 | 场景描述 |

### 4. 添加 Gemini 2.5 Pro 节点

1. 拖入「LLM」节点
2. 选择模型：**Gemini 2.5 Pro**
3. 设置输出模态：**图像**

### 5. 配置提示词

在 LLM 节点的 **User Prompt** 中粘贴：

```
你是一个专业的人像摄影大师和服装造型师。
请根据提供的服装白底图，生成一张模特穿着该服装的高质量照片。

要求：
1. 模特特征：选择合适的亚洲模特（根据服装风格选择性别和体型）
2. 服装还原：服装的款式、颜色、图案、细节必须与原图完全一致
3. 姿态自然：模特姿态优美自然，符合服装风格
4. 光线质感：光线柔和自然，突出服装质感
5. 场景氛围：{{scene}}
6. 图片质量：高清晰度，专业摄影质感

参考服装图：
```

然后在提示词下方点击「添加图片」，选择变量 `{{image_url}}`

### 6. 配置输出节点

点击「结束」节点，配置输出：

| 字段名 | 来源 |
|--------|------|
| `image_url` | 选择 Gemini 节点的图片输出 |

### 7. 发布工作流

1. 点击右上角「发布」
2. 选择「API」标签
3. 复制 **API Key** 和 **Workflow ID**

---

## 第二步: 配置 ProShot 项目 (1分钟)

### 1. 创建环境变量文件

在项目根目录创建 `.env.local`:

```bash
# Dify 配置（必填）
DIFY_API_KEY=app-xxxxxxxxxxxxxx  # 粘贴你的 API Key
DIFY_WORKFLOW_ID=xxxxxxxxxxxxxx  # 粘贴你的 Workflow ID
DIFY_API_BASE_URL=https://api.dify.ai/v1

# Supabase 配置（必填）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 开发配置（可选）
NEXT_PUBLIC_MOCK_MODE=false  # 设为 false 使用真实 API
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. 安装依赖（如果还没有）

```bash
npm install
```

---

## 第三步: 测试 (1分钟)

### 方法 1: 使用测试脚本（推荐）

```bash
# 安装 tsx
npm install -D tsx

# 运行测试脚本
npx tsx scripts/test-dify.ts
```

**预期输出**:
```
✅ 测试成功!
   - 耗时: 32.5 秒
   - 生成图片URL: https://...
🎉 Dify 工作流配置正确!
```

### 方法 2: 启动项目测试

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，上传图片测试生成功能。

---

## 常见问题 ❓

### Q1: 测试脚本报错 "Dify API Key 未配置"

**解决**: 检查 `.env.local` 文件是否存在，且 `DIFY_API_KEY` 是否正确填写

### Q2: 测试脚本报错 "API 请求失败: 401"

**解决**: API Key 可能无效，在 Dify 平台重新生成一个

### Q3: 工作流响应中未找到图片URL

**解决**: 
1. 检查 Dify 工作流的输出节点配置
2. 确保输出字段名为 `image_url`
3. 确保 Gemini 节点的输出模态设为「图像」

### Q4: 生成的图片效果不理想

**优化方向**:
1. 在 Dify 中调整提示词
2. 使用更高质量的原图（建议 1024x1024 以上）
3. 尝试不同的场景描述

---

## 下一步 📚

- 📖 查看完整配置文档: [DIFY_SETUP.md](./DIFY_SETUP.md)
- 🏗️ 了解系统架构: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 📋 查看集成总结: [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)

---

## 需要帮助？

- Dify 官方文档: https://docs.dify.ai/
- Gemini API 文档: https://ai.google.dev/docs
- ProShot GitHub Issues: [提交问题](https://github.com/your-repo/issues)

---

**完成！** 🎉

现在你可以开始使用 ProShot 的 Dify 工作流生成高质量的服饰上身图了！
