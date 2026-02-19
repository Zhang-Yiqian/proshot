---
description: 智能分析代码变更并生成符合 Conventional Commits 规范的 Git 提交命令
---

# Workflow
请按照以下步骤执行：

1.  **Analyze**: 仔细阅读当前工作区的所有未提交变更（Uncommitted Changes）。你需要理解代码修改的意图（是修复了 Bug、增加了功能、还是修改了文档？）。
2.  **detect**: 提交的代码里是否会有可能包含api key等敏感信息，如果包含请直接拒绝我的提交，并告诉我需要如何修改以避免敏感信息。
3.  **Format**: 根据变更内容，生成符合 **Conventional Commits** 规范的提交信息。
4.  **Command**: 生成最终的 Shell 命令。

# Commit Message Style Guide
格式必须遵循：`<Emoji> <Type>: <Description>`

## Types & Emojis
- ✨ **feat**: 新增功能 (A new feature)
- 🐛 **fix**: 修复 Bug (A bug fix)
- 📚 **docs**: 文档变更 (Documentation only changes)
- 🎨 **style**: 代码格式调整，不影响逻辑 (Formatting, missing semi colons, etc)
- ♻️ **refactor**: 代码重构，既无新功能也未修复 Bug (A code change that neither fixes a bug nor adds a feature)
- ⚡️ **perf**: 性能优化 (A code change that improves performance)
- 🔧 **chore**: 构建过程或辅助工具的变动 (Build process, auxiliary tools)

## Rules
- **Description** 必须简练、使用中文（除非我特别要求英文）。
- **Scope** (可选): 如果变更集中在某个模块，可以在 Type 后加括号，如 `feat(user): ...`。
- 保持 Atomic（原子性）：如果变更过于杂乱，请建议我分次提交，或者总结最核心的变更。
- 如果我特殊制定了变更描述，请优先按照我的描述来提交

# Output
请直接提供唯一一个可以在终端运行的代码块，格式如下：

```bash
git add . && git commit -m "..." && git push