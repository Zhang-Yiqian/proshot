'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Shirt, Package, Download, Gift, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { AuthDialog } from '@/components/common/auth-dialog'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { SCENE_PRESETS } from '@/config/presets'
import { MODEL_CONFIG } from '@/config/models'

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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0) // 当前选中的图片索引

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setGeneratedImage('') // 清除之前的生成结果
    setMultiPoseImages([])
    setSelectedImageIndex(0)
  }

  const handleClear = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    setGeneratedImage('')
    setMultiPoseImages([])
    setSelectedImageIndex(0)
  }

  const handleGenerate = async () => {
    // 未登录时弹出注册框
    if (!user && !MODEL_CONFIG.mockMode) {
      setShowAuthDialog(true)
      return
    }

    if (!selectedFile) return

    setGenerating(true)
    setGeneratedImage('')
    setMultiPoseImages([])
    setSelectedImageIndex(0)
    
    console.log('[Workbench] 开始生成...', { mode, selectedScene, mockMode: MODEL_CONFIG.mockMode })
    
    try {
      let publicUrl = ''

      if (MODEL_CONFIG.mockMode) {
        console.log('[Workbench] Mock 模式：使用虚拟 URL')
        publicUrl = 'https://mock-url.com/original.jpg'
      } else {
        console.log('[Workbench] 正常模式：正在上传图片到 Supabase...')
        console.log('[Workbench] 文件信息:', {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        })
        
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${user?.id || 'guest'}/${Date.now()}.${fileExt}`
        console.log('[Workbench] 目标文件名:', fileName)
        
        console.log('[Workbench] 开始上传...')
        const uploadStartTime = Date.now()

        // 检查 session 状态
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('[Workbench] 当前 session:', sessionData?.session ? `已登录 uid=${sessionData.session.user.id}` : '未登录')
        
        // 加超时保护（30s）
        const uploadPromise = supabase.storage
          .from('originals')
          .upload(fileName, selectedFile, { contentType: selectedFile.type })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('上传超时（30s），请检查网络连接')), 30000)
        )

        const { data: uploadData, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise])

        const uploadTime = Date.now() - uploadStartTime
        console.log(`[Workbench] 上传耗时: ${uploadTime}ms`)

        if (uploadError) {
          console.error('[Workbench] 上传失败:', uploadError)
          console.error('[Workbench] 错误详情:', JSON.stringify(uploadError, null, 2))
          throw uploadError
        }

        console.log('[Workbench] 上传成功，返回数据:', uploadData)

        const { data } = supabase.storage
          .from('originals')
          .getPublicUrl(fileName)
        
        publicUrl = data.publicUrl
        console.log('[Workbench] 上传成功，Public URL:', publicUrl)
      }

      console.log('[Workbench] 正在请求生成 API...')
      console.log('[Workbench] 请求参数:', {
        originalImageUrl: publicUrl,
        sceneType: selectedScene,
        mode,
      })
      
      const apiStartTime = Date.now()
      
      // 使用主图生成 API
      const response = await fetch('/api/generate/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImageUrl: publicUrl,
          sceneType: selectedScene,
          mode,
        }),
      })

      const apiTime = Date.now() - apiStartTime
      console.log(`[Workbench] API 响应耗时: ${apiTime}ms`)
      console.log('[Workbench] API 响应状态:', response.status)
      console.log('[Workbench] API 响应头:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('[Workbench] API 响应数据:', result)

      if (result.success) {
        setGeneratedImage(result.imageUrl)
        console.log('[Workbench] 生成成功！')
      } else {
        console.error('[Workbench] 生成失败:', result.error)
        alert(result.error || '生成失败，请重试')
      }
    } catch (error) {
      console.error('[Workbench] 发生异常:', error)
      alert('生成失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      console.log('[Workbench] 生成流程结束')
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

  // 构建显示图片列表（主图 + 多视角图）
  const allImages = generatedImage ? [generatedImage, ...multiPoseImages] : []

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <Header />
      
      {/* Workbench Layout - 左右分栏，无滚动 */}
      <main className="flex-1 flex overflow-hidden">
        {/* ========== 左侧配置栏 ========== */}
        <aside className="w-[360px] h-full border-r border-divider bg-sidebar overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6">
            {/* 标题 */}
            <div>
              <h1 className="text-2xl font-semibold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                一键上镜
              </h1>
              <p className="text-sm text-muted-foreground">
                上传商品图，AI 秒变专业商拍
              </p>
            </div>

            {/* 模式切换 */}
            <div className="glass-panel p-1">
              <button
                onClick={() => setMode('clothing')}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  mode === 'clothing'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shirt className="h-4 w-4" />
                服装上身
              </button>
              <button
                onClick={() => setMode('product')}
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/40 cursor-not-allowed mt-1"
              >
                <Package className="h-4 w-4" />
                物品场景
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted/30">即将上线</span>
              </button>
            </div>

            {/* 1. 上传商品图 - 紧凑卡片 */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                上传商品图
              </h3>
              
              {previewUrl ? (
                <div className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted/30 border border-divider">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-xl" />
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-divider hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">点击上传</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
                </div>
              )}
              
              <input
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </div>

            {/* 2. 选择场景 */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                选择场景
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                {SCENE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedScene(preset.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                      selectedScene === preset.id
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-divider bg-card/30 hover:border-primary/30 hover:bg-card/50"
                    )}
                  >
                    <span className="text-xl mb-1">{preset.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 生成按钮 - Sticky Bottom */}
            <div className="sticky bottom-0 left-0 right-0 bg-sidebar/80 backdrop-blur-xl pt-4 pb-2 space-y-3">
              <Button
                size="lg"
                className="w-full h-12 text-base font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
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
                    {!user && <span className="text-xs opacity-80">（需注册）</span>}
                  </>
                )}
              </Button>

              {/* 提示信息 */}
              {!user ? (
                <p className="text-xs text-center text-muted-foreground">
                  <Gift className="inline h-3.5 w-3.5 mr-1 text-primary" />
                  新用户注册即送 {siteConfig.credits.initial} 积分
                </p>
              ) : profile && (
                <p className="text-xs text-center text-muted-foreground">
                  当前积分：<span className="text-primary font-mono font-semibold">{profile.credits}</span>
                  <span className="mx-1.5">•</span>
                  预览免费，下载 1 积分/张
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* ========== 右侧画布区域 (左右结构) ========== */}
        <div className="flex-1 flex bg-preview overflow-hidden">
          {/* 主图区域 (左侧,占大部分空间) */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
            {allImages.length > 0 ? (
              <div className="relative flex flex-col items-center gap-6 max-w-full">
                {/* 主图容器 - 动态大小,最大化利用空间 */}
                <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-2xl overflow-hidden bg-muted/10 border border-divider shadow-2xl">
                  <img
                    src={allImages[selectedImageIndex]}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                  {/* 水印提示 */}
                  <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                    <div className="glass-panel px-4 py-2 text-sm text-muted-foreground">
                      预览图 • 下载高清无水印图需消耗 1 积分
                    </div>
                  </div>
                  
                  {/* 下载按钮 */}
                  <div className="absolute top-4 right-4">
                    <Button size="sm" className="gap-2 glass-panel h-9 px-4 shadow-lg">
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </div>

                  {/* 图片索引指示 */}
                  {allImages.length > 1 && (
                    <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 text-sm font-medium">
                      {selectedImageIndex + 1} / {allImages.length}
                    </div>
                  )}
                </div>

                {/* 多视角生成按钮 */}
                {generatedImage && selectedImageIndex === 0 && !generatingMultiPose && multiPoseImages.length === 0 && (
                  <Button
                    size="lg"
                    className="gap-2 h-12 px-8 bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                    onClick={handleGenerateMultiPose}
                  >
                    <Sparkles className="h-5 w-5" />
                    生成多视角套图
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-muted/20 border border-divider flex items-center justify-center mb-4 mx-auto">
                  <Sparkles className="h-12 w-12 text-muted-foreground/20" />
                </div>
                <p className="text-muted-foreground mb-2 text-base font-medium">生成的图片将显示在这里</p>
                <p className="text-sm text-muted-foreground/60">
                  上传图片 → 选择场景 → 点击生成
                </p>
              </div>
            )}
          </div>

          {/* 缩略图列表 (右侧,垂直排列) */}
          {allImages.length > 1 && (
            <div className="w-[200px] border-l border-divider bg-sidebar/30 p-4 overflow-y-auto scrollbar-thin">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground mb-1 px-1">
                  套图 ({allImages.length})
                </h3>
                
                {generatingMultiPose && multiPoseImages.length === 0 ? (
                  // 加载占位符
                  <>
                    {allImages.map((img, i) => (
                      <button
                        key={`existing-${i}`}
                        onClick={() => setSelectedImageIndex(i)}
                        className={cn(
                          "relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all",
                          selectedImageIndex === i
                            ? "border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/20"
                            : "border-divider hover:border-primary/60 opacity-75 hover:opacity-100"
                        )}
                      >
                        <img
                          src={img}
                          alt={`缩略图 ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImageIndex === i && (
                          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary shadow-lg" />
                        )}
                      </button>
                    ))}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={`loading-${i}`}
                        className="w-full aspect-[3/4] rounded-xl bg-muted/30 border-2 border-dashed border-divider flex flex-col items-center justify-center animate-pulse"
                      >
                        <Loader2 className="h-6 w-6 text-primary/40 animate-spin mb-1" />
                        <p className="text-xs text-muted-foreground">视角 {i + 2}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  // 所有缩略图
                  allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={cn(
                        "relative w-full aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-200",
                        selectedImageIndex === i
                          ? "border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/20"
                          : "border-divider hover:border-primary/60 opacity-75 hover:opacity-100"
                      )}
                    >
                      <img
                        src={img}
                        alt={`缩略图 ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* 选中指示器 */}
                      {selectedImageIndex === i && (
                        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary shadow-lg" />
                      )}
                      {/* 序号标签 */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                        {i === 0 ? '主图' : `视角${i}`}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 认证弹窗 */}
      <AuthDialog 
        open={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)}
      />
    </div>
  )
}
