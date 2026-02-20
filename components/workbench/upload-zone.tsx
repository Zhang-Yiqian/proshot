'use client'

import { useState, useCallback } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  onClear: () => void
  previewUrl?: string
  className?: string
}

export function UploadZone({ onFileSelect, onClear, previewUrl, className }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  if (previewUrl) {
    return (
      <div className={cn("relative border border-black overflow-hidden bg-gray-50", className)}>
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-auto max-h-[400px] object-contain bg-black/20"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      className={cn(
        "upload-zone cursor-pointer",
        isDragging && "dragging",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className={cn(
          "flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-colors",
          isDragging ? "bg-primary/20" : "bg-muted"
        )}>
          {isDragging ? (
            <ImageIcon className="h-8 w-8 text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? '释放以上传' : '上传商品图片'}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 text-center">
          拖拽图片到这里，或点击选择文件
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-muted">JPG</span>
          <span className="px-2 py-0.5 rounded bg-muted">PNG</span>
          <span className="px-2 py-0.5 rounded bg-muted">WEBP</span>
        </div>
      </div>
      
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}
