'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  ArrowLeft, 
  Zap, 
  Plus,
  Phone,
  Languages,
  CheckCircle2,
  XCircle,
  Calendar,
  Loader2,
  Settings,
  Trash2
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

export default function AssistantsPage() {
  const { currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAssistants()
  }, [])

  const loadAssistants = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/assistants/list')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load assistants')
      }

      setAssistants(data.assistants || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleTestCall = (assistant: Assistant) => {
    if (assistant.vapi_phone_number) {
      // Open phone dialer with the assistant's number
      window.location.href = `tel:${assistant.vapi_phone_number}`
    } else {
      alert('This assistant does not have a phone number assigned yet. Please configure a phone number first.')
    }
  }

  const handleDelete = async (assistant: Assistant) => {
    const confirmMessage = `Are you sure you want to delete "${assistant.business_data?.business_name || 'this assistant'}"? This action cannot be undone.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/assistants/${assistant.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete assistant')
      }

      // Reload assistants list
      await loadAssistants()
    } catch (err: any) {
      alert(`Error deleting assistant: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assistants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Assistants</h1>
              <p className="text-gray-600">
                {assistants.length} {assistants.length === 1 ? 'assistant' : 'assistants'} configured
              </p>
            </div>
          </div>
          <Link
            href="/assistants/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Assistant
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {assistants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assistants yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first AI assistant to start handling customer calls
            </p>
            <Link
              href="/assistants/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Assistant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assistant.business_data?.business_name || 'Unnamed Assistant'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="capitalize">{assistant.industry_code}</span>
                        <span>•</span>
                        <Languages className="w-4 h-4" />
                        <span className="uppercase">{assistant.language_code}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    assistant.is_active
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {assistant.is_active ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Inactive
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {assistant.vapi_phone_number && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{assistant.vapi_phone_number}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Created {formatDate(assistant.created_at)}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600">
                    ID: {assistant.vapi_assistant_id}
                  </div>
                </div>

                {assistant.business_data && (
                  <div className="mb-4 pt-4 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-2">Business Info:</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {assistant.business_data.business_phone && (
                        <div>Phone: {assistant.business_data.business_phone}</div>
                      )}
                      {assistant.business_data.business_address && (
                        <div>Address: {assistant.business_data.business_address}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/assistants/${assistant.id}/configure`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </Link>
                  <button
                    onClick={() => handleTestCall(assistant)}
                    disabled={!assistant.vapi_phone_number}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Test Call
                  </button>
                  <button
                    onClick={() => handleDelete(assistant)}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                    title="Delete assistant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {assistants.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {assistants.filter(a => a.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Assistants</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {assistants.filter(a => a.language_code === 'es').length}
              </div>
              <div className="text-sm text-gray-600">Spanish Assistants</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {new Set(assistants.map(a => a.industry_code)).size}
              </div>
              <div className="text-sm text-gray-600">Industries Covered</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

