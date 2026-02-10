/**
 * Dify 工作流测试脚本
 * 用于快速验证 Dify 配置是否正确
 * 
 * 使用方法:
 * 1. 确保 .env.local 中配置了 DIFY_API_KEY 和 DIFY_WORKFLOW_ID
 * 2. 运行: npx tsx scripts/test-dify.ts
 */

import { runDifyWorkflow, buildScenePrompt } from '../lib/ai/dify-client'

async function testDifyWorkflow() {
  console.log('🚀 开始测试 Dify 工作流...\n')

  // 测试图片 URL (使用一个公开的测试图片)
  const testImageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'
  
  // 测试场景
  const testSceneId = 'street'
  const scenePrompt = buildScenePrompt(testSceneId)

  console.log('📋 测试参数:')
  console.log(`  - 图片URL: ${testImageUrl}`)
  console.log(`  - 场景ID: ${testSceneId}`)
  console.log(`  - 场景描述: ${scenePrompt}\n`)

  console.log('⏳ 调用 Dify 工作流中...')
  console.log('   (这可能需要 30-60 秒，请耐心等待)\n')

  const startTime = Date.now()

  try {
    const result = await runDifyWorkflow({
      originalImageUrl: testImageUrl,
      scene: scenePrompt,
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    if (result.success) {
      console.log('✅ 测试成功!')
      console.log(`   - 耗时: ${duration} 秒`)
      console.log(`   - 生成图片URL: ${result.imageUrl}`)
      if (result.taskId) {
        console.log(`   - 任务ID: ${result.taskId}`)
      }
      console.log('\n🎉 Dify 工作流配置正确!\n')
    } else {
      console.log('❌ 测试失败!')
      console.log(`   - 错误信息: ${result.error}`)
      console.log('\n请检查:')
      console.log('  1. DIFY_API_KEY 是否正确')
      console.log('  2. DIFY_WORKFLOW_ID 是否正确')
      console.log('  3. Dify 工作流是否已发布')
      console.log('  4. Dify 工作流的输入/输出配置是否正确\n')
    }
  } catch (error) {
    console.log('❌ 测试异常!')
    console.log(`   - 错误: ${error instanceof Error ? error.message : String(error)}\n`)
  }
}

// 运行测试
testDifyWorkflow()
