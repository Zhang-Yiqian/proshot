'use client'

import { Download, Sparkles, Loader2, Layers, Clock, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationRecord } from '@/types/generation-record'

const MULTI_POSE_SLOTS = 5

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return 'Just Now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
}: {
  src?: string
  label: string
  isLoading?: boolean
  isEmpty?: boolean
  slotNumber?: number
  isMain?: boolean
  onDownload?: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex-none w-[200px] h-[280px] overflow-hidden transition-all duration-300 bg-gray-50',
        src
          ? 'border border-black'
          : isEmpty
          ? 'border border-dashed border-gray-300 bg-gray-50'
          : 'border border-gray-100 bg-gray-50'
      )}
    >
      {src ? (
        <>
          <img src={src} alt={label} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
          
          {/* Download Button - Minimal */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="absolute bottom-3 right-3 p-2 bg-white border border-black text-black hover:bg-black hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          
          {/* Label - Editorial Tag */}
          <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-[10px] uppercase tracking-widest font-medium">
            {label}
          </div>
        </>
      ) : isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4 text-center">
           <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
           <span className="text-xs font-serif italic text-gray-500">Creating Masterpiece...</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
          <span className="text-4xl font-serif text-gray-300">{slotNumber}</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-400">Empty Slot</span>
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

  const handleDownload = (url: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `proshot-${record.id}.jpg`
    a.click()
  }

  return (
    <div className="border border-black p-0 mb-8 bg-white group hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow duration-300">
      {/* ===== Header / Metadata ===== */}
      <div className="flex items-stretch border-b border-black">
        {/* Reference Image - Small Square */}
        <div className="w-24 h-24 flex-none border-r border-black relative bg-gray-100">
          {record.referenceImageUrl ? (
             <>
              <img
                src={record.referenceImageUrl}
                alt="Reference"
                className="w-full h-full object-cover mix-blend-multiply opacity-80"
              />
              <div className="absolute bottom-0 left-0 bg-white border-t border-r border-black px-1 text-[9px] font-bold uppercase">REF</div>
             </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 p-4 flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <div>
               <h3 className="font-serif text-xl font-bold italic flex items-center gap-2">
                 {record.sceneName}
                 <span className="not-italic text-xs font-sans font-normal border border-black px-1.5 py-0.5 uppercase tracking-wider">
                   {record.mode === 'clothing' ? 'Apparel' : 'Product'}
                 </span>
               </h3>
               <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 uppercase tracking-widest">
                 <span>{formatRelativeTime(record.timestamp)}</span>
                 <span>—</span>
                 <span>ID: {record.id.slice(-6)}</span>
               </div>
             </div>
             
             {/* Status Badge */}
             {record.generating && (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest animate-pulse">
                  <span className="w-2 h-2 bg-black rounded-full" />
                  Generating
                </div>
             )}
           </div>
        </div>
      </div>

      {/* ===== Image Strip ===== */}
      <div className="p-6 bg-white overflow-x-auto">
        <div className="flex gap-4">
          {/* Main Image */}
          <ImageCard
            src={record.mainImage ?? undefined}
            label="Editorial Main"
            isMain
            isLoading={record.generating && !record.mainImage}
            onDownload={record.mainImage ? () => handleDownload(record.mainImage!) : undefined}
          />

          {/* Generate More Button - Vertical Strip */}
          {canGeneratePoses && (
            <button
              onClick={onGenerateMultiPose}
              className="flex-none w-12 h-[280px] border border-black bg-black text-white hover:bg-white hover:text-black transition-all duration-300 flex flex-col items-center justify-center gap-4 group/btn"
              title="Generate Collection"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] [writing-mode:vertical-rl] rotate-180">
                Generate Collection
              </span>
            </button>
          )}

          {/* Pose Slots */}
          {Array.from({ length: MULTI_POSE_SLOTS }).map((_, i) => {
            const poseImage = record.multiPoseImages[i]
            return (
              <ImageCard
                key={i}
                src={poseImage}
                label={`Look ${i + 1}`}
                isLoading={record.generatingMultiPose && !poseImage}
                isEmpty={!record.generatingMultiPose && !poseImage && !canGeneratePoses}
                slotNumber={i + 1}
                onDownload={poseImage ? () => handleDownload(poseImage) : undefined}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}