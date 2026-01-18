'use client'

import { useEffect, useState } from 'react'
import { Loader2, Download, Sparkles, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useUser } from '@/hooks/use-user'
import { GenerationResult } from '@/types/generation'
import Link from 'next/link'

export default function GalleryPage() {
  const { user, loading: userLoading } = useUser()
  const [generations, setGenerations] = useState<GenerationResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadGenerations()
    } else if (!userLoading) {
      setLoading(false)
    }
  }, [user, userLoading])

  const loadGenerations = async () => {
    try {
      const response = await fetch('/api/generations')
      const data = await response.json()
      
      if (data.success) {
        setGenerations(data.generations)
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center glass-card p-8 mx-4 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">需要登录</h2>
            <p className="text-muted-foreground mb-6">
              请先登录以查看您的作品
            </p>
            <Link href="/login">
              <Button className="btn-glow">立即登录</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">我的作品</h1>
          <p className="text-muted-foreground">
            共 {generations.length} 张生成记录
          </p>
        </div>

        {generations.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generations.map((gen) => (
              <div key={gen.id} className="glass-card overflow-hidden group">
                <div className="aspect-[3/4] bg-muted/50 relative">
                  {gen.generatedImageUrl ? (
                    <>
                      <img
                        src={gen.generatedImageUrl}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                      {/* 悬浮操作 */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" className="gap-1">
                          <Download className="h-4 w-4" />
                          下载
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {gen.stylePreset?.split('-')[1] || '生成图'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(gen.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-xs ${
                      gen.status === 'completed' 
                        ? 'bg-green-500/10 text-green-500' 
                        : gen.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {gen.status === 'completed' ? '完成' : gen.status === 'failed' ? '失败' : '处理中'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2">还没有生成记录</h3>
            <p className="text-muted-foreground mb-6">
              前往首页开始创作您的第一张营销图
            </p>
            <Link href="/">
              <Button className="btn-glow gap-2">
                <Sparkles className="h-4 w-4" />
                开始创作
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
