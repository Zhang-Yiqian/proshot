'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Shirt, Package, ArrowRight, Zap, Download, Gift } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { UploadZone } from '@/components/workbench/upload-zone'
import { ConfigPanel } from '@/components/workbench/config-panel'
import { AuthDialog } from '@/components/common/auth-dialog'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

type GenerationMode = 'clothing' | 'product'

export default function HomePage() {
  const router = useRouter()
  const { user, profile } = useUser()
  const supabase = createClient()

  // 状态
  const [mode, setMode] = useState<GenerationMode>('clothing')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedScene, setSelectedScene] = useState('white-bg')
  const [generating, setGenerating] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string>('')
  const [multiPoseImages, setMultiPoseImages] = useState<string[]>([])
  const [generatingMultiPose, setGeneratingMultiPose] = useState(false)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setGeneratedImage('') // 清除之前的生成结果
    setMultiPoseImages([])
  }

  const handleClear = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    setGeneratedImage('')
    setMultiPoseImages([])
  }

  const handleGenerate = async () => {
    // 未登录时弹出注册框
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    if (!selectedFile) return

    setGenerating(true)
    setGeneratedImage('')
    setMultiPoseImages([])
    try {
      // 上传图片
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('originals')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('originals')
        .getPublicUrl(fileName)

      // 调用生成 API
      const response = await fetch('/api/generate/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImageUrl: publicUrl,
          sceneType: selectedScene,
          mode,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedImage(result.imageUrl)
      } else {
        alert(result.error || '生成失败，请重试')
      }
    } catch (error) {
      console.error('生成失败:', error)
      alert('生成失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateMultiPose = async () => {
    if (!generatedImage) return

    setGeneratingMultiPose(true)
    try {
      const response = await fetch('/api/generate/multi-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainImageUrl: generatedImage,
        }),
      })

      const result = await response.json()

      if (result.success && result.imageUrls) {
        setMultiPoseImages(result.imageUrls)
        // 滚动到多视角图区域
        setTimeout(() => {
          document.getElementById('multi-pose-results')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        alert(result.error || '生成多视角图失败')
      }
    } catch (error) {
      console.error('多视角生成失败:', error)
      alert('生成多视角图失败，请稍后重试')
    } finally {
      setGeneratingMultiPose(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero 区域 */}
        <section className="container py-8 md:py-12">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              <span className="text-gradient">一键上镜</span>
              <span className="text-foreground">，让商品更出众</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              上传商品图，AI 秒变专业商拍。告别高成本，拥抱高效率。
            </p>
          </div>

          {/* 模式切换 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center p-1 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50">
              <button
                onClick={() => setMode('clothing')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === 'clothing'
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shirt className="h-4 w-4" />
                服装上身
              </button>
              <button
                onClick={() => setMode('product')}
                disabled
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === 'product'
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                )}
              >
                <Package className="h-4 w-4" />
                物品场景
                <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">
                  即将上线
                </span>
              </button>
            </div>
          </div>

          {/* 工作区 */}
          <div className="grid gap-6 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* 左侧：上传和配置 */}
            <div className="space-y-6">
              {/* 上传区域 */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold">1</span>
                  上传商品图
                </h2>
                <UploadZone
                  onFileSelect={handleFileSelect}
                  onClear={handleClear}
                  previewUrl={previewUrl}
                />
              </div>

              {/* 场景选择 */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold">2</span>
                  选择场景
                </h2>
                <ConfigPanel
                  selectedScene={selectedScene}
                  onSceneChange={setSelectedScene}
                />
              </div>

              {/* 生成按钮 */}
              <Button
                size="lg"
                className="w-full h-14 text-lg btn-glow gap-2"
                disabled={!selectedFile || generating}
                onClick={handleGenerate}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    AI 正在创作...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    一键上镜
                    {!user && <span className="text-sm opacity-80">（需注册）</span>}
                  </>
                )}
              </Button>

              {/* 提示信息 */}
              {!user ? (
                <p className="text-sm text-center text-muted-foreground">
                  <Gift className="inline h-4 w-4 mr-1 text-secondary" />
                  新用户注册即送 {siteConfig.credits.initial} 积分
                </p>
              ) : profile && (
                <p className="text-sm text-center text-muted-foreground">
                  当前积分：<span className="text-primary font-mono font-bold">{profile.credits}</span>
                  <span className="mx-2">•</span>
                  预览免费，下载 1 积分/张
                </p>
              )}
            </div>

            {/* 右侧：生成结果 */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold">3</span>
                生成结果
              </h2>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-border/50 aspect-[3/4] bg-muted">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                    {/* 水印提示 */}
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xs text-white/70 text-center">
                        预览图 • 下载高清无水印图需消耗 1 积分
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full gap-2" variant="secondary">
                      <Download className="h-4 w-4" />
                      下载主图
                    </Button>
                    <Button 
                      className="w-full gap-2 btn-glow" 
                      onClick={handleGenerateMultiPose}
                      disabled={generatingMultiPose}
                    >
                      {generatingMultiPose ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      生成多视角
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center aspect-[3/4]">
                  <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground mb-2">生成的图片将显示在这里</p>
                  <p className="text-sm text-muted-foreground/70">
                    上传图片 → 选择场景 → 点击生成
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 多视角图结果区域 */}
          { (generatingMultiPose || multiPoseImages.length > 0) && (
            <div id="multi-pose-results" className="mt-12 space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  多视角姿态展示
                </h2>
                {multiPoseImages.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    打包下载全部
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {generatingMultiPose && multiPoseImages.length === 0 ? (
                  // 加载状态占位符
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="glass-card aspect-[3/4] flex flex-col items-center justify-center animate-pulse bg-muted/50">
                      <Loader2 className="h-8 w-8 text-primary/40 animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground">正在生成视角 {i + 1}...</p>
                    </div>
                  ))
                ) : (
                  multiPoseImages.map((img, i) => (
                    <div key={i} className="group relative glass-card overflow-hidden aspect-[3/4] border-border/50 hover:border-primary/50 transition-all">
                      <img
                        src={img}
                        alt={`Pose ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" variant="secondary" className="rounded-full">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* 特性介绍 */}
        <section className="container py-16 border-t border-border/40">
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">秒级生成</h3>
              <p className="text-sm text-muted-foreground">
                AI 驱动，30 秒内完成专业级商拍效果
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 text-secondary mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">高度还原</h3>
              <p className="text-sm text-muted-foreground">
                精准保留服装细节、颜色和款式特征
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <ArrowRight className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">简单易用</h3>
              <p className="text-sm text-muted-foreground">
                无需专业技能，上传即可生成营销大片
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* 认证弹窗 */}
      <AuthDialog 
        open={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
      />
    </div>
  )
}
