'use client'

import { SCENE_PRESETS } from '@/config/presets'
import { cn } from '@/lib/utils'

interface ConfigPanelProps {
  selectedScene: string
  onSceneChange: (sceneId: string) => void
}

export function ConfigPanel({ selectedScene, onSceneChange }: ConfigPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">选择场景</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {SCENE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSceneChange(preset.id)}
            className={cn(
              "flex flex-col items-center p-3 rounded-xl border transition-all",
              selectedScene === preset.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
            )}
          >
            <span className="text-xl mb-1">{preset.icon}</span>
            <span className="text-xs font-medium">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
