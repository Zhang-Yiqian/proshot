/**
 * Gallery 画廊页面 - 历史生成记录
 */

'use client'

import { useEffect, useState } from 'react'
import { Loader2, Download, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
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
    }
  }, [user])

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
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>需要登录</CardTitle>
              <CardDescription>
                请先登录以查看历史记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button className="w-full">立即登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">我的作品</h1>
          <p className="text-muted-foreground">
            查看您的历史生成记录
          </p>
        </div>

        {generations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {generations.map((gen) => (
              <Card key={gen.id}>
                <CardContent className="p-4">
                  <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-muted">
                    {gen.generatedImageUrl ? (
                      <img
                        src={gen.generatedImageUrl}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium">{gen.stylePreset}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {gen.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">还没有生成记录</h3>
            <p className="text-muted-foreground mb-6">
              前往工作台开始创作您的第一张营销图
            </p>
            <Link href="/workbench">
              <Button>开始创作</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
