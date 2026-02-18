#!/bin/bash

echo "🔍 检查部署状态..."
echo ""

# 检查 Git 状态
echo "📦 Git 状态:"
git status -sb
echo ""

# 检查最近的提交
echo "📝 最近的提交:"
git log --oneline -3
echo ""

# 检查远程分支
echo "🌐 远程分支状态:"
git log --oneline origin/main -3
echo ""

# 比较本地和远程
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ 本地和远程代码已同步"
else
    echo "⚠️  本地代码领先于远程，需要推送"
    echo "   本地: $LOCAL"
    echo "   远程: $REMOTE"
fi

echo ""
echo "💡 下一步操作："
echo "   1. 访问 https://vercel.com/dashboard"
echo "   2. 查看 proshot 项目的部署状态"
echo "   3. 等待构建完成（约 2-3 分钟）"
echo "   4. 访问 https://herjoy.co 查看网站"
