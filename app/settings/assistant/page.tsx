'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Phone,
  ChevronRight,
  Settings as SettingsIcon,
  Trash2,
  TestTube,
  CheckCircle,
  Globe,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assistant {
  id: string
  assistant_name?: string
  name?: string
  vapi_assistant_id: string
  phone_number?: string
  language?: string
  industry_code?: string
  industry?: string
  created_at: string
}

export default function AssistantSettingsPage() {
  // Redirect to unified assistants page
  if (typeof window !== 'undefined') {
    // client-side redirect for existing bookmarks/navigation
    window.location.replace('/assistants')
    return null
  }
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const loadAssistants = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/assistants')
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants || [])
      }
    } catch (error) {
      console.error('Error loading assistants:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentOrganization) {
      loadAssistants()
    }
  }, [currentOrganization, loadAssistants])

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Assistant?',
      message: `Are you sure you want to delete "${name}"? This will permanently remove the assistant and all its configurations. This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
    })

    if (!confirmed) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/assistants/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Assistant deleted successfully')
        await loadAssistants()
      } else {
        toast.error('Failed to delete assistant')
      }
    } catch (error) {
      console.error('Error deleting assistant:', error)
      toast.error('Error deleting assistant')
    } finally {
      setDeleting(null)
    }
  }

  const handleTestCall = (assistant: Assistant) => {
    if (assistant.phone_number) {
      toast.info(`To test your assistant, call: ${assistant.phone_number}`, 10000)
    } else {
      toast.warning('Phone number not configured for this assistant')
    }
  }

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/settings" className="hover:text-gray-900">Settings</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">My AI Assistant</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My AI Assistant</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Configure and manage your AI phone assistant
            </p>
          </div>
          <Link
            href="/assistants/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create New
          </Link>
        </div>

        {/* Assistants List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : assistants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Assistant Yet</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Create your first AI assistant to start handling customer calls automatically
            </p>
            <Link
              href="/assistants/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Bot className="w-4 h-4" />
              Create AI Assistant
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {assistant.assistant_name || assistant.name || 'Unnamed Assistant'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                        {assistant.phone_number && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{assistant.phone_number}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4 flex-shrink-0" />
                          <span>{assistant.language?.toUpperCase() || 'EN'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Zap className="w-4 h-4 flex-shrink-0" />
                          <span className="capitalize">{assistant.industry_code || assistant.industry || 'General'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-green-700 font-medium">Active</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleTestCall(assistant)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <TestTube className="w-4 h-4" />
                          <span className="hidden sm:inline">Test Call</span>
                          <span className="sm:hidden">Test</span>
                        </button>

                        <Link
                          href={`/assistants/${assistant.id}/configure`}
                          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <SettingsIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Configure</span>
                          <span className="sm:hidden">Edit</span>
                        </Link>

                        <button
                          onClick={() => handleDelete(assistant.id, assistant.assistant_name || assistant.name || 'Assistant')}
                          disabled={deleting === assistant.id}
                          className="flex items-center gap-2 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{deleting === assistant.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">How to Test Your Assistant</h3>
          <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
            <li>Click the "Test Call" button to see your assistant's phone number</li>
            <li>Call the number from any phone</li>
            <li>Your AI assistant will answer and handle the conversation</li>
            <li>Test emergency detection, appointment booking, and other features</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

