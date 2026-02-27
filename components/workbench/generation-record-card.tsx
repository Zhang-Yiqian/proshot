'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Download, Sparkles, Loader2, Layers, Clock, ImageIcon, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationRecord } from '@/types/generation-record'

const MULTI_POSE_SLOTS = 5

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return `${Math.floor(diff / 86400000)} 天前`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

interface GenerationRecordCardProps {
  record: GenerationRecord
  onGenerateMultiPose: () => void
}

function ImageCard({
  src,
  label,
  isLoading,
  isEmpty,
  slotNumber,
  isMain,
  onDownload,
  onPreview,
}: {
  src?: string
  label: string
  isLoading?: boolean
  isEmpty?: boolean
  slotNumber?: number
  isMain?: boolean
  onDownload?: () => void
  onPreview?: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex-none w-[165px] h-[220px] rounded-2xl overflow-hidden transition-all duration-300',
        src
          ? 'border border-black/6 shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]'
          : isEmpty
          ? 'border-2 border-dashed border-divider/30 bg-muted/10'
          : 'border border-divider/40 bg-muted/20'
      )}
    >
      {src ? (
        <>
          <img
            src={src}
            alt={label}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={onPreview}
          />
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {onPreview && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreview() }}
                className="absolute top-3 left-3 p-1.5 rounded-lg glass-thin text-white hover:scale-105 transition-transform pointer-events-auto"
                title="查看大图"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownload() }}
                className="absolute bottom-3 right-3 p-2 rounded-xl glass-thin text-white hover:scale-105 transition-transform pointer-events-auto"
                title="下载图片"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* 标签 */}
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
            <span
              className={cn(
                'px-2 py-0.5 rounded-lg text-[11px] font-semibold text-white',
                isMain
                  ? 'bg-gradient-to-r from-primary/90 to-secondary/80 shadow-sm'
                  : 'bg-black/60 backdrop-blur-sm'
              )}
            >
              {label}
            </span>
          </div>
        </>
      ) : isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-3.5 w-3.5 text-primary/60" />
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
          <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-[11px] text-muted-foreground">姿势 {slotNumber}</span>
        </div>
      )}
    </div>
  )
}

export function GenerationRecordCard({ record, onGenerateMultiPose }: GenerationRecordCardProps) {
  const totalImages = (record.mainImage ? 1 : 0) + record.multiPoseImages.length
  const hasPoses = record.multiPoseImages.length > 0 || record.generatingMultiPose
  const canGeneratePoses =
    record.mainImage && !record.generatingMultiPose && record.multiPoseImages.length === 0

  // 浮层预览状态：存储所有可预览图片列表和当前索引
  const allPreviewImages: { src: string; label: string }[] = [
    ...(record.mainImage ? [{ src: record.mainImage, label: '上身图' }] : []),
    ...record.multiPoseImages.map((src, i) => ({ src, label: `姿势 ${i + 1}` })),
  ]
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const handleOpenPreview = useCallback((index: number) => {
    setPreviewIndex(index)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewIndex(null)
  }, [])

  const handlePrev = useCallback(() => {
    setPreviewIndex((i) => (i !== null ? (i - 1 + allPreviewImages.length) % allPreviewImages.length : null))
  }, [allPreviewImages.length])

  const handleNext = useCallback(() => {
    setPreviewIndex((i) => (i !== null ? (i + 1) % allPreviewImages.length : null))
  }, [allPreviewImages.length])

  // 键盘导航
  useEffect(() => {
    if (previewIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClosePreview()
      else if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewIndex, handleClosePreview, handlePrev, handleNext])

  const handleDownload = (url: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `proshot-${record.id}.jpg`
    a.click()
  }

  return (
    <div className="glass-deep rounded-3xl p-5 space-y-4 group">
      {/* ===== 顶部信息行 ===== */}
      <div className="flex items-start gap-3">
        {/* 参考图缩略图 */}
        <div className="flex-none w-12 h-12 rounded-xl overflow-hidden border border-white/60 shadow-sm bg-muted/20">
          {record.referenceImageUrl ? (
            <img
              src={record.referenceImageUrl}
              alt="参考图"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* 场景与信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base leading-none">{record.sceneIcon}</span>
            <span className="text-sm font-semibold text-foreground">{record.sceneName}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
              {record.mode === 'clothing' ? '服装上身' : '物品场景'}
            </span>
            {totalImages > 0 && !record.generating && (
              <span className="px-1.5 py-0.5 rounded-md bg-muted/40 text-muted-foreground text-[11px]">
                <Layers className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                {hasPoses ? `${totalImages}/6 张` : '1 张上身图'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="h-3 w-3 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground/60">
              {formatRelativeTime(record.timestamp)} · {formatTime(record.timestamp)}
            </span>
            {record.referenceFileName && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground/50 truncate max-w-[120px]">
                  {record.referenceFileName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 右侧状态 */}
        {record.generating && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-medium">AI 创作中</span>
          </div>
        )}
        {record.generatingMultiPose && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-medium">生成多姿势图中</span>
          </div>
        )}
      </div>

      {/* ===== 图片横向滚动区 ===== */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pt-1 px-1 -mx-1">
          {/* 上身图 */}
          <ImageCard
            src={record.mainImage ?? undefined}
            label="上身图"
            isMain
            isLoading={record.generating && !record.mainImage}
            onDownload={record.mainImage ? () => handleDownload(record.mainImage!) : undefined}
            onPreview={record.mainImage ? () => handleOpenPreview(0) : undefined}
          />

          {/* 生成多姿势图触发按钮（上身图与第一个姿势位之间） */}
          {canGeneratePoses && (
            <div className="flex-none flex items-center">
              <button
                onClick={onGenerateMultiPose}
                className="btn-generate-suite flex flex-col items-center justify-center gap-1.5 w-11 h-[220px] rounded-2xl text-white"
                title="生成多姿势图"
              >
                <Sparkles className="h-4 w-4" />
                <div className="flex flex-col items-center gap-0.5">
                  {['多', '姿', '势', '图'].map((char, i) => (
                    <span key={i} className="text-[11px] font-semibold leading-tight">
                      {char}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          )}

          {/* 多姿势图卡片 */}
          {Array.from({ length: MULTI_POSE_SLOTS }).map((_, i) => {
            const poseImage = record.multiPoseImages[i]
            // 在预览列表中，多姿势图从索引 1 开始（主图占 0）
            const previewIdx = record.mainImage ? i + 1 : i
            return (
              <ImageCard
                key={i}
                src={poseImage}
                label={`姿势 ${i + 1}`}
                isLoading={record.generatingMultiPose && !poseImage}
                isEmpty={!record.generatingMultiPose && !poseImage && !canGeneratePoses}
                slotNumber={i + 1}
                onDownload={poseImage ? () => handleDownload(poseImage) : undefined}
                onPreview={poseImage ? () => handleOpenPreview(previewIdx) : undefined}
              />
            )
          })}
        </div>

        {/* 右侧渐变遮罩（指示可横滑） */}
        <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-white/60 to-transparent pointer-events-none rounded-r-2xl" />
      </div>

      {/* ===== 大图预览浮层（Portal 挂载到 body，避免 backdrop-filter 破坏 fixed 定位）===== */}
      {previewIndex !== null && allPreviewImages[previewIndex] && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          onClick={handleClosePreview}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          {/* 内容区 */}
          <div
            className="relative z-10 flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-white/70 text-sm font-medium">
                {allPreviewImages[previewIndex].label}
                {allPreviewImages.length > 1 && (
                  <span className="ml-2 text-white/40 text-xs">
                    {previewIndex + 1} / {allPreviewImages.length}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(allPreviewImages[previewIndex!].src)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="下载图片"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClosePreview}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 图片主体 + 左右箭头 */}
            <div className="relative flex items-center gap-3">
              {allPreviewImages.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="flex-none p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={allPreviewImages[previewIndex].src}
                  alt={allPreviewImages[previewIndex].label}
                  className="max-w-[75vw] max-h-[75vh] object-contain"
                  style={{ display: 'block' }}
                />
              </div>

              {allPreviewImages.length > 1 && (
                <button
                  onClick={handleNext}
                  className="flex-none p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* 缩略图导航条（多图时显示） */}
            {allPreviewImages.length > 1 && (
              <div className="flex gap-2 px-2">
                {allPreviewImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewIndex(idx)}
                    className={cn(
                      'w-12 h-16 rounded-lg overflow-hidden border-2 transition-all duration-150 flex-none',
                      idx === previewIndex
                        ? 'border-white/80 scale-105 shadow-lg'
                        : 'border-white/20 opacity-60 hover:opacity-90 hover:border-white/40'
                    )}
                  >
                    <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
