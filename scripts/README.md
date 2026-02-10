# ProShot 脚本工具

本目录包含 ProShot 项目的实用脚本工具。

## 脚本列表

### `test-dify.ts` - Dify 工作流测试

**功能**: 快速验证 Dify 工作流配置是否正确

**使用方法**:

```bash
# 确保已安装 tsx
npm install -D tsx

# 运行测试
npx tsx scripts/test-dify.ts
```

**预期输出**:

成功时:
```
🚀 开始测试 Dify 工作流...

📋 测试参数:
  - 图片URL: https://images.unsplash.com/...
  - 场景ID: street
  - 场景描述: 都市街头场景，现代时尚风格，自然光线

⏳ 调用 Dify 工作流中...
   (这可能需要 30-60 秒，请耐心等待)

✅ 测试成功!
   - 耗时: 32.5 秒
   - 生成图片URL: https://...
   - 任务ID: workflow-xxx

🎉 Dify 工作流配置正确!
```

失败时:
```
❌ 测试失败!
   - 错误信息: Dify API Key 未配置

请检查:
  1. DIFY_API_KEY 是否正确
  2. DIFY_WORKFLOW_ID 是否正确
  3. Dify 工作流是否已发布
  4. Dify 工作流的输入/输出配置是否正确
```

---

## 添加新脚本

在此目录下创建新的 `.ts` 文件，并在此 README 中添加说明。

### 脚本模板

```typescript
/**
 * 脚本名称
 * 脚本功能说明
 */

async function main() {
  console.log('开始执行...')
  
  // 脚本逻辑
  
  console.log('完成!')
}

main()
```

---

**最后更新**: 2026-02-11
