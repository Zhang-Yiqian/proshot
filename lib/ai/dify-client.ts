/**
 * Dify API 客户端
 * 用于调用 Dify 工作流实现服饰上身功能
 */

interface DifyWorkflowInput {
  originalImageUrl: string  // 商家上传的白底图
  scene: string             // 用户选择的场景
}

interface DifyWorkflowResult {
  success: boolean
  imageUrl?: string
  error?: string
  taskId?: string
}

export const DIFY_CONFIG = {
  apiBaseUrl: process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1',
  apiKey: process.env.DIFY_API_KEY || '',
  workflowId: process.env.DIFY_WORKFLOW_ID || '',
  
  // Mock 配置
  mockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true',
  mockImageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop",
}

/**
 * 调用 Dify 工作流生成服饰上身图
 */
export async function runDifyWorkflow(
  input: DifyWorkflowInput
): Promise<DifyWorkflowResult> {
  
  // Mock 模式处理
  if (DIFY_CONFIG.mockMode) {
    console.log('[Dify Client] Mock 模式已开启，返回固定图片')
    console.log('[Dify Client] 输入参数:', input)
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 3000))
    return {
      success: true,
      imageUrl: DIFY_CONFIG.mockImageUrl
    }
  }

  // 验证配置
  if (!DIFY_CONFIG.apiKey) {
    return { success: false, error: 'Dify API Key 未配置' }
  }

  if (!DIFY_CONFIG.workflowId) {
    return { success: false, error: 'Dify Workflow ID 未配置' }
  }

  try {
    console.log('[Dify Client] 开始调用工作流...')
    console.log('[Dify Client] 输入参数:', input)

    // 调用 Dify 工作流 API
    const response = await fetch(`${DIFY_CONFIG.apiBaseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        inputs: {
          image_url: input.originalImageUrl,
          scene: input.scene,
        },
        response_mode: 'blocking', // 使用阻塞模式，等待结果
        user: 'proshot-user',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Dify Client] API 请求失败:', errorData)
      throw new Error(errorData.message || `API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Dify Client] API 响应:', data)

    // 解析 Dify 响应
    // Dify 工作流的输出格式可能是:
    // {
    //   "workflow_run_id": "xxx",
    //   "task_id": "xxx",
    //   "data": {
    //     "outputs": {
    //       "image_url": "https://..."  // 生成的图片URL
    //     }
    //   }
    // }
    
    const imageUrl = data.data?.outputs?.image_url || 
                     data.data?.outputs?.output || 
                     data.outputs?.image_url

    if (imageUrl) {
      console.log('[Dify Client] 工作流执行成功，图片URL:', imageUrl)
      return {
        success: true,
        imageUrl,
        taskId: data.task_id || data.workflow_run_id,
      }
    }

    throw new Error('工作流响应中未找到图片URL')

  } catch (error) {
    console.error('[Dify Client] 工作流执行失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '工作流执行失败',
    }
  }
}

/**
 * 构建场景提示词
 * 将场景ID转换为适合传入 Dify 工作流的场景描述
 */
export function buildScenePrompt(sceneId: string): string {
  const sceneMap: Record<string, string> = {
    'white-bg': '纯白背景，极简风格，突出服装细节',
    'street': '都市街头场景，现代时尚风格，自然光线',
    'home': '温馨家居场景，舒适自然氛围，柔和光线',
    'cafe': '文艺咖啡馆场景，小资情调，温暖灯光',
    'office': '商务办公场景，专业职业风格，明亮光线',
    'outdoor': '户外自然场景，清新活力，自然阳光',
  }
  
  return sceneMap[sceneId] || sceneMap['white-bg']
}
