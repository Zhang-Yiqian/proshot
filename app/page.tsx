'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, X, Gift, ImageIcon, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { AuthDialog } from '@/components/common/auth-dialog'
import { GenerationRecordCard } from '@/components/workbench/generation-record-card'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { SCENE_PRESETS } from '@/config/presets'
import { MODEL_CONFIG } from '@/config/models'
import type { GenerationRecord, GenerationMode } from '@/types/generation-record'

// 调试模式：生成 3 张；正式上线改为 5
const MULTI_POSE_GENERATE_COUNT = 3

export default function HomePage() {
  const { user, profile } = useUser()
  const supabase = createClient()

  const mode: GenerationMode = 'clothing'
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedScene, setSelectedScene] = useState('white-bg')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [records, setRecords] = useState<GenerationRecord[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = sessionStorage.getItem('proshot_records')
      if (!saved) return []
      const parsed = JSON.parse(saved) as GenerationRecord[]
      return parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
    } catch {
      return []
    }
  })

  // 每次 records 变化时同步到 sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('proshot_records', JSON.stringify(records))
    } catch {
      // sessionStorage 不可用时静默忽略
    }
  }, [records])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleClear = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const handleGenerate = async () => {
    if (!user && !MODEL_CONFIG.mockMode && !MODEL_CONFIG.mockMainImageMode) {
      setShowAuthDialog(true)
      return
    }

    if (!selectedFile) return

    const scene = SCENE_PRESETS.find((s) => s.id === selectedScene)!
    const recordId = `record-${Date.now()}`

    // 立即新增一条"生成中"记录，出现在时间线顶部
    const newRecord: GenerationRecord = {
      id: recordId,
      timestamp: new Date(),
      mode,
      sceneId: selectedScene,
      sceneName: scene.name,
      sceneIcon: scene.icon,
      referenceImageUrl: previewUrl,
      referenceFileName: selectedFile.name,
      mainImage: null,
      generating: true,
      multiPoseImages: [],
      generatingMultiPose: false,
    }

    setRecords((prev) => [newRecord, ...prev])

    console.log('[Workbench] 开始生成...', {
      mode,
      selectedScene,
      mockMode: MODEL_CONFIG.mockMode,
      mockMainImageMode: MODEL_CONFIG.mockMainImageMode,
    })

    try {
      let publicUrl = ''

      if (MODEL_CONFIG.mockMode || MODEL_CONFIG.mockMainImageMode) {
        console.log('[Workbench] Mock 模式：跳过上传，使用虚拟 URL')
        publicUrl = 'https://mock-url.com/original.jpg'
      } else {
        console.log('[Workbench] 正常模式：正在上传图片到 Supabase...')

        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${user?.id || 'guest'}/${Date.now()}.${fileExt}`

        const { data: sessionData } = await supabase.auth.getSession()
        console.log(
          '[Workbench] 当前 session:',
          sessionData?.session ? `已登录 uid=${sessionData.session.user.id}` : '未登录'
        )

        const uploadPromise = supabase.storage
          .from('originals')
          .upload(fileName, selectedFile, { contentType: selectedFile.type })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('上传超时（30s），请检查网络连接')), 30000)
        )

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise])

        if (uploadError) {
          console.error('[Workbench] 上传失败:', uploadError)
          throw uploadError
        }

        const { data } = supabase.storage.from('originals').getPublicUrl(fileName)
        publicUrl = data.publicUrl
        console.log('[Workbench] 上传成功，Public URL:', publicUrl)
      }

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
      console.log('[Workbench] API 响应数据:', result)

      if (result.success) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId ? { ...r, mainImage: result.imageUrl, generating: false } : r
          )
        )
        console.log('[Workbench] 生成成功！')
      } else {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r))
        )
        console.error('[Workbench] 生成失败:', result.error)
        alert(result.error || '生成失败，请重试')
      }
    } catch (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r))
      )
      console.error('[Workbench] 发生异常:', error)
      alert('生成失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handleGenerateMultiPose = async (recordId: string) => {
    const record = records.find((r) => r.id === recordId)
    if (!record?.mainImage) return

    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, generatingMultiPose: true } : r))
    )

    try {
      const response = await fetch('/api/generate/multi-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainImageUrl: record.mainImage }),
      })

      const result = await response.json()

      if (result.success && result.imageUrls) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, multiPoseImages: result.imageUrls, generatingMultiPose: false }
              : r
          )
        )
      } else {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, generatingMultiPose: false } : r))
        )
        alert(result.error || '生成多视角图失败')
      }
    } catch (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, generatingMultiPose: false } : r))
      )
      console.error('多视角生成失败:', error)
      alert('生成多视角图失败，请稍后重试')
    }
  }

  const currentScene = SCENE_PRESETS.find((s) => s.id === selectedScene)

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* ========== 左侧配置栏 ========== */}
        <aside className="w-[340px] flex-none h-full border-r border-divider bg-sidebar overflow-y-auto scrollbar-thin">
          <div className="p-5 space-y-5">
            {/* 标题 */}
            <div className="pt-1">
              <h1 className="text-xl font-bold mb-1 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                一键上镜
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                上传服装白底图，AI 秒变专业商拍
              </p>
            </div>

            {/* 1. 上传商品图 */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/12 text-primary text-[11px] font-bold">
                  1
                </span>
                上传白底商品图
              </h3>

              {previewUrl ? (
                <div className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted/20 border border-divider/60">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="glass-thin px-2.5 py-1 text-[11px] text-muted-foreground truncate text-center">
                      {selectedFile?.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-divider hover:border-primary/40 bg-muted/10 hover:bg-primary/5 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground/70">点击上传</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPG · PNG · WEBP</p>
                  </div>
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
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/12 text-primary text-[11px] font-bold">
                  2
                </span>
                选择拍摄场景
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {SCENE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedScene(preset.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200',
                      selectedScene === preset.id
                        ? 'border-primary/40 bg-primary/8 shadow-sm shadow-primary/10'
                        : 'border-divider/60 bg-muted/10 hover:border-primary/25 hover:bg-muted/20'
                    )}
                  >
                    <span className="text-lg mb-1 leading-none">{preset.icon}</span>
                    <span
                      className={cn(
                        'text-[11px] font-medium text-center leading-tight',
                        selectedScene === preset.id ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              {currentScene && (
                <p className="text-[11px] text-muted-foreground/70 bg-muted/20 rounded-lg px-3 py-2 leading-relaxed">
                  {currentScene.description}
                </p>
              )}
            </div>

            {/* 3. 生成按钮 */}
            <div className="sticky bottom-0 left-0 right-0 bg-sidebar/80 backdrop-blur-xl pt-3 pb-2 space-y-2.5">
              <Button
                size="lg"
                className={cn(
                  'w-full h-11 text-sm font-semibold gap-2 transition-all duration-200',
                  'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground',
                  'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35',
                  'disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed'
                )}
                disabled={!selectedFile}
                onClick={handleGenerate}
              >
                <Sparkles className="h-4 w-4" />
                一键上镜
                {!user && <span className="text-xs opacity-70 font-normal">（需注册）</span>}
              </Button>

              {!user ? (
                <p className="text-[11px] text-center text-muted-foreground">
                  <Gift className="inline h-3 w-3 mr-1 text-primary/70" />
                  新用户注册即送 {siteConfig.credits.initial} 积分
                </p>
              ) : (
                profile && (
                  <p className="text-[11px] text-center text-muted-foreground">
                    积分：
                    <span className="text-primary font-mono font-bold">{profile.credits}</span>
                    <span className="mx-1 opacity-40">·</span>
                    预览免费，下载 1 积分/张
                  </p>
                )
              )}
            </div>
          </div>
        </aside>

        {/* ========== 右侧时间线 Feed ========== */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-feed">
          {records.length === 0 ? (
            /* 空状态 */
            <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
              <div className="glass-deep rounded-3xl p-10 flex flex-col items-center gap-5 max-w-sm text-center">
                <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center">
                  <Layers className="h-7 w-7 text-primary/40" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground/70 mb-1.5">
                    生成记录将显示在这里
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    在左侧上传服装图片，选择场景后<br />点击「一键上镜」开始创作
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">1</span>
                    </div>
                    上传图片
                  </div>
                  <div className="w-4 h-px bg-divider" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">2</span>
                    </div>
                    选择场景
                  </div>
                  <div className="w-4 h-px bg-divider" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">3</span>
                    </div>
                    生成上镜
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 时间线记录 */
            <div className="p-6 space-y-4">
              {/* 记录数量提示 */}
              <div className="flex items-center gap-2 px-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                  <Layers className="h-3.5 w-3.5" />
                  <span>共 {records.length} 条生成记录</span>
                </div>
              </div>

              {records.map((record) => (
                <GenerationRecordCard
                  key={record.id}
                  record={record}
                  onGenerateMultiPose={() => handleGenerateMultiPose(record.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </div>
  )
}
