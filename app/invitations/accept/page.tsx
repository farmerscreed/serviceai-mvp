'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { refreshOrganizations } = useOrganization()

  const token = searchParams.get('token')

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [organizationName, setOrganizationName] = useState('')

  useEffect(() => {
    if (!authLoading && user && token) {
      acceptInvitation()
    }
  }, [user, token, authLoading])

  const acceptInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/organizations/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      setOrganizationName(data.organization?.name || 'the organization')
      
      // Refresh organizations list
      await refreshOrganizations()

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="text-gray-600 mb-4">
              {!user ? 'Please sign in to accept this invitation' : 'Loading...'}
            </div>
            {!user && (
              <a
                href={`/auth/signin?redirectTo=/invitations/accept?token=${token}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <div className="text-center">
          {processing ? (
            <>
              <div className="mb-4">
                <div className="mx-auto h-12 w-12 text-blue-600">
                  <svg
                    className="animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Invitation</h2>
              <p className="text-gray-600">Please wait...</p>
            </>
          ) : success ? (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-600"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600 mb-4">
                You've successfully joined {organizationName}.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </>
          ) : error ? (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </a>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

