'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, X, Gift, ImageIcon, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { AuthDialog } from '@/components/common/auth-dialog'
import { GenerationRecordCard } from '@/components/workbench/generation-record-card'
import { useUser } from '@/hooks/use-user'
import { useCredits } from '@/hooks/use-credits'
import { createClient } from '@/lib/supabase/client'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { SCENE_PRESETS, MODEL_TYPES, DEFAULT_MODEL_TYPE_ID, findSceneById } from '@/config/presets'
import { MODEL_CONFIG } from '@/config/models'
import { SceneSelector } from '@/components/workbench/scene-selector'
import type { GenerationRecord, GenerationMode } from '@/types/generation-record'
import type { GenerationResult } from '@/types/generation'

// ─── 生成记录本地缓存（stale-while-revalidate）────────────────────────────────
const RECORDS_CACHE_PREFIX = 'proshot_records_'

function readCachedRecords(userId: string): GenerationRecord[] | null {
  try {
    const raw = localStorage.getItem(RECORDS_CACHE_PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Array<Omit<GenerationRecord, 'timestamp'> & { timestamp: string }>
    return parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
  } catch {
    return null
  }
}

function writeCachedRecords(userId: string, records: GenerationRecord[]): void {
  try {
    localStorage.setItem(RECORDS_CACHE_PREFIX + userId, JSON.stringify(records))
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 将数据库的 GenerationResult 转换为 UI 展示的 GenerationRecord。
 * style_preset 格式为 "${mode}-${sceneId}"，例如 "clothing-white-bg"
 */
function dbRecordToUIRecord(gen: GenerationResult & { multiPoseImageUrls?: string[] }): GenerationRecord {
  const firstDash = gen.stylePreset.indexOf('-')
  const mode = (firstDash > 0 ? gen.stylePreset.slice(0, firstDash) : 'clothing') as GenerationMode
  const sceneId = firstDash > 0 ? gen.stylePreset.slice(firstDash + 1) : gen.stylePreset
  const scene = SCENE_PRESETS.find((s) => s.id === sceneId)
  return {
    id: gen.id,
    timestamp: new Date(gen.createdAt),
    mode,
    sceneId,
    sceneName: scene?.name ?? sceneId,
    sceneIcon: scene?.icon ?? '📷',
    referenceImageUrl: gen.originalImageUrl,
    referenceFileName: 'uploaded-image.jpg',
    mainImage: gen.generatedImageUrl ?? null,
    generating: false,
    multiPoseImages: gen.multiPoseImageUrls ?? [],
    generatingMultiPose: false,
  }
}

// 调试模式：生成 3 张；正式上线改为 5
const MULTI_POSE_GENERATE_COUNT = 3

/**
 * 将 File 转换为小尺寸 base64 缩略图（用于持久化存储，避免 blob URL 刷新后失效）
 */
async function fileToThumbnail(file: File, maxSize = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(''); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      console.warn('[Workbench] fileToThumbnail 失败，降级为空字符串')
      resolve('')
    }
    img.src = blobUrl
  })
}

export default function HomePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useUser()
  const { deductCredit, addCredit } = useCredits()
  const supabase = createClient()

  const mode: GenerationMode = 'clothing'
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedModelType, setSelectedModelType] = useState<string>(DEFAULT_MODEL_TYPE_ID)
  // null 表示未选中任何预设场景（与自定义输入互斥）
  const [selectedScene, setSelectedScene] = useState<string | null>('pure-white')
  const [customScene, setCustomScene] = useState('')
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  /** 选择预设场景时，清空自定义输入（互斥逻辑） */
  const handleSceneChange = (sceneId: string | null) => {
    setSelectedScene(sceneId)
    if (sceneId !== null) setCustomScene('')
  }

  /** 输入自定义场景时，取消预设选中（互斥逻辑） */
  const handleCustomSceneChange = (value: string) => {
    setCustomScene(value)
    if (value.trim()) setSelectedScene(null)
  }

  /** 是否满足「必须选一个」校验 */
  const hasScene = !!selectedScene || !!customScene.trim()

  const [records, setRecords] = useState<GenerationRecord[]>([])
  // 追踪上一次的 userId，用于判断登录/登出事件
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  // 直接从 Supabase 客户端查询（绕过 API Route，减少网络往返）
  // stale-while-revalidate：先从 localStorage 恢复，再后台刷新
  const loadRecordsFromDB = useCallback(async (userId: string) => {
    // 1. 立即从缓存恢复，消除白屏
    const cached = readCachedRecords(userId)
    if (cached && cached.length > 0) {
      setRecords((prev) => {
        // 只保留本次会话新增的"生成中"记录，缓存记录追加在后面
        const inProgress = prev.filter((r) => r.generating || r.generatingMultiPose)
        return [...inProgress, ...cached]
      })
      console.log(`[Records] 从缓存恢复 ${cached.length} 条记录`)
    }

    // 2. 后台从数据库刷新
    try {
      console.log('[Records] 后台刷新历史记录...')
      const { data, error } = await supabase
        .from('generations')
        .select('id, user_id, original_image_url, generated_image_url, multi_pose_image_urls, prompt_used, style_preset, status, error_message, created_at, updated_at')
        .eq('user_id', userId)
        .in('status', ['completed', 'pending'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('[Records] 数据库查询失败:', error.message)
        return
      }

      const freshRecords = (data ?? []).map((row) =>
        dbRecordToUIRecord({
          id: row.id,
          userId: row.user_id,
          originalImageUrl: row.original_image_url,
          generatedImageUrl: row.generated_image_url,
          multiPoseImageUrls: row.multi_pose_image_urls ?? [],
          promptUsed: row.prompt_used,
          stylePreset: row.style_preset,
          status: row.status,
          errorMessage: row.error_message,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      )

      setRecords((prev) => {
        // 保留本次会话正在进行中的记录，其余全部替换为最新数据
        const inProgress = prev.filter((r) => r.generating || r.generatingMultiPose)
        return [...inProgress, ...freshRecords]
      })

      writeCachedRecords(userId, freshRecords)
      console.log(`[Records] 已从数据库加载 ${freshRecords.length} 条记录`)
    } catch (e) {
      console.warn('[Records] 从数据库加载记录失败:', e)
    }
  }, [supabase])

  // 监听登录/登出状态变化，同步生成记录
  useEffect(() => {
    // authLoading 期间不处理，等待确定的用户状态
    if (authLoading) return

    const currentUserId = user?.id ?? null
    const prevUserId = prevUserIdRef.current

    // undefined 代表初始化尚未发生，不触发（避免和 null 混淆）
    if (prevUserId === undefined) {
      prevUserIdRef.current = currentUserId
      // 初始化时若已登录，立即加载记录
      if (currentUserId) {
        loadRecordsFromDB(currentUserId)
      }
      return
    }

    if (currentUserId === prevUserId) return
    prevUserIdRef.current = currentUserId

    if (currentUserId) {
      // 用户登录：加载历史记录
      loadRecordsFromDB(currentUserId)
    } else {
      // 用户登出：清空记录
      console.log('[Records] 用户已登出，清空生成记录')
      setRecords([])
    }
  }, [user, authLoading, loadRecordsFromDB])

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
    // 1. 始终先检查登录态（mock 模式除外，用于本地开发）
    if (!MODEL_CONFIG.mockMode && !MODEL_CONFIG.mockMainImageMode) {
      if (!user) {
        setShowAuthDialog(true)
        return
      }

      // 2. 检查积分余额
      const cost = siteConfig.credits.mainImageCost
      const currentCredits = profile?.credits ?? 0
      if (currentCredits < cost) {
        alert(`积分不足（当前 ${currentCredits} 积分，生成上身图需要 ${cost} 积分），请购买积分后再试`)
        return
      }
    }

    if (!selectedFile) return

    const sceneInfo = (selectedScene ? findSceneById(selectedScene) : null)
      ?? { name: customScene.trim() || '自定义场景', icon: '📷', promptDetail: '' }
    const recordId = `record-${Date.now()}`

    // Bug 修复：referenceImageUrl 使用 base64 缩略图而非 blob URL。
    // blob URL（blob:http://...）仅在当前页面生命周期有效，刷新后失效导致图片裂开。
    // base64 data URL 可持久化存储在 sessionStorage，刷新后仍可正常显示。
    console.log('[Workbench] 生成参考图缩略图（base64）...')
    const thumbnailUrl = await fileToThumbnail(selectedFile)
    console.log(`[Workbench] 缩略图生成完成，大小约 ${Math.round(thumbnailUrl.length / 1024)}KB`)

    // 立即新增一条"生成中"记录，出现在时间线顶部
    const displayName = customScene.trim() ? `自定义: ${customScene.trim()}` : sceneInfo.name
    const newRecord: GenerationRecord = {
      id: recordId,
      timestamp: new Date(),
      mode,
      sceneId: selectedScene ?? 'custom',
      sceneName: displayName,
      sceneIcon: sceneInfo.icon,
      referenceImageUrl: thumbnailUrl,  // base64，持久化安全
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

    // 3. 虚扣除积分（立即从后端扣除，生成失败后返还）
    const cost = siteConfig.credits.mainImageCost
    let creditDeducted = false
    if (!MODEL_CONFIG.mockMode && !MODEL_CONFIG.mockMainImageMode && user) {
      const deductResult = await deductCredit(cost)
      if (!deductResult.success) {
        setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r)))
        alert(deductResult.error || '积分扣除失败，请重试')
        return
      }
      creditDeducted = true
      console.log(`[Workbench] 已扣除 ${cost} 积分，剩余 ${deductResult.newBalance} 积分`)
    }

    try {
      let publicUrl = ''

      if (MODEL_CONFIG.mockMode || MODEL_CONFIG.mockMainImageMode) {
        console.log('[Workbench] Mock 模式：跳过上传，使用虚拟 URL')
        publicUrl = 'https://mock-url.com/original.jpg'
      } else {
        // 关键修复：移除 supabase.auth.getSession() 调用。
        // 在 onAuthStateChange SIGNED_IN 处理期间调用 getSession() 可能触发 Supabase 内部锁，
        // 导致 await 永远不 resolve，上传流程卡死。直接使用 hook 提供的 user 对象即可。
        if (!user) {
          throw new Error('用户未登录，无法上传图片')
        }

        const fileExt = selectedFile.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        console.log('[Workbench] 准备上传:', {
          bucket: 'originals',
          fileName,
          fileSize: `${(selectedFile.size / 1024).toFixed(1)}KB`,
          fileType: selectedFile.type,
          userId: user.id,
        })

        const uploadPromise = supabase.storage
          .from('originals')
          .upload(fileName, selectedFile, { contentType: selectedFile.type })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('上传超时（30s），请检查网络连接或 Supabase Storage 策略')), 30000)
        )

        console.log('[Workbench] 上传请求已发出，等待响应...')
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise])
        const { error: uploadError, data: uploadData } = uploadResult

        if (uploadError) {
          console.error('[Workbench] 上传失败:', {
            message: uploadError.message,
            // @ts-ignore
            statusCode: uploadError.statusCode,
            // @ts-ignore
            error: uploadError.error,
          })
          throw uploadError
        }

        console.log('[Workbench] 上传成功，Storage path:', uploadData?.path)

        const { data } = supabase.storage.from('originals').getPublicUrl(fileName)
        publicUrl = data.publicUrl
        console.log('[Workbench] Public URL:', publicUrl)

        // 上传完成后，将 referenceImageUrl 升级为永久 Supabase URL
        setRecords((prev) =>
          prev.map((r) => r.id === recordId ? { ...r, referenceImageUrl: publicUrl } : r)
        )
        console.log('[Workbench] referenceImageUrl 已升级为永久 URL')
      }

      const sceneType = selectedScene ?? 'custom'
      console.log('[Workbench] 调用生成 API...', { originalImageUrl: publicUrl, sceneType, customScene: customScene || '(无)', mode, modelType: selectedModelType })
      const response = await fetch('/api/generate/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImageUrl: publicUrl,
          sceneType,
          customScene: customScene.trim(),
          mode,
          modelType: selectedModelType,
        }),
      })

      console.log('[Workbench] API 响应状态:', response.status, response.statusText)
      if (!response.ok) {
        const errText = await response.text()
        console.error('[Workbench] API 返回错误:', errText)
        throw new Error(`API 请求失败 (${response.status}): ${errText}`)
      }

      const result = await response.json()
      console.log('[Workbench] API 响应数据:', result)

      if (result.success) {
        // 将临时 recordId 替换为数据库生成的真实 ID（如有），保证后续操作一致
        const finalId = result.generationId ?? recordId
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, id: finalId, mainImage: result.imageUrl, generating: false }
              : r
          )
        )
        console.log('[Workbench] 生成成功！generationId:', finalId)
        // 生成成功后刷新积分确保 UI 与 DB 保持一致
        refreshProfile().catch(() => {})
      } else {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r))
        )
        // 生成失败 → 返还积分
        if (creditDeducted) {
          console.log('[Workbench] 生成失败，返还积分...')
          await addCredit(cost)
        }
        console.error('[Workbench] 生成失败:', result.error)
        alert(result.error || '生成失败，积分已返还，请重试')
      }
    } catch (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r))
      )
      // 异常 → 返还积分
      if (creditDeducted) {
        console.log('[Workbench] 发生异常，返还积分...')
        await addCredit(cost)
      }
      console.error('[Workbench] 发生异常:', error)
      alert('生成失败，积分已返还。错误：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handleGenerateMultiPose = async (recordId: string) => {
    const record = records.find((r) => r.id === recordId)
    if (!record?.mainImage) return

    // 1. 检查登录态（mock 模式跳过）
    if (!MODEL_CONFIG.mockMode) {
      if (!user) {
        setShowAuthDialog(true)
        return
      }

      // 2. 检查积分余额
      const cost = siteConfig.credits.multiPoseCost
      const currentCredits = profile?.credits ?? 0
      if (currentCredits < cost) {
        alert(`积分不足（当前 ${currentCredits} 积分，生成多姿势图需要 ${cost} 积分），请购买积分后再试`)
        return
      }
    }

    const multiPoseCost = siteConfig.credits.multiPoseCost
    let creditDeducted = false

    // 3. 虚扣除积分
    if (!MODEL_CONFIG.mockMode && user) {
      const deductResult = await deductCredit(multiPoseCost)
      if (!deductResult.success) {
        alert(deductResult.error || '积分扣除失败，请重试')
        return
      }
      creditDeducted = true
      console.log(`[Workbench] 已扣除 ${multiPoseCost} 积分（多姿势图），剩余 ${deductResult.newBalance} 积分`)
    }

    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, generatingMultiPose: true } : r))
    )

    try {
      const response = await fetch('/api/generate/multi-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainImageUrl: record.mainImage, generationId: recordId }),
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
        // 生成失败 → 返还积分
        if (creditDeducted) {
          console.log('[Workbench] 多姿势图生成失败，返还积分...')
          await addCredit(multiPoseCost)
        }
        alert(result.error || '生成多姿势图失败，积分已返还，请重试')
      }
    } catch (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, generatingMultiPose: false } : r))
      )
      // 异常 → 返还积分
      if (creditDeducted) {
        console.log('[Workbench] 多姿势图生成异常，返还积分...')
        await addCredit(multiPoseCost)
      }
      console.error('多姿势图生成失败:', error)
      alert('生成多姿势图失败，积分已返还，请稍后重试')
    }
  }

  const currentScene = selectedScene ? findSceneById(selectedScene) : null

  return (
    <div className="flex h-screen flex-col bg-app overflow-hidden">
      <Header />

      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* ========== 左侧配置栏 ========== */}
        <aside className="w-[340px] flex-none flex flex-col border-r border-divider bg-sidebar overflow-hidden">
          {/* ── 可滚动的选择区 ── */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
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

            {/* 2. 选择模特类型 */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/12 text-primary text-[11px] font-bold">
                  2
                </span>
                选择模特类型
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {MODEL_TYPES.map((mt) => (
                  <button
                    key={mt.id}
                    onClick={() => setSelectedModelType(mt.id)}
                    className={cn(
                      'px-2.5 py-2 rounded-xl text-[11px] font-medium text-center transition-all duration-150 border leading-tight',
                      selectedModelType === mt.id
                        ? 'border-primary/40 bg-primary/8 text-primary shadow-sm shadow-primary/10'
                        : 'border-divider/50 bg-muted/15 text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-divider'
                    )}
                  >
                    {mt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 选择拍摄场景 */}
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/12 text-primary text-[11px] font-bold">
                  3
                </span>
                选择拍摄场景
              </h3>

              <SceneSelector
                selectedScene={selectedScene}
                onSceneChange={handleSceneChange}
                customSceneActive={!!customScene.trim()}
              />
            </div>
          </div>

          {/* ── 固定吸底的操作区 ── */}
          <div className="flex-shrink-0 border-t border-divider bg-sidebar px-5 pt-3 pb-4 space-y-2.5">
            {/* 自定义场景输入 */}
            <div className="relative">
              <input
                type="text"
                value={customScene}
                onChange={(e) => handleCustomSceneChange(e.target.value)}
                placeholder="或输入自定义场景，例如：黄昏雨天..."
                className={cn(
                  'w-full h-9 px-3 rounded-xl text-xs border transition-all duration-200',
                  'placeholder:text-muted-foreground/40 text-foreground',
                  'focus:outline-none',
                  customScene.trim()
                    ? 'bg-primary/6 border-primary/35 focus:border-primary/50'
                    : 'bg-muted/20 border-divider/60 focus:border-primary/35 focus:bg-primary/4'
                )}
              />
              {customScene.trim() && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full pointer-events-none">
                  生效中
                </span>
              )}
            </div>

            {/* 未选择任何场景时的提示 */}
            {!hasScene && (
              <p className="text-[10px] text-amber-500/80 text-center flex items-center justify-center gap-1">
                <span>⚠</span> 请选择一个场景或输入自定义描述
              </p>
            )}

            {/* 一键上镜按钮 */}
            <Button
              size="lg"
              className={cn(
                'w-full h-11 text-sm font-semibold gap-2 transition-all duration-200',
                'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground',
                'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35',
                'disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed'
              )}
              disabled={!selectedFile || !hasScene}
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4" />
              一键上镜
              {!user && <span className="text-xs opacity-70 font-normal">（需注册）</span>}
            </Button>

            {!user ? (
              <p className="text-[11px] text-center text-muted-foreground">
                <Gift className="inline h-3 w-3 mr-1 text-primary/70" />
                注册送 {siteConfig.credits.initial} 积分 · 上身图 {siteConfig.credits.mainImageCost} 积分/多姿势图 {siteConfig.credits.multiPoseCost} 积分
              </p>
            ) : (
              profile && (
                <p className="text-[11px] text-center text-muted-foreground">
                  积分：
                  <span className="text-primary font-mono font-bold">{profile.credits}</span>
                  <span className="mx-1 opacity-40">·</span>
                  上身图 {siteConfig.credits.mainImageCost} 积分 · 多姿势图 {siteConfig.credits.multiPoseCost} 积分
                </p>
              )
            )}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">1</span>
                    </div>
                    上传图片
                  </div>
                  <div className="w-3 h-px bg-divider" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">2</span>
                    </div>
                    选择模特
                  </div>
                  <div className="w-3 h-px bg-divider" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">3</span>
                    </div>
                    选择场景
                  </div>
                  <div className="w-3 h-px bg-divider" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">4</span>
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
