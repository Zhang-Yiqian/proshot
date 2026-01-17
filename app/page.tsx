/**
 * 首页 - 直接展示工作台（提高转化率）
 * 用户可以预览和配置，提交时才要求注册
 */

'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { UploadZone } from '@/components/workbench/upload-zone'
import { ConfigPanel } from '@/components/workbench/config-panel'
import { AuthDialog } from '@/components/common/auth-dialog'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const { user, profile, loading: userLoading } = useUser()
  const supabase = createClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedScene, setSelectedScene] = useState('white-bg')
  const [generating, setGenerating] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
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
    // 如果用户未登录，弹出注册/登录弹窗
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    // 已登录用户，执行生成逻辑
    if (!selectedFile) return

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
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
                  {user ? '一键上镜' : '一键上镜（需要注册）'}
                </>
              )}
            </Button>

            {!user && (
              <div className="text-sm text-center text-muted-foreground">
                💡 点击生成按钮后需要注册才能查看结果，新用户赠送5积分
              </div>
            )}

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
                    <p className="text-xs mt-2">上传图片，选择风格，点击生成即可</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 认证弹窗（未登录用户点击生成时显示） */}
      <AuthDialog 
        open={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
      />
    </div>
  )
}
