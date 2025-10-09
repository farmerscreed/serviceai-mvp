'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BillingInfo {
  subscription_tier: string | null
  subscription_status: string
  trial_end: string | null
  current_period_end: string | null
  has_active_sub: boolean
}

interface UsageStats {
  event_type: string
  usage_count: number
  limit_count: number
  percentage: number
}

export default function BillingPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats[]>([])
  const [loading, setLoading] = useState(true)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      loadBillingData()
    }
  }, [currentOrganization])

  const loadBillingData = async () => {
    if (!currentOrganization) return

    try {
      // Load billing info
      const { data: billing, error: billingError } = await supabase
        .rpc('get_organization_billing_info', {
          p_organization_id: currentOrganization.organization_id,
        })
        .single()

      if (!billingError && billing) {
        setBillingInfo(billing as BillingInfo)
      }

      // Load usage stats
      const { data: usage } = await supabase
        .rpc('get_current_usage', {
          p_organization_id: currentOrganization.organization_id,
          p_event_type: null,
        })

      setUsageStats(usage || [])
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPortal = async () => {
    if (!currentOrganization) return

    setOpeningPortal(true)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization.organization_id,
          return_url: window.location.href,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open Customer Portal')
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      alert(error.message)
      setOpeningPortal(false)
    }
  }

  if (!user || !currentOrganization) {
    router.push('/dashboard')
    return null
  }

  const canManageBilling = ['owner', 'admin'].includes(currentOrganization.user_role)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading billing information...</div>
      </div>
    )
  }

  const trialDaysLeft = billingInfo?.trial_end
    ? Math.max(0, Math.ceil((new Date(billingInfo.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your subscription and monitor usage for {currentOrganization.organization_name}
          </p>
        </div>

        {/* Subscription Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Current Subscription</h2>
            {canManageBilling && billingInfo?.has_active_sub && (
              <button
                onClick={handleOpenPortal}
                disabled={openingPortal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {openingPortal ? 'Opening...' : 'Manage Subscription'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500">Plan</div>
              <div className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                {billingInfo?.subscription_tier || 'No Plan'}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    billingInfo?.subscription_status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : billingInfo?.subscription_status === 'trialing'
                      ? 'bg-blue-100 text-blue-800'
                      : billingInfo?.subscription_status === 'past_due'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {billingInfo?.subscription_status || 'inactive'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                {billingInfo?.subscription_status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {billingInfo?.subscription_status === 'trialing' && trialDaysLeft > 0
                  ? `${trialDaysLeft} days`
                  : billingInfo?.current_period_end
                  ? new Date(billingInfo.current_period_end).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>

          {!billingInfo?.has_active_sub && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                No active subscription. <Link href="/pricing" className="font-medium underline">Choose a plan</Link> to continue using ServiceAI.
              </p>
            </div>
          )}

          {billingInfo?.subscription_status === 'trialing' && trialDaysLeft <= 3 && trialDaysLeft > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                Your trial ends in {trialDaysLeft} days. Add a payment method to continue your service.
              </p>
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Current Usage</h2>

          {usageStats.length === 0 ? (
            <p className="text-sm text-gray-500">No usage data available yet.</p>
          ) : (
            <div className="space-y-6">
              {usageStats.map((stat) => (
                <div key={stat.event_type}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700 capitalize">
                        {stat.event_type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stat.usage_count} / {stat.limit_count === -1 ? '∞' : stat.limit_count}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {stat.limit_count === -1 ? '0' : stat.percentage.toFixed(0)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stat.percentage >= 95
                          ? 'bg-red-600'
                          : stat.percentage >= 80
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/pricing"
            className="block p-6 bg-white shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">View Plans</h3>
            <p className="text-sm text-gray-600">Compare plans and upgrade your subscription</p>
          </Link>

          {canManageBilling && (
            <button
              onClick={handleOpenPortal}
              disabled={openingPortal}
              className="block p-6 bg-white shadow rounded-lg hover:shadow-md transition-shadow text-left disabled:opacity-50"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Methods</h3>
              <p className="text-sm text-gray-600">Update your payment information</p>
            </button>
          )}

          <Link
            href="/dashboard"
            className="block p-6 bg-white shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Reports</h3>
            <p className="text-sm text-gray-600">View detailed usage analytics</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

