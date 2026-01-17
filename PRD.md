项目代号：Project ProShot (上镜) - MVP 产品需求文档
1. 项目愿景 (Product Vision)
产品名称： 上镜 (ProShot)

一句话介绍： 电商智能商拍工具，让商品“一键入画”。

核心价值： 帮助中小电商卖家（淘宝/拼多多/Shopify）将普通的“人台图”或“平铺图”，低成本转化为高质量的“真人模特/场景化”营销图。

长期目标： 从服饰切入，未来拓展至家居、3C等全品类场景生成。

2. 用户画像 (User Persona)
目标用户： 缺乏专业摄影预算的电商卖家。

典型场景： 用户上传一张衣服挂在塑料模特上的照片，希望立刻得到一张模特穿着这件衣服走在街头的照片。

核心诉求： 操作极简（傻瓜式）、衣服还原度高（Logo/版型不乱变）、图片有质感。

3. 业务流程 (User Flow)
用户进入网站后第一页面即为图片生成页面，用户可以预览上传页面的内容，当用户真正提交请求的时候才要求用户注册，注册后才可以看到生成结果。

登录 (Login): 用户通过手机号/邮箱登录（新用户获赠免费积分）。

上传 (Upload):

必须： 上传正面图（人台/平铺）。

设置 (Config):

选择模特： 亚洲女性 / 欧美男性 / 虚拟人台等。

选择场景： 极简白底 / 街拍 / 居家 / 咖啡馆。

生成 (Generate): 用户点击“一键上镜”。

系统后台调用 Gemini 3 Pro image 生成备选主图，用户选择喜欢的主图再点击拓展并发生成 4 张 不同姿态/构图的预览图。

交付 (Delivery): 用户预览带水印小图 -> 消耗积分 -> 下载高清大图。

4. 详细功能需求 (Functional Requirements)
4.1 核心生成引擎 (The AI Core) - 关键
模型指定： 主图生成使用 gemini-3-pro-image 模型，套图拓展使用gemini-2-flash-image。

生成逻辑 (Prompt Engineering Strategy):

输入处理： 将用户上传的“人台图”作为 Reference Image (参考图) 传入模型。

Prompt 构建： 系统需根据后台维护的 Prompt 生成图片

4.2 积分与商业化 (Credits System)
计费单元： 1个积分 = 1张高清图下载权限。

消耗逻辑：

生成预览图：免费

下载无水印大图：扣除 1 积分/张。

初始赠送： 注册即送 5 积分。

4.3 图片管理 (Asset Management)
画廊： 用户可查看历史生成记录。

状态机： 图片状态需包含 Queued (排队中) -> Processing (生成中) -> Completed (完成) -> Failed (失败，需退分)。

5. 技术架构建议 (Tech Stack for Cursor)
请 Cursor 严格按照以下技术栈初始化项目：

Frontend (前端):

Next.js 14 (App Router): 确保使用最新的服务端组件特性。

Tailwind CSS: 样式处理。

Shadcn/UI: 必须使用此组件库，确保 UI 具有商业软件的专业感（按钮、弹窗、卡片）。

Lucide React: 图标库。

Backend (后端):

Next.js API Routes: 处理前端请求，转发给 AI 模型。

Database & Auth (数据库与认证):

Supabase:

Auth: 处理用户注册/登录。

Database (PostgreSQL): 存储用户积分、订单、生成记录。

Storage: 存储用户上传的原图和生成的结果图。

AI Integration (模型层):

Google GenAI SDK: 接入 Gemini 3 Pro image。

注意：如果在 SDK 中尚未找到该模型名称，请封装一个通用的 fetch 请求指向该模型的 API Endpoint，并预留 API Key 环境变量位置。

6. 数据库设计 (Database Schema)
profiles:

id (uuid, PK, references auth.users)

credits (int, default: 5)

is_subscriber (boolean)

generations:

id (uuid, PK)

user_id (uuid, FK)

original_image_url (text)

generated_image_url (text)

prompt_used (text)

style_preset (text)

status (enum: pending, completed, failed)

created_at (timestamp)