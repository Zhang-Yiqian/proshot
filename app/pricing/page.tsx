'use client'

import { Check, Sparkles, ArrowLeft, Zap, Crown, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const PRICING_PLANS = [
  {
    name: 'Standard',
    icon: Zap,
    credits: 50,
    price: 49,
    pricePerCredit: '0.98',
    features: ['50 Credits', 'HD Downloads', '3 Months Validity', 'Standard Speed'],
    popular: false,
  },
  {
    name: 'Professional',
    icon: Crown,
    credits: 200,
    price: 159,
    pricePerCredit: '0.80',
    features: ['200 Credits', 'HD Downloads', '6 Months Validity', 'Priority Speed', 'Email Support'],
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Building,
    credits: 500,
    price: 349,
    pricePerCredit: '0.70',
    features: ['500 Credits', 'HD Downloads', '12 Months Validity', 'Highest Priority', 'Dedicated Support', 'API Access'],
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans selection:bg-black selection:text-white">
      <Header />
      
      <main className="flex-1 border-t border-black">
        <section className="container py-24 max-w-7xl mx-auto px-6">
          {/* Back Link */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-gray-500 mb-12 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Studio
          </Link>

          {/* Title */}
          <div className="text-center mb-20 border-b border-black pb-12">
            <h1 className="text-5xl md:text-6xl font-serif font-bold italic mb-6">
              The Collection
            </h1>
            <p className="text-sm font-sans uppercase tracking-widest text-gray-500 max-w-xl mx-auto">
              Select your plan. No hidden fees. Pure creation.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative border border-black p-8 transition-all duration-300 group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
                  plan.popular ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-white text-black px-4 py-1 text-[10px] font-bold uppercase tracking-widest border-l border-b border-black">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={cn(
                    "w-12 h-12 border flex items-center justify-center rounded-none",
                    plan.popular ? "border-white bg-white text-black" : "border-black bg-black text-white group-hover:bg-white group-hover:text-black"
                  )}>
                    <plan.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-serif italic">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-8 pb-8 border-b border-gray-800 group-hover:border-gray-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-serif">¥{plan.price}</span>
                  </div>
                  <p className={cn(
                    "text-xs mt-2 uppercase tracking-widest opacity-60",
                    plan.popular ? "text-gray-300" : "text-gray-500 group-hover:text-gray-300"
                  )}>
                    approx ¥{plan.pricePerCredit} / Image
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        plan.popular ? "text-white" : "text-black group-hover:text-white"
                      )} />
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action */}
                <Button 
                  className={cn(
                    "w-full h-12 rounded-none uppercase tracking-widest font-bold text-xs border border-white transition-all",
                    plan.popular 
                      ? "bg-white text-black hover:bg-gray-200" 
                      : "bg-black text-white hover:bg-white hover:text-black border-black group-hover:border-white"
                  )} 
                >
                  Purchase Now
                </Button>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="mt-24 text-center border-t border-black pt-12">
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-2xl font-serif italic">Need a Custom Fit?</h3>
              <p className="text-gray-500 text-sm uppercase tracking-widest">
                Contact us for enterprise solutions and bulk credits.
              </p>
              <Button size="lg" className="bg-white text-black border border-black hover:bg-black hover:text-white rounded-none uppercase tracking-widest text-xs px-8 h-12">
                Contact Sales
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      {/* Minimal Footer */}
      <footer className="border-t border-black py-12 text-center text-xs uppercase tracking-widest text-gray-500">
        <p>&copy; {new Date().getFullYear()} ProShot Studio. All Rights Reserved.</p>
      </footer>
    </div>
  )
}