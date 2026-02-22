'use client'

import { useState } from 'react'
import { SCENE_CATEGORIES } from '@/config/presets'
import { cn } from '@/lib/utils'

interface SceneSelectorProps {
  /** null 表示未选中任何场景 */
  selectedScene: string | null
  onSceneChange: (sceneId: string | null) => void
  /** 自定义场景已启用时，以弱化样式提示预设失效 */
  customSceneActive?: boolean
}

export function SceneSelector({
  selectedScene,
  onSceneChange,
  customSceneActive = false,
}: SceneSelectorProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    if (selectedScene) {
      const found = SCENE_CATEGORIES.find((cat) =>
        cat.scenes.some((s) => s.id === selectedScene)
      )
      if (found) return found.id
    }
    return SCENE_CATEGORIES[0].id
  })

  const activeCategory =
    SCENE_CATEGORIES.find((c) => c.id === activeCategoryId) ?? SCENE_CATEGORIES[0]

  const handleSceneClick = (sceneId: string) => {
    if (selectedScene === sceneId) {
      // 再次点击已选中项 → 取消选择
      onSceneChange(null)
    } else {
      onSceneChange(sceneId)
    }
  }

  return (
    <div className="space-y-2.5">
      {/* 一级分类 Tabs - 横向可滚动胶囊按钮 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-0.5 px-0.5">
        {SCENE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={cn(
              'flex-none px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 whitespace-nowrap border',
              activeCategoryId === cat.id
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                : 'bg-muted/60 text-foreground/65 border-muted hover:bg-muted/80 hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 二级场景 Grid - 2 列，隐藏滚动条 */}
      <div
        className={cn(
          'grid grid-cols-2 gap-1.5 max-h-[252px] overflow-y-auto scrollbar-hide transition-opacity duration-200',
          customSceneActive && 'opacity-40 pointer-events-none'
        )}
      >
        {activeCategory.scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => handleSceneClick(scene.id)}
            className={cn(
              'px-2.5 py-2 rounded-xl text-[11px] font-medium text-center transition-all duration-150 border leading-tight',
              selectedScene === scene.id
                ? 'border-primary/40 bg-primary/8 text-primary shadow-sm shadow-primary/10'
                : 'border-divider/50 bg-muted/15 text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-divider'
            )}
          >
            {scene.name}
          </button>
        ))}
      </div>

      {/* 自定义场景生效提示 */}
      {customSceneActive && (
        <p className="text-[10px] text-primary/70 flex items-center gap-1 mt-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" />
          已启用自定义场景，预设暂时失效
        </p>
      )}
    </div>
  )
}
