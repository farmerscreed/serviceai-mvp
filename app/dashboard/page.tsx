'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useRouter } from 'next/navigation'
import SetupProgress from '@/components/dashboard/SetupProgress'
import QuickStats from '@/components/dashboard/QuickStats'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import QuickActions from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentOrganization, organizations, loading: orgLoading } = useOrganization()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Only redirect to onboarding if we've finished loading AND confirmed no organizations
    if (!orgLoading && !authLoading && organizations.length === 0 && user) {
      const timer = setTimeout(() => {
        console.log('No organizations found, redirecting to onboarding...')
        router.push('/onboarding')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [organizations, orgLoading, authLoading, user, router])

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Here's what's happening with{' '}
          <span className="font-semibold text-gray-900">{currentOrganization.organization_name}</span>
        </p>
      </div>

      {/* Setup Progress (conditional - only shows if not 100% complete) */}
      <SetupProgress organizationId={currentOrganization.organization_id} />

      {/* Quick Stats */}
      <QuickStats organizationId={currentOrganization.organization_id} />

      {/* Grid: Activity Feed + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Activity Feed - Takes 2 columns on desktop */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <ActivityFeed organizationId={currentOrganization.organization_id} limit={10} />
        </div>

        {/* Quick Actions - Takes 1 column, shows first on mobile */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
