/**
 * 关于页面 - 展示产品介绍和功能特点
 */

import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
              关于 ProShot 上镜
            </h1>
            
            <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
              将普通的人台图、平铺图，低成本转化为高质量的真人模特营销图。
              专为淘宝、拼多多、Shopify卖家打造。
            </p>
            
            <Link href="/">
              <Button size="lg" className="gap-2">
                立即体验
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-20 bg-muted/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">为什么选择ProShot？</h2>
              <p className="text-lg text-muted-foreground">
                专业的AI技术，极简的操作体验
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>极速生成</CardTitle>
                  <CardDescription>
                    基于Google Gemini最先进大模型，30秒内完成高质量图片生成
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>还原度高</CardTitle>
                  <CardDescription>
                    精准保留商品Logo、版型、细节，不会出现变形
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>成本低廉</CardTitle>
                  <CardDescription>
                    告别昂贵的模特拍摄，1积分即可下载高清大图
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">简单三步，完成商拍</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">上传商品图</h3>
                <p className="text-muted-foreground">
                  上传人台图或平铺图，支持拖拽上传
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">选择风格</h3>
                <p className="text-muted-foreground">
                  选择模特类型和场景风格，一键配置
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">下载高清图</h3>
                <p className="text-muted-foreground">
                  预览满意后，消耗积分下载高清大图
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-20 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              立即体验ProShot，提升您的电商销量
            </h2>
            <p className="text-lg mb-8 opacity-90">
              加入数千家电商卖家，让商品照片更吸引人
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                免费注册，获得5积分
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
