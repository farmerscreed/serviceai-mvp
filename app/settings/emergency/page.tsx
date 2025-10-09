'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'
import {
  AlertCircle,
  ChevronRight,
  Plus,
  Phone,
  Mail,
  Clock,
  Edit2,
  Trash2,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmergencyContact {
  id: string
  name: string
  phone: string
  email?: string
  role?: string
  is_primary: boolean
  is_active: boolean
  priority: number
  sms_enabled: boolean
  call_enabled: boolean
  email_enabled: boolean
  available_days?: string[]
  available_hours_start?: string
  available_hours_end?: string
}

export default function EmergencySettingsPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const toast = useToast()
  const { confirm } = useConfirm()
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadContacts()
    }
  }, [currentOrganization])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/emergency-contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Emergency Contact?',
      message: `Are you sure you want to delete "${name}"? They will no longer be notified of emergency situations.`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
    })

    if (!confirmed) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/emergency-contacts/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Emergency contact deleted successfully')
        await loadContacts()
      } else {
        toast.error('Failed to delete contact')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Error deleting contact')
    } finally {
      setDeleting(null)
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
          <span className="text-gray-900 font-medium">Emergency Contacts</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Emergency Contacts</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Set up contacts to notify when emergencies are detected
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Contacts</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Add contacts to be notified when your AI assistant detects emergency situations
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                      contact.is_primary ? 'bg-red-50' : 'bg-orange-50'
                    )}>
                      <AlertCircle className={cn(
                        'w-6 h-6',
                        contact.is_primary ? 'text-red-600' : 'text-orange-600'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                        {contact.is_primary && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Primary
                          </span>
                        )}
                        {!contact.is_active && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>

                      {contact.role && (
                        <p className="text-sm text-gray-600 mb-3">{contact.role}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{contact.phone}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>

                      {contact.available_hours_start && contact.available_hours_end && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>Available: {contact.available_hours_start} - {contact.available_hours_end}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {contact.sms_enabled && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                            SMS
                          </span>
                        )}
                        {contact.call_enabled && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
                            Phone
                          </span>
                        )}
                        {contact.email_enabled && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                            Email
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id, contact.name)}
                          disabled={deleting === contact.id}
                          className="flex items-center gap-2 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting === contact.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3">
                  <p className="text-xs text-gray-600">
                    Priority: <span className="font-medium text-gray-900">#{contact.priority}</span>
                    {contact.priority === 1 && " (First to be contacted)"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Card */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-red-900 mb-2">How Emergency Detection Works</h3>
              <ul className="text-sm text-red-700 space-y-1.5 list-disc list-inside">
                <li>AI detects emergency keywords during calls (e.g., "no heat", "water leak", "emergency")</li>
                <li>Contacts are notified immediately via SMS, call, or email</li>
                <li>Primary contact is tried first, then escalates by priority</li>
                <li>Set availability hours to control when each contact can be reached</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

