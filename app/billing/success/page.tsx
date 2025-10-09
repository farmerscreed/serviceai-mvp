'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/lib/organizations/organization-context'
import Link from 'next/link'

export default function BillingSuccessPage() {
  const router = useRouter()
  const { refreshOrganizations } = useOrganization()

  useEffect(() => {
    // Refresh organizations to get updated billing info
    refreshOrganizations()

    // Redirect to dashboard after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timeout)
  }, [refreshOrganizations, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Activated!
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for subscribing to ServiceAI. Your 14-day free trial has started.
          You won't be charged until the trial ends.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/billing"
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            View Billing
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Redirecting to dashboard in 5 seconds...
        </p>
      </div>
    </div>
  )
}

