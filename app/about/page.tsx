'use client'

import { ArrowLeft, Sparkles, Zap, Heart, Shield } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="container py-12 max-w-3xl">
          {/* 返回链接 */}
          <Link 
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          {/* 标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              关于 <span className="text-gradient">ProShot</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              让每个电商卖家都能拥有专业级商拍
            </p>
          </div>

          {/* 内容 */}
          <div className="glass-card p-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                我们的使命
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ProShot（上镜）致力于用 AI 技术革新电商商拍流程。我们相信，每个中小卖家都应该能够以极低的成本，获得专业级的产品营销图。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                技术驱动
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                我们采用 Google Gemini 最先进的多模态大模型，结合自研的 Prompt 工程，确保生成的图片既美观又真实，高度还原商品细节。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                用户至上
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                我们深知电商卖家的痛点：传统商拍成本高、周期长、效果不可控。ProShot 提供&ldquo;先体验，后付费&rdquo;的模式，让您在看到效果后再做决定。
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                隐私保护
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                您上传的图片仅用于生成服务，我们承诺不会将您的商品图片用于任何其他用途。您可以随时删除您的生成记录和原始图片。
              </p>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              有任何问题或建议？请联系我们：
              <a href="mailto:support@proshot.ai" className="text-primary hover:underline ml-1">
                support@proshot.ai
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
