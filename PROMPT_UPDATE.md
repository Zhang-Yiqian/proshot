# 提示词配置更新说明

## 📝 更新内容

### 1. **隐藏模特类型选择**
- ✅ 移除了前端UI中的模特类型选择面板
- ✅ 固定使用"亚洲模特"（在Prompt中硬编码）

### 2. **新的Prompt模板**
使用您指定的模板格式：

```
你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是$场景参数$
```

**示例输出：**
- 选择"极简白底" → `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是极简白底`
- 选择"街拍风格" → `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是街拍风格`
- 选择"咖啡馆" → `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是咖啡馆`

---

## 🔧 修改的文件

### 1. **`lib/ai/prompt-builder.ts`** - Prompt构建器
**主要变更：**
- ✅ 移除了 `modelType` 参数
- ✅ 使用新的Prompt模板
- ✅ 场景参数使用场景的 `name` 字段（中文名称）

**新的函数签名：**
```typescript
export function buildPrompt(options: {
  sceneType: string
  additionalPrompt?: string
}): string
```

### 2. **`components/workbench/config-panel.tsx`** - 配置面板组件
**主要变更：**
- ✅ 移除了模特类型选择卡片
- ✅ 只保留场景选择
- ✅ 更新了组件Props接口

**新的Props：**
```typescript
interface ConfigPanelProps {
  selectedScene: string
  onSceneChange: (sceneId: string) => void
}
```

### 3. **`app/page.tsx`** - 首页
**主要变更：**
- ✅ 移除了 `selectedModel` 状态
- ✅ 更新了 `ConfigPanel` 的调用
- ✅ 更新了API请求参数

### 4. **`app/workbench/page.tsx`** - 工作台页面
**主要变更：**
- ✅ 移除了 `selectedModel` 状态
- ✅ 更新了 `ConfigPanel` 的调用
- ✅ 更新了API请求参数

### 5. **`app/api/generate/main/route.ts`** - 生成API
**主要变更：**
- ✅ 移除了 `modelType` 参数验证
- ✅ 更新了 `buildPrompt` 调用
- ✅ 固定 `stylePreset` 为 `asian-female-${sceneType}`

---

## 📋 场景配置说明

场景的 `name` 字段会直接作为Prompt中的场景参数。当前可用的场景：

| ID | 名称 | Prompt中的场景参数 |
|----|------|-------------------|
| `white-bg` | 极简白底 | 极简白底 |
| `street-style` | 街拍风格 | 街拍风格 |
| `home-cozy` | 居家场景 | 居家场景 |
| `cafe` | 咖啡馆 | 咖啡馆 |
| `office` | 办公室 | 办公室 |
| `nature` | 自然户外 | 自然户外 |

**如需修改场景名称或添加新场景，请编辑 `config/presets.ts` 文件。**

---

## 🎯 使用示例

### 用户操作流程：
1. 用户上传白底商品图
2. 用户选择场景（例如：选择"街拍风格"）
3. 点击"一键上镜"
4. 系统生成Prompt：`你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是街拍风格`
5. 调用Gemini API生成图片

---

## 🔍 如何修改Prompt模板

如果需要修改Prompt模板，编辑 `lib/ai/prompt-builder.ts` 文件：

```typescript
// 当前模板（第25行）
let prompt = `你是一个人像摄影大师，请你帮我把上传的白底图中的衣服穿在一个亚洲模特身上，所在的场景是${sceneParam}`

// 例如：修改为更详细的描述
let prompt = `你是一位专业的人像摄影大师，请帮我将上传的白底图中的衣服穿在一个亚洲模特身上，场景设置为${sceneParam}，要求保持商品细节完整`
```

---

## ✅ 测试建议

1. **测试场景选择**
   - 选择不同的场景
   - 确认Prompt正确生成

2. **测试Prompt格式**
   - 查看生成的Prompt是否符合模板
   - 确认场景参数正确替换

3. **测试API调用**
   - 确认API不再需要 `modelType` 参数
   - 确认生成结果符合预期

---

## 📝 注意事项

1. **场景名称**：场景的 `name` 字段会直接用于Prompt，请确保名称清晰准确
2. **固定模特**：当前固定使用"亚洲模特"，如需修改，请编辑 `lib/ai/prompt-builder.ts`
3. **向后兼容**：旧的生成记录仍包含 `modelType`，新记录使用固定值 `asian-female`

---

<div align="center">
  <strong>更新完成！✅</strong>
</div>
