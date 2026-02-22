'use client'

import { SceneSelector } from './scene-selector'

interface ConfigPanelProps {
  selectedScene: string | null
  onSceneChange: (sceneId: string | null) => void
}

export function ConfigPanel({ selectedScene, onSceneChange }: ConfigPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">选择场景</h3>
      <SceneSelector selectedScene={selectedScene} onSceneChange={onSceneChange} />
    </div>
  )
}
