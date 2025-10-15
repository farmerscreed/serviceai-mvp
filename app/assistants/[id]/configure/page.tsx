'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Zap, 
  Phone,
  Languages,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react'

interface Assistant {
  id: string
  organization_id: string
  industry_code: string
  language_code: string
  vapi_assistant_id: string
  vapi_phone_number: string | null
  business_data: any
  voice_config: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AssistantConfigurePage() {
  const params = useParams()
  const router = useRouter()
  const assistantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    phoneNumber: '',
    isActive: true,
    languageCode: 'en',
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessEmail: ''
  })

  useEffect(() => {
    loadAssistant()
  }, [assistantId])

  const loadAssistant = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/assistants/${assistantId}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load assistant')
      }

      setAssistant(data.assistant)
      setFormData({
        phoneNumber: data.assistant.vapi_phone_number || '',
        isActive: data.assistant.is_active,
        languageCode: data.assistant.language_code,
        businessName: data.assistant.business_data?.business_name || '',
        businessPhone: data.assistant.business_data?.business_phone || '',
        businessAddress: data.assistant.business_data?.business_address || '',
        businessEmail: data.assistant.business_data?.business_email || ''
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await fetch(`/api/assistants/${assistantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vapi_phone_number: formData.phoneNumber,
          is_active: formData.isActive,
          language_code: formData.languageCode,
          business_data: {
            business_name: formData.businessName,
            business_phone: formData.businessPhone,
            business_address: formData.businessAddress,
            business_email: formData.businessEmail
          }
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update assistant')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/assistants')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assistant...</p>
        </div>
      </div>
    )
  }

  if (error && !assistant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeft className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/assistants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assistants
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Configuration Saved!</h2>
          <p className="text-gray-600 mb-6">Your assistant has been updated successfully</p>
          <div className="animate-pulse text-sm text-gray-500">Redirecting...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/assistants"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assistants
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configure Assistant</h1>
            <p className="text-gray-600">{assistant?.business_data?.business_name || 'Unnamed Assistant'}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-6">
          {/* Status Toggle */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Assistant Status</div>
                <div className="text-xs text-gray-500">Enable or disable this assistant</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-100 after:border-slate-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">The phone number customers will call to reach this assistant</p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <Languages className="w-4 h-4 inline mr-2" />
              Primary Language
            </label>
            <select
              value={formData.languageCode}
              onChange={(e) => setFormData({ ...formData, languageCode: e.target.value as 'en' | 'es' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish (Español)</option>
            </select>
          </div>

          {/* Business Info */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Business Phone</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Business Address</label>
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Business Email</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200 flex gap-3">
            <Link
              href="/assistants"
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Assistant Details Card */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">System Information</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Assistant ID:</span>
              <span className="font-mono text-gray-900">{assistant?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vapi ID:</span>
              <span className="font-mono text-gray-900">{assistant?.vapi_assistant_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Industry:</span>
              <span className="text-gray-900 capitalize">{assistant?.industry_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">{assistant?.created_at && new Date(assistant.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

