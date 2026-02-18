/**
 * Supabase Storage 测试脚本
 * 用于验证 Storage Buckets 是否正确配置
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local 环境变量
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// 优先使用 service_role key（绕过 RLS），测试时无需登录
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：缺少 Supabase 配置')
  console.error('请确保 .env.local 文件中配置了：')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testBucketAccess(bucketName: string): Promise<boolean> {
  // 直接尝试列出 bucket 内的文件，判断 bucket 是否存在（比 listBuckets 更可靠）
  const { error } = await supabase.storage.from(bucketName).list('', { limit: 1 })
  
  if (error) {
    // "The resource was not found" 说明 bucket 不存在
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return false
    }
    // 其他错误（如 policy 错误）说明 bucket 存在但有权限问题
    console.log(`   ⚠️  ${bucketName}: 存在但有问题 - ${error.message}`)
    return true
  }
  
  return true
}

async function testStorage() {
  console.log('🧪 开始测试 Supabase Storage...\n')
  console.log(`📡 连接到: ${supabaseUrl}`)
  console.log(`🔑 使用密钥类型: ${isServiceRole ? 'service_role（管理员）' : 'anon（匿名）'}\n`)

  // 测试 1: 检查 bucket 是否存在（直接访问，不依赖 listBuckets 权限）
  console.log('=== 测试 1: 检查 Buckets 是否存在 ===')
  console.log('（注：anon key 无法列出所有 buckets，改用直接访问方式验证）\n')

  const requiredBuckets = ['originals', 'generated']
  const results: Record<string, boolean> = {}

  for (const bucketName of requiredBuckets) {
    const exists = await testBucketAccess(bucketName)
    results[bucketName] = exists
    console.log(`   ${exists ? '✅' : '❌'} ${bucketName}: ${exists ? '已创建' : '不存在'}`)
  }

  console.log()

  const missingBuckets = requiredBuckets.filter(name => !results[name])
  if (missingBuckets.length > 0) {
    console.error(`❌ 缺少必需的 buckets: ${missingBuckets.join(', ')}`)
    console.error('\n请执行 SQL 脚本: supabase/migrations/004_create_storage_buckets.sql\n')
    return
  }

  console.log('✅ 所有必需的 buckets 都已创建\n')

  // 测试 2: 测试 originals bucket 上传
  console.log('=== 测试 2: 测试 originals Bucket 上传 ===')

  const testContent = new Blob(['Hello ProShot Storage Test!'], { type: 'text/plain' })
  const testFileName = `test/${Date.now()}.txt`

  console.log(`📤 上传测试文件: ${testFileName}`)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('originals')
    .upload(testFileName, testContent)

  if (uploadError) {
    console.error('❌ 上传失败:', uploadError.message)
    if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
      console.error('\n⚠️  Policies 未配置，请在 Supabase Dashboard 中：')
      console.error('   Storage → originals → Policies → New Policy')
      console.error('   或重新执行 SQL 脚本中的 Policy 部分\n')
    }
    if (uploadError.message.includes('Unauthorized') || uploadError.message.includes('not authenticated')) {
      console.error('\n⚠️  需要登录用户才能上传，这是正常的（Policies 配置了认证用户才可上传）')
      console.error('   在浏览器中登录后，应用上传功能会正常工作\n')
    }
    return
  }

  console.log('✅ 上传成功:', uploadData.path)

  // 测试获取 Public URL
  const { data: urlData } = supabase.storage
    .from('originals')
    .getPublicUrl(testFileName)
  console.log('✅ Public URL:', urlData.publicUrl)

  // 清理测试文件
  await supabase.storage.from('originals').remove([testFileName])
  console.log('✅ 测试文件已清理\n')

  // 总结
  console.log('='.repeat(50))
  console.log('✅ 所有测试通过！Storage 配置正确！')
  console.log('='.repeat(50))
  console.log('\n现在可以正常使用 ProShot 上传和生成图片了 🎉\n')
}

// 运行测试
testStorage().catch(error => {
  console.error('\n❌ 测试过程中发生错误:')
  console.error(error)
  process.exit(1)
})
