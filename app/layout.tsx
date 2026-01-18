import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ProShot 上镜 - 电商智能商拍工具",
  description: "让商品一键入画，将普通商品图转化为高质量真人模特营销图",
  keywords: ["电商", "商拍", "AI", "图片生成", "模特图"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="light" style={{ colorScheme: 'light' }}>
      <body className="font-sans antialiased">
        {/* 背景效果 */}
        <div className="fixed inset-0 bg-grid pointer-events-none" />
        <div className="fixed inset-0 bg-glow pointer-events-none" />
        
        {/* 主内容 */}
        <div className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
