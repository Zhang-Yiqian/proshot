export const siteConfig = {
  name: "ProShot 上镜",
  description: "电商智能商拍工具，让商品一键入画",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/og-image.jpg",
  links: {
    github: "https://github.com/yourusername/proshot",
  },
  initialCredits: 5, // 新用户初始积分
  creditPrice: {
    preview: 0, // 预览图免费
    download: 1, // 下载高清图 1 积分
  },
}
