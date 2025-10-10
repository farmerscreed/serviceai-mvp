'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SubscriptionPlan } from '@/lib/billing/types'
import { SparkleNavbar } from '@/components/marketing/SparkleNavbar'
import { SparkleFooter } from '@/components/marketing/SparkleFooter'
import { CheckCircle, Star, Zap, Shield, Users, BarChart3 } from 'lucide-react'

export default function PricingPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const supabase = createBrowserClient()

  // Mock pricing plans for now
  const mockPlans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small businesses getting started with AI assistants',
      price_monthly: 29,
      price_yearly: 290,
      stripe_price_id_monthly: 'price_starter_monthly',
      stripe_price_id_yearly: 'price_starter_yearly',
      stripe_product_id: 'prod_starter',
      currency: 'usd',
      features: [
        'Up to 500 calls per month',
        'Basic AI assistant',
        'SMS notifications',
        'Email support',
        'Basic analytics'
      ],
      limits: {
        calls_per_month: 500,
        sms_per_month: 100,
        templates: 5,
        team_members: 3
      },
      is_popular: false,
      is_active: true,
      sort_order: 1
    },
    {
      id: 'professional',
      name: 'Professional',
      slug: 'professional',
      description: 'Ideal for growing businesses with higher call volumes',
      price_monthly: 79,
      price_yearly: 790,
      stripe_price_id_monthly: 'price_professional_monthly',
      stripe_price_id_yearly: 'price_professional_yearly',
      stripe_product_id: 'prod_professional',
      currency: 'usd',
      features: [
        'Up to 2,000 calls per month',
        'Advanced AI assistant',
        'Multi-language support',
        'Emergency detection',
        'Priority support',
        'Advanced analytics',
        'Calendar integration'
      ],
      limits: {
        calls_per_month: 2000,
        sms_per_month: 500,
        templates: 20,
        team_members: 10
      },
      is_popular: true,
      is_active: true,
      sort_order: 2
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For large organizations with complex requirements',
      price_monthly: 199,
      price_yearly: 1990,
      stripe_price_id_monthly: 'price_enterprise_monthly',
      stripe_price_id_yearly: 'price_enterprise_yearly',
      stripe_product_id: 'prod_enterprise',
      currency: 'usd',
      features: [
        'Unlimited calls',
        'Custom AI training',
        'Multi-language support',
        'Advanced emergency detection',
        'Dedicated support',
        'Custom integrations',
        'White-label options',
        'Advanced security'
      ],
      limits: {
        calls_per_month: -1,
        sms_per_month: -1,
        templates: -1,
        team_members: -1
      },
      is_popular: false,
      is_active: true,
      sort_order: 3
    }
  ]

  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockPlans)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      // Redirect to sign up
      router.push('/auth/signup')
      return
    }

    if (!currentOrganization) {
      // Redirect to create organization
      router.push('/organizations/create')
      return
    }

    setCheckingOut(plan.id)

    try {
      const priceId = billingInterval === 'monthly'
        ? plan.stripe_price_id_monthly
        : plan.stripe_price_id_yearly

      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization.organization_id,
          price_id: priceId,
          success_url: `${window.location.origin}/billing/success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.session_url) {
        window.location.href = data.session_url
      }
    } catch (error: any) {
      alert(error.message)
      setCheckingOut(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading plans...</div>
      </div>
    )
  }

  const savings = Math.round((1 - (plans[0]?.price_yearly || 0) / (plans[0]?.price_monthly || 1) / 12) * 100)

  return (
    <div className="min-h-screen sparkle-bg-pattern">
      {/* Navigation */}
      <SparkleNavbar />

      {/* Header */}
      <div className="sparkle-container py-16 sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
            Simple, Transparent
            <span className="block sparkle-text-gradient">Pricing</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gradient-to-r from-sparkle-500 to-purple-500"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === 'yearly' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Yearly
              {savings > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500 to-sparkle-500 text-white">
                  Save {savings}%
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative sparkle-card p-8 ${
                plan.is_popular ? 'ring-2 ring-sparkle-500 scale-105' : ''
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-sparkle-500 to-purple-500 text-white shadow-lg">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-8">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-extrabold sparkle-text-gradient">
                    ${billingInterval === 'monthly'
                      ? plan.price_monthly.toFixed(0)
                      : (plan.price_yearly / 12).toFixed(0)}
                  </span>
                  <span className="text-lg font-medium text-gray-500">/month</span>
                  {billingInterval === 'yearly' && (
                    <p className="mt-2 text-sm text-gray-500">
                      Billed ${plan.price_yearly.toFixed(0)} annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={checkingOut === plan.id}
                  className={`w-full py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    plan.is_popular
                      ? 'sparkle-button'
                      : 'sparkle-button-secondary'
                  } disabled:opacity-50`}
                >
                  {checkingOut === plan.id ? 'Processing...' : 'Start 14-Day Free Trial'}
                </button>

                <ul className="mt-8 space-y-4 text-left">
                  {(plan.features as string[]).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="flex-shrink-0 h-5 w-5 text-emerald-500 mt-0.5" />
                      <span className="ml-3 text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div className="sparkle-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-sparkle-500" />
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className="sparkle-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-sparkle-500" />
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade or downgrade your plan at any time. Changes are prorated.
              </p>
            </div>
            <div className="sparkle-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sparkle-500" />
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you reach 80% of your limit. You can upgrade your plan or purchase additional usage.
              </p>
            </div>
            <div className="sparkle-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-sparkle-500" />
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your service will continue until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <SparkleFooter />
    </div>
  )
}

