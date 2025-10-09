'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/lib/organizations/organization-context'
import { Zap, Check, Loader2, Phone, MessageSquare, Languages, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateAssistantPage() {
  const router = useRouter()
  const { currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [assistantData, setAssistantData] = useState<any>(null)

  const [formData, setFormData] = useState({
    businessName: currentOrganization?.organization_name || '',
    businessPhone: '',
    businessAddress: '',
    businessEmail: '',
    languagePreference: currentOrganization?.industry_code ? 'en' : 'en',
  })

  const handleCreate = async () => {
    if (!currentOrganization) {
      setError('No organization selected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vapi/assistants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.organization_id,
          industryCode: currentOrganization.industry_code,
          businessData: {
            business_name: formData.businessName,
            business_phone: formData.businessPhone,
            business_address: formData.businessAddress,
            business_email: formData.businessEmail,
          },
          languagePreference: formData.languagePreference,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create assistant')
      }

      setAssistantData(data.assistant)
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Assistant Created!</h2>
          <p className="text-gray-600 mb-4">Your AI assistant is ready to handle calls</p>
          {assistantData?.phoneNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Phone className="w-4 h-4" />
                <span className="font-medium">Phone Number:</span>
                <span className="font-mono">{assistantData.phoneNumber}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Customers can call this number to reach your assistant</p>
            </div>
          )}
          <div className="animate-pulse text-sm text-gray-500">Redirecting to dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create AI Assistant</h1>
              <p className="text-gray-600">
                Configure your {currentOrganization?.industry_code?.toUpperCase() || 'industry'} assistant with automatic phone number assignment
              </p>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        {currentOrganization && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">
                  {currentOrganization.organization_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{currentOrganization.organization_name}</h3>
                <p className="text-sm text-gray-500">
                  {currentOrganization.industry_code?.toUpperCase() || 'Industry'} • {currentOrganization.user_role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {!currentOrganization?.industry_code && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">Industry Not Set</h4>
                  <p className="text-sm text-yellow-700">
                    Please set your industry in{' '}
                    <Link href="/organizations/settings" className="underline font-medium">
                      organization settings
                    </Link>{' '}
                    before creating an assistant.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Using your organization name from onboarding
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone (for area code preference)
              </label>
              <input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                A dedicated Vapi phone number will be automatically assigned to your assistant
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Address</label>
              <input
                type="text"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Primary service location for this assistant
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                placeholder="contact@yourbusiness.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email for appointment confirmations and follow-ups
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, languagePreference: 'en' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.languagePreference === 'en'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">English</div>
                      <div className="text-xs text-gray-600">Primary language</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, languagePreference: 'es' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.languagePreference === 'es'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Español</div>
                      <div className="text-xs text-gray-600">Idioma principal</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 mb-1">Error</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading || !formData.businessName || !formData.businessPhone || !currentOrganization?.industry_code}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Assistant...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Create AI Assistant
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Your AI assistant will be configured with industry-specific templates</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Emergency detection keywords loaded for {formData.languagePreference === 'en' ? 'English' : 'Spanish'}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>SMS templates will be ready for appointment confirmations and reminders</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Next, you'll need to configure your phone number in settings</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

