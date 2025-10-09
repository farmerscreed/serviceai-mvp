'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SubscriptionPlan } from '@/lib/billing/types'

export default function PricingPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error

      setPlans(data || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                ServiceAI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose the perfect plan for your business
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className={`text-sm ${billingInterval === 'monthly' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
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
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
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
              className={`relative bg-white rounded-lg shadow-lg ${
                plan.is_popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.is_popular && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>

                <div className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${billingInterval === 'monthly'
                      ? plan.price_monthly.toFixed(0)
                      : (plan.price_yearly / 12).toFixed(0)}
                  </span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                  {billingInterval === 'yearly' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Billed ${plan.price_yearly.toFixed(0)} annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={checkingOut === plan.id}
                  className={`mt-8 w-full py-3 px-6 rounded-md text-sm font-semibold ${
                    plan.is_popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  } disabled:opacity-50`}
                >
                  {checkingOut === plan.id ? 'Processing...' : 'Start 14-Day Free Trial'}
                </button>

                <ul className="mt-8 space-y-4">
                  {(plan.features as string[]).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="flex-shrink-0 h-6 w-6 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade or downgrade your plan at any time. Changes are prorated.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you reach 80% of your limit. You can upgrade your plan or purchase additional usage.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your service will continue until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

