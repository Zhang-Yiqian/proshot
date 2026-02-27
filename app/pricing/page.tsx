'use client'

import { Check, Sparkles, ArrowLeft, Zap, Crown, Building, MessageCircle, Copy, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useState } from 'react'


const PRICING_PLANS = [
  {
    name: '基础包',
    icon: Zap,
    credits: 50,
    price: 49,
    pricePerCredit: '0.98',
    features: ['50 积分', '下载 50 张高清图', '有效期 3 个月', '标准生成速度'],
    popular: false,
  },
  {
    name: '专业包',
    icon: Crown,
    credits: 200,
    price: 159,
    pricePerCredit: '0.80',
    features: ['200 积分', '下载 200 张高清图', '有效期 6 个月', '优先生成速度', '邮件支持'],
    popular: true,
  },
  {
    name: '企业包',
    icon: Building,
    credits: 500,
    price: 349,
    pricePerCredit: '0.70',
    features: ['500 积分', '下载 500 张高清图', '有效期 12 个月', '最高优先级', '专属客服', 'API 接入'],
    popular: false,
  },
]

export default function PricingPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleCopyContact = async (id: string) => {
    setLoadingId(id)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/contact')
      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? '获取联系方式失败，请稍后重试')
        return
      }
      await navigator.clipboard.writeText(data.wechat)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      setErrorMsg('网络错误，请稍后重试')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="container py-12">
          {/* 返回链接 */}
          <Link 
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          {/* 标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              选择适合您的<span className="text-gradient">套餐</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              灵活的积分套餐，用多少买多少，无隐藏费用
            </p>
          </div>

          {/* 错误提示 */}
          {errorMsg && (
            <div className="max-w-5xl mx-auto mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {errorMsg}
            </div>
          )}

          {/* 价格卡片 */}
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "glass-card p-6 relative",
                  plan.popular && "border-primary/50 md:scale-105"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-xs font-semibold text-white">
                    最受欢迎
                  </div>
                )}

                {/* 图标和名称 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    plan.popular ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                </div>

                {/* 价格 */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono">¥{plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    约 ¥{plan.pricePerCredit}/张
                  </p>
                </div>

                {/* 功能列表 */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* 购买按钮 */}
                <Button
                  className={cn(
                    "w-full gap-2",
                    plan.popular && "btn-glow"
                  )}
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={loadingId === plan.name}
                  onClick={() => handleCopyContact(plan.name)}
                >
                  {copiedId === plan.name ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      微信号已复制，联系站长付款
                    </>
                  ) : loadingId === plan.name ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      获取中…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      复制微信号，联系站长付款
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* 企业定制 */}
          <div className="mt-16 text-center">
            <div className="glass-card p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-2">需要更多积分或定制方案？</h3>
              <p className="text-muted-foreground mb-6">
                点击下方按钮复制微信号，联系站长定制企业专属方案，享受更优惠的价格
              </p>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                disabled={loadingId === 'enterprise'}
                onClick={() => handleCopyContact('enterprise')}
              >
                {copiedId === 'enterprise' ? (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    微信号已复制，联系站长付款
                  </>
                ) : loadingId === 'enterprise' ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    获取中…
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    复制微信号，联系站长
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
