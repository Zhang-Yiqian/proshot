/**
 * 定价页面
 */

'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const PRICING_PLANS = [
  {
    name: '基础包',
    credits: 50,
    price: 49,
    features: ['50积分', '可下载50张高清图', '有效期3个月', '标准生成速度'],
  },
  {
    name: '专业包',
    credits: 200,
    price: 159,
    popular: true,
    features: ['200积分', '可下载200张高清图', '有效期6个月', '优先生成速度', '邮件支持'],
  },
  {
    name: '企业包',
    credits: 500,
    price: 349,
    features: ['500积分', '可下载500张高清图', '有效期12个月', '最高优先级', '专属客服', 'API接入'],
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="container py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">选择适合您的套餐</h1>
            <p className="text-xl text-muted-foreground">
              灵活的积分套餐，按需购买
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? 'border-primary shadow-lg scale-105' : ''}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold rounded-t-lg">
                    最受欢迎
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-4xl font-bold text-foreground">¥{plan.price}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    立即购买
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-4">需要更多积分？</h3>
            <p className="text-muted-foreground mb-6">
              联系我们定制企业专属方案
            </p>
            <Button variant="outline" size="lg">
              联系销售
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
