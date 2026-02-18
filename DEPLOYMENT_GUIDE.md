# ProShot 部署指南

## 🚀 部署到 Vercel + 阿里云域名

### 一、Vercel 部署步骤

#### 1. 准备工作

确保你的代码已经推送到 Git 仓库（GitHub/GitLab/Bitbucket）。

```bash
# 如果还没有推送到远程仓库
git add .
git commit -m "准备部署到 Vercel"
git push origin main
```

#### 2. 部署到 Vercel

**方式一：使用 Vercel CLI（推荐）**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 按照提示操作：
# - Set up and deploy? Yes
# - Which scope? 选择你的账号
# - Link to existing project? No
# - What's your project's name? proshot
# - In which directory is your code located? ./
# - Want to override the settings? No

# 部署到生产环境
vercel --prod
```

**方式二：使用 Vercel 网页控制台**

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub/GitLab 账号登录
3. 点击 "Add New Project"
4. 导入你的 Git 仓库
5. 配置项目：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: 留空（Next.js 默认）
6. 点击 "Deploy"

#### 3. 配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 进入项目 Dashboard
2. 点击 "Settings" → "Environment Variables"
3. 添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL = https://paloyydsrlnsejlfvcfi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbG95eWRzcmxuc2VqbGZ2Y2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzQ4NDAsImV4cCI6MjA4MzgxMDg0MH0.RbCZyNMRl9YVbuq4zKtKpkJzUBHb7_0DC-Gr6qaz8hk
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbG95eWRzcmxuc2VqbGZ2Y2ZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzNDg0MCwiZXhwIjoyMDgzODEwODQwfQ.Ld9EPxG3QsGx-IRzNGTXX5uJLdi07dR1vd9qy1u04T4
OPENROUTER_API_KEY = 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
OPENROUTER_API_BASE_URL = https://openrouter.ai/api/v1
NEXT_PUBLIC_SITE_URL = https://herjoy.co
NEXT_PUBLIC_MOCK_MODE = false
NEXT_PUBLIC_MOCK_MAIN_IMAGE = false
```

**注意：** 每个环境变量都要选择应用到 `Production`、`Preview` 和 `Development` 环境。

4. 重新部署项目以应用环境变量

### 二、阿里云域名配置

#### 1. 获取 Vercel 的 DNS 记录

部署完成后，Vercel 会给你一个默认域名，类似：`proshot.vercel.app`

要绑定自定义域名 `herjoy.co`，你需要：

1. 在 Vercel 项目中，进入 "Settings" → "Domains"
2. 输入你的域名：`herjoy.co`
3. 点击 "Add"
4. Vercel 会显示需要配置的 DNS 记录

#### 2. 在阿里云配置 DNS 解析

登录阿里云域名控制台：

1. 进入 [阿里云域名控制台](https://dc.console.aliyun.com/)
2. 找到域名 `herjoy.co`，点击"解析"
3. 添加以下 DNS 记录：

**方式一：使用 A 记录（推荐）**

| 记录类型 | 主机记录 | 解析路线 | 记录值 | TTL |
|---------|---------|---------|--------|-----|
| A | @ | 默认 | 76.76.21.21 | 600 |
| CNAME | www | 默认 | cname.vercel-dns.com | 600 |

**方式二：使用 CNAME 记录**

| 记录类型 | 主机记录 | 解析路线 | 记录值 | TTL |
|---------|---------|---------|--------|-----|
| CNAME | @ | 默认 | cname.vercel-dns.com | 600 |
| CNAME | www | 默认 | cname.vercel-dns.com | 600 |

**注意：** 
- 具体的 IP 地址或 CNAME 记录请以 Vercel 控制台显示的为准
- Vercel 通常会提供 `76.76.21.21` 作为 A 记录的 IP
- CNAME 记录通常是 `cname.vercel-dns.com`

#### 3. 等待 DNS 生效

- DNS 解析通常在 10 分钟内生效
- 完全生效可能需要 24-48 小时
- 可以使用以下命令检查 DNS 是否生效：

```bash
# 检查域名解析
nslookup herjoy.co

# 或使用 dig
dig herjoy.co
```

#### 4. 配置 SSL 证书

Vercel 会自动为你的域名配置免费的 SSL 证书（Let's Encrypt），无需额外操作。

等待几分钟后，你的网站就可以通过 HTTPS 访问了：
- https://herjoy.co
- https://www.herjoy.co

### 三、Supabase 配置更新

别忘了更新 Supabase 的配置，允许新域名访问：

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目：`paloyydsrlnsejlfvcfi`
3. 进入 "Authentication" → "URL Configuration"
4. 在 "Site URL" 中添加：`https://herjoy.co`
5. 在 "Redirect URLs" 中添加：
   - `https://herjoy.co/**`
   - `https://www.herjoy.co/**`
6. 保存设置

### 四、验证部署

部署完成后，访问以下地址验证：

1. **主站点**：https://herjoy.co
2. **登录页面**：https://herjoy.co/login
3. **工作台**：https://herjoy.co/workbench
4. **画廊**：https://herjoy.co/gallery

### 五、性能优化建议

#### 1. 配置 CDN 加速（可选）

如果需要在中国大陆更快的访问速度，可以：
- 使用阿里云 CDN
- 或者考虑使用 Vercel 的中国区域节点

#### 2. 图片优化

项目已经配置了 Next.js Image 组件，会自动进行：
- 图片懒加载
- 自动格式转换（WebP）
- 响应式图片

#### 3. 监控和分析

在 Vercel Dashboard 中可以查看：
- 访问统计
- 性能指标
- 错误日志

### 六、常见问题

#### Q1: 部署失败怎么办？

检查 Vercel 的部署日志，常见问题：
- 环境变量缺失
- 依赖安装失败
- 构建错误

#### Q2: 域名无法访问？

检查：
- DNS 解析是否生效（使用 `nslookup`）
- Vercel 中域名是否正确配置
- 是否等待了足够的时间（至少 10 分钟）

#### Q3: 图片无法显示？

检查：
- Supabase Storage 是否正确配置
- `next.config.js` 中的 `remotePatterns` 是否包含 Supabase 域名
- 浏览器控制台是否有 CORS 错误

#### Q4: 如何更新部署？

只需推送代码到 Git 仓库：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

Vercel 会自动检测到更新并重新部署。

### 七、回滚部署

如果新版本有问题，可以在 Vercel Dashboard 中：
1. 进入 "Deployments"
2. 找到之前的稳定版本
3. 点击 "..." → "Promote to Production"

---

## 📞 技术支持

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)

## ✅ 部署清单

- [ ] 代码推送到 Git 仓库
- [ ] Vercel 部署成功
- [ ] 环境变量配置完成
- [ ] 阿里云 DNS 解析配置
- [ ] Supabase URL 配置更新
- [ ] SSL 证书生效
- [ ] 网站可以访问
- [ ] 登录/注册功能正常
- [ ] 图片上传功能正常
- [ ] AI 生成功能正常

---

祝你部署顺利！🎉
