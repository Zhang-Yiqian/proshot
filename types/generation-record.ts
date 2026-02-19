export type GenerationMode = 'clothing' | 'product'

export interface GenerationRecord {
  id: string
  timestamp: Date
  mode: GenerationMode
  sceneId: string
  sceneName: string
  sceneIcon: string
  referenceImageUrl: string
  referenceFileName: string
  mainImage: string | null
  generating: boolean
  multiPoseImages: string[]
  generatingMultiPose: boolean
}
