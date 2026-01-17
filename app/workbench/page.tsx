/**
 * Workbench 工作台页面
 */

'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { UploadZone } from '@/components/workbench/upload-zone'
import { ConfigPanel } from '@/components/workbench/config-panel'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function WorkbenchPage() {
  const { user, profile, loading: userLoading } = useUser()
  const supabase = createClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedScene, setSelectedScene] = useState('white-bg')
  const [generating, setGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleClear = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const handleGenerate = async () => {
    if (!selectedFile || !user) return

    setGenerating(true)
    try {
      // 1. 上传原图到Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('originals')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('originals')
        .getPublicUrl(fileName)

      // 2. 调用生成API
      const response = await fetch('/api/generate/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImageUrl: publicUrl,
          sceneType: selectedScene,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedImages([result.imageUrl])
      } else {
        alert(result.error || '生成失败')
      }
    } catch (error) {
      console.error('生成失败:', error)
      alert('生成失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  if (userLoading) {
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
                请先登录以使用工作台功能
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
          <h1 className="text-3xl font-bold mb-2">工作台</h1>
          <p className="text-muted-foreground">
            上传商品图片，选择风格，一键生成营销图
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 左侧：上传和配置 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>上传商品图</CardTitle>
                <CardDescription>
                  上传人台图或平铺图（支持拖拽）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadZone
                  onFileSelect={handleFileSelect}
                  onClear={handleClear}
                  previewUrl={previewUrl}
                />
              </CardContent>
            </Card>

            <ConfigPanel
              selectedScene={selectedScene}
              onSceneChange={setSelectedScene}
            />

            <Button
              size="lg"
              className="w-full gap-2"
              disabled={!selectedFile || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  一键上镜
                </>
              )}
            </Button>

            {profile && (
              <div className="text-sm text-muted-foreground text-center">
                当前积分：<span className="font-bold text-primary">{profile.credits}</span>
                {' '}| 生成预览免费，下载消耗1积分
              </div>
            )}
          </div>

          {/* 右侧：生成结果 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>生成结果</CardTitle>
                <CardDescription>
                  预览生成的图片，满意后下载高清大图
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    {generatedImages.map((url, index) => (
                      <div key={index} className="relative rounded-lg border overflow-hidden">
                        <img
                          src={url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto"
                        />
                        <div className="p-4 bg-background/95 backdrop-blur">
                          <Button className="w-full">
                            下载高清图 (-1积分)
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                    <p>生成的图片将显示在这里</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
