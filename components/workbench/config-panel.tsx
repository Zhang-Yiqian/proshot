/**
 * 配置面板组件（场景选择）
 * 已隐藏模特类型选择，固定使用亚洲模特
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SCENE_PRESETS } from '@/config/presets'
import { cn } from '@/lib/utils'

interface ConfigPanelProps {
  selectedScene: string
  onSceneChange: (sceneId: string) => void
}

export function ConfigPanel({
  selectedScene,
  onSceneChange,
}: ConfigPanelProps) {
  return (
    <div className="space-y-6">
      {/* 场景类型选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择场景</CardTitle>
          <CardDescription>选择商品展示的背景场景</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {SCENE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSceneChange(preset.id)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-lg border-2 text-left transition-colors",
                  selectedScene === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <h4 className="font-semibold mb-1">{preset.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
