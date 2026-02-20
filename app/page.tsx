'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, X, Gift, ImageIcon, Layers, Camera, ArrowRight } from 'lucide-react'
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
      return parsed.map((r) => ({
        ...r,
        timestamp: new Date(r.timestamp),
        generating: false,
        generatingMultiPose: false,
      }))
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem('proshot_records', JSON.stringify(records))
    } catch {}
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

    try {
      let publicUrl = ''

      if (MODEL_CONFIG.mockMode || MODEL_CONFIG.mockMainImageMode) {
        publicUrl = 'https://mock-url.com/original.jpg'
      } else {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${user?.id || 'guest'}/${Date.now()}.${fileExt}`
        const { data: sessionData } = await supabase.auth.getSession()

        const uploadPromise = supabase.storage
          .from('originals')
          .upload(fileName, selectedFile, { contentType: selectedFile.type })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('上传超时（30s），请检查网络连接')), 30000)
        )

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise])

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('originals').getPublicUrl(fileName)
        publicUrl = data.publicUrl
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

      if (result.success) {
        setRecords((prev) => {
          const updated = prev.map((r) =>
            r.id === recordId ? { ...r, mainImage: result.imageUrl, generating: false } : r
          )
          try {
            sessionStorage.setItem('proshot_records', JSON.stringify(updated))
          } catch {}
          return updated
        })
      } else {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r))
        )
        alert(result.error || '生成失败，请重试')
      }
    } catch (error) {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, generating: false } : r))
      )
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
      alert('生成多视角图失败，请稍后重试')
    }
  }

  const currentScene = SCENE_PRESETS.find((s) => s.id === selectedScene)

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans selection:bg-black selection:text-white">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* ========== Sidebar - Editorial Config ========== */}
        <aside className="w-[400px] flex-none h-full border-r border-black bg-white overflow-y-auto scrollbar-thin">
          <div className="p-8 space-y-10">
            {/* Title Section */}
            <div className="border-b-2 border-black pb-6">
              <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">
                The Studio
              </h1>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">
                AI Commercial Photography
              </p>
            </div>

            {/* 1. Upload */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 border border-black rounded-full text-[10px]">01</span>
                Upload Garment
              </h3>

              {previewUrl ? (
                <div className="relative group border border-black p-2">
                  <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <button
                    onClick={handleClear}
                    className="absolute top-4 right-4 p-2 bg-white border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-center border-t border-gray-200 pt-2 text-gray-500">
                    {selectedFile?.name}
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="aspect-[3/4] border border-dashed border-gray-300 hover:border-black transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 bg-gray-50 hover:bg-white group"
                >
                  <div className="w-16 h-16 border border-gray-300 group-hover:border-black rounded-full flex items-center justify-center transition-colors">
                    <ImageIcon className="h-6 w-6 text-gray-400 group-hover:text-black" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest">Click to Upload</p>
                    <p className="text-[10px] text-gray-400">JPG · PNG · WEBP</p>
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

            {/* 2. Scene Selector */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 border border-black rounded-full text-[10px]">02</span>
                Select Scene
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {SCENE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedScene(preset.id)}
                    className={cn(
                      'flex flex-col items-start p-4 border transition-all duration-300 text-left h-full',
                      selectedScene === preset.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-black text-gray-500 hover:text-black'
                    )}
                  >
                    <span className="text-xl mb-3">{preset.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider leading-tight">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              {currentScene && (
                <div className="p-4 bg-gray-50 border-l-2 border-black text-xs text-gray-600 leading-relaxed italic font-serif">
                  "{currentScene.description}"
                </div>
              )}
            </div>

            {/* 3. Action */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur pt-4 pb-8 border-t border-black">
              <Button
                size="lg"
                className="w-full h-14 bg-black text-white hover:bg-white hover:text-black border border-black rounded-none uppercase tracking-[0.2em] font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 group"
                disabled={!selectedFile}
                onClick={handleGenerate}
              >
                <Sparkles className="h-4 w-4 group-hover:animate-spin-slow" />
                Start Shooting
              </Button>

              {!user && (
                <p className="mt-3 text-[10px] text-center text-gray-400 uppercase tracking-widest">
                  New members receive {siteConfig.credits.initial} credits
                </p>
              )}
              {user && profile && (
                 <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-gray-400 px-1">
                   <span>Balance: {profile.credits} Credits</span>
                   <span>1 Credit / Image</span>
                 </div>
              )}
            </div>
          </div>
        </aside>

        {/* ========== Feed - Editorial Spread ========== */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#FAFAFA]">
          {records.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-12">
              <div className="max-w-md text-center space-y-8 border border-black p-12 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]">
                <div className="w-20 h-20 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-black" />
                </div>
                <h2 className="text-3xl font-serif font-bold italic">
                  "Fashion is not something that exists in dresses only."
                </h2>
                <div className="space-y-4">
                  <p className="text-sm font-sans text-gray-500 uppercase tracking-widest">
                    Start your collection
                  </p>
                  <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex flex-col items-center gap-2">
                       <span className="w-6 h-6 border border-black flex items-center justify-center rounded-full">1</span>
                       Upload
                    </div>
                    <div className="w-8 h-px bg-black my-auto"></div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="w-6 h-6 border border-black flex items-center justify-center rounded-full">2</span>
                       Scene
                    </div>
                     <div className="w-8 h-px bg-black my-auto"></div>
                    <div className="flex flex-col items-center gap-2">
                       <span className="w-6 h-6 border border-black flex items-center justify-center rounded-full">3</span>
                       Create
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Feed */
            <div className="p-12 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
                 <h2 className="text-2xl font-serif font-bold">Latest Collections</h2>
                 <span className="text-xs font-sans uppercase tracking-widest text-gray-500">{records.length} Sets</span>
              </div>
              
              <div className="space-y-12">
                {records.map((record) => (
                  <GenerationRecordCard
                    key={record.id}
                    record={record}
                    onGenerateMultiPose={() => handleGenerateMultiPose(record.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </div>
  )
}