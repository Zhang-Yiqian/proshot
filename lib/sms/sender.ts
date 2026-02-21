import crypto from 'crypto'

/**
 * 阿里云短信服务签名算法
 * 参考文档：https://help.aliyun.com/document_detail/101414.html
 */
function aliyunSign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(sorted)}`
  return crypto
    .createHmac('sha1', `${secret}&`)
    .update(stringToSign)
    .digest('base64')
}

/**
 * 通过阿里云短信服务发送验证码
 * 需要配置以下环境变量：
 *   ALIYUN_SMS_ACCESS_KEY_ID      - 阿里云 AccessKey ID
 *   ALIYUN_SMS_ACCESS_KEY_SECRET  - 阿里云 AccessKey Secret
 *   ALIYUN_SMS_SIGN_NAME          - 短信签名（需在阿里云控制台申请）
 *   ALIYUN_SMS_TEMPLATE_CODE      - 短信模板 Code（需在阿里云控制台申请）
 *                                   模板示例：您的验证码为 ${code}，5分钟内有效，请勿泄露。
 */
async function sendAliyunSms(phone: string, otp: string): Promise<void> {
  const accessKeyId = process.env.ALIYUN_SMS_ACCESS_KEY_ID!
  const accessKeySecret = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET!
  const signName = process.env.ALIYUN_SMS_SIGN_NAME!
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE!

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: 'cn-hangzhou',
    SignName: signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID().replace(/-/g, ''),
    SignatureVersion: '1.0',
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code: otp }),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2017-05-25',
  }

  params.Signature = aliyunSign(params, accessKeySecret)

  const url = `https://dysmsapi.aliyuncs.com/?${Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')}`

  const resp = await fetch(url)
  const json = await resp.json()

  if (json.Code !== 'OK') {
    throw new Error(`阿里云短信发送失败: ${json.Code} - ${json.Message}`)
  }
}

/**
 * 发送短信验证码
 * - 开发环境（未配置阿里云凭证）：打印到控制台，不实际发送
 * - 生产环境：通过阿里云短信服务发送
 *
 * @returns 开发模式下返回验证码（方便测试），生产模式返回 null
 */
export async function sendOtpSms(phone: string, otp: string): Promise<string | null> {
  const hasAliyunConfig =
    process.env.ALIYUN_SMS_ACCESS_KEY_ID &&
    process.env.ALIYUN_SMS_ACCESS_KEY_SECRET &&
    process.env.ALIYUN_SMS_SIGN_NAME &&
    process.env.ALIYUN_SMS_TEMPLATE_CODE

  if (hasAliyunConfig) {
    await sendAliyunSms(phone, otp)
    console.log(`[SMS] 验证码已通过阿里云短信发送至 ${phone}`)
    return null
  }

  // 开发模式：打印验证码到控制台
  console.log(`\n${'='.repeat(50)}`)
  console.log(`[SMS 开发模式] 手机号: ${phone}`)
  console.log(`[SMS 开发模式] 验证码: ${otp}`)
  console.log(`[SMS 开发模式] 5分钟内有效`)
  console.log(`${'='.repeat(50)}\n`)

  // 开发模式下将 OTP 返回给调用方，API 会将其放在响应里，方便测试
  return otp
}
