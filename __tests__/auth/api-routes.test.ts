/**
 * Auth API 路由测试用例
 *
 * 覆盖范围：
 * - 密码验证逻辑（validatePassword）
 * - 注册页面密码规则边界值测试
 */

// 由于 Next.js API 路由依赖 Request/Response 对象，
// 此文件专注测试可独立提取的纯函数逻辑

// ── 密码验证纯函数（从注册页面提取的规则）────────────────────────────────

function validatePassword(pwd: string): string {
  if (pwd.length < 8) return '密码至少需要8个字符'
  if (!/[A-Za-z]/.test(pwd)) return '密码需包含至少一个字母'
  if (!/[0-9]/.test(pwd)) return '密码需包含至少一个数字'
  return ''
}

describe('密码验证规则 - validatePassword', () => {
  // ── 长度验证 ────────────────────────────────────────────────────────────

  describe('长度验证', () => {
    it('空字符串应返回长度不足错误', () => {
      expect(validatePassword('')).toBe('密码至少需要8个字符')
    })

    it('7个字符应返回长度不足错误', () => {
      expect(validatePassword('Abcd123')).toBe('密码至少需要8个字符')
    })

    it('恰好8个字符应通过长度验证', () => {
      expect(validatePassword('Abcde123')).toBe('')
    })

    it('超过8个字符应通过长度验证', () => {
      expect(validatePassword('VeryLongPassword123')).toBe('')
    })
  })

  // ── 字母要求 ────────────────────────────────────────────────────────────

  describe('字母要求', () => {
    it('纯数字密码应返回缺少字母错误', () => {
      expect(validatePassword('12345678')).toBe('密码需包含至少一个字母')
    })

    it('包含小写字母应通过字母验证', () => {
      expect(validatePassword('abcde123')).toBe('')
    })

    it('包含大写字母应通过字母验证', () => {
      expect(validatePassword('ABCDE123')).toBe('')
    })

    it('包含特殊字符但无字母应返回缺少字母错误', () => {
      expect(validatePassword('1234!@#$')).toBe('密码需包含至少一个字母')
    })
  })

  // ── 数字要求 ────────────────────────────────────────────────────────────

  describe('数字要求', () => {
    it('纯字母密码应返回缺少数字错误', () => {
      expect(validatePassword('abcdefgh')).toBe('密码需包含至少一个数字')
    })

    it('包含字母和特殊字符但无数字应返回缺少数字错误', () => {
      expect(validatePassword('abc!@#$%')).toBe('密码需包含至少一个数字')
    })
  })

  // ── 合法密码 ────────────────────────────────────────────────────────────

  describe('合法密码', () => {
    it('包含字母、数字且长度>=8的密码应通过所有验证', () => {
      const validPasswords = [
        'Password1',
        'securePass99',
        'a1b2c3d4',
        'ABC12345',
        'P@ssw0rd',
        '1234abcD!@#',
      ]
      validPasswords.forEach((pwd) => {
        expect(validatePassword(pwd)).toBe('')
      })
    })
  })

  // ── 验证优先级（短路原则）────────────────────────────────────────────────

  describe('验证优先级', () => {
    it('密码过短时应先报长度错误（优先于其他验证）', () => {
      expect(validatePassword('Ab1')).toBe('密码至少需要8个字符')
    })
  })
})

// ── OTP 验证码生成规则 ──────────────────────────────────────────────────────

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

describe('OTP 验证码生成规则', () => {
  it('生成的 OTP 应为6位数字字符串', () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOtp()
      expect(otp).toMatch(/^\d{6}$/)
    }
  })

  it('生成的 OTP 应在 100000~999999 范围内', () => {
    for (let i = 0; i < 100; i++) {
      const otp = parseInt(generateOtp(), 10)
      expect(otp).toBeGreaterThanOrEqual(100000)
      expect(otp).toBeLessThanOrEqual(999999)
    }
  })

  it('生成的 OTP 不应有前导零（始终6位）', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp()
      expect(otp.length).toBe(6)
    }
  })
})

// ── 手机号格式验证（SMS 相关）──────────────────────────────────────────────

function isValidChinesePhone(phone: string): boolean {
  return /^\+861[3-9]\d{9}$/.test(phone)
}

describe('中国手机号格式验证', () => {
  describe('合法手机号', () => {
    it('+86 开头的11位合法手机号应通过验证', () => {
      const validPhones = [
        '+8613800138000',
        '+8618611111111',
        '+8619999999999',
        '+8617011111111',
      ]
      validPhones.forEach((phone) => {
        expect(isValidChinesePhone(phone)).toBe(true)
      })
    })
  })

  describe('非法手机号', () => {
    it('不含+86前缀的手机号应失败', () => {
      expect(isValidChinesePhone('13800138000')).toBe(false)
    })

    it('第3位不是1[3-9]的应失败', () => {
      expect(isValidChinesePhone('+8612345678901')).toBe(false)
    })

    it('号码过短应失败', () => {
      expect(isValidChinesePhone('+861380013800')).toBe(false)
    })

    it('号码过长应失败', () => {
      expect(isValidChinesePhone('+86138001380001')).toBe(false)
    })

    it('空字符串应失败', () => {
      expect(isValidChinesePhone('')).toBe(false)
    })

    it('含字母的号码应失败', () => {
      expect(isValidChinesePhone('+8613800abc000')).toBe(false)
    })
  })
})

// ── phoneToEmail 转换函数 ──────────────────────────────────────────────────

function phoneToEmail(phone: string): string {
  return `${phone.replace('+', '')}@phone.proshot.internal`
}

describe('phoneToEmail 转换函数', () => {
  it('应将+86手机号转换为内部邮箱格式', () => {
    expect(phoneToEmail('+8613800138000')).toBe('8613800138000@phone.proshot.internal')
  })

  it('应去掉+号前缀', () => {
    const result = phoneToEmail('+8618611111111')
    expect(result).not.toContain('+')
  })

  it('应使用 phone.proshot.internal 域名', () => {
    const result = phoneToEmail('+8613800138000')
    expect(result).toMatch(/@phone\.proshot\.internal$/)
  })

  it('不同手机号应生成不同邮箱', () => {
    const email1 = phoneToEmail('+8613800138000')
    const email2 = phoneToEmail('+8618600000001')
    expect(email1).not.toBe(email2)
  })
})
