'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/lib/organizations/organization-context'

interface EmergencyContact {
  id?: string
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

interface EmergencyContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  contact?: EmergencyContact | null
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

export default function EmergencyContactModal({
  isOpen,
  onClose,
  onSave,
  contact,
}: EmergencyContactModalProps) {
  const toast = useToast()
  const { currentOrganization } = useOrganization()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<EmergencyContact>({
    name: '',
    phone: '',
    email: '',
    role: '',
    is_primary: false,
    is_active: true,
    priority: 1,
    sms_enabled: true,
    call_enabled: true,
    email_enabled: false,
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_hours_start: '09:00',
    available_hours_end: '17:00',
  })

  useEffect(() => {
    if (contact) {
      setFormData({
        ...contact,
        available_days: contact.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        available_hours_start: contact.available_hours_start || '09:00',
        available_hours_end: contact.available_hours_end || '17:00',
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        role: '',
        is_primary: false,
        is_active: true,
        priority: 1,
        sms_enabled: true,
        call_enabled: true,
        email_enabled: false,
        available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        available_hours_start: '09:00',
        available_hours_end: '17:00',
      })
    }
  }, [contact, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!currentOrganization) {
      toast.error('No organization selected')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a name')
      return
    }

    if (!formData.phone.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    if (!formData.sms_enabled && !formData.call_enabled && !formData.email_enabled) {
      toast.error('Please enable at least one notification method')
      return
    }

    if (formData.email_enabled && !formData.email?.trim()) {
      toast.error('Please enter an email address to enable email notifications')
      return
    }

    setSaving(true)
    try {
      const url = contact?.id
        ? `/api/emergency-contacts/${contact.id}`
        : '/api/emergency-contacts'

      const method = contact?.id ? 'PUT' : 'POST'

      // Include organization ID in the request body
      const payload = {
        ...formData,
        organizationId: currentOrganization.organization_id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(contact?.id ? 'Contact updated successfully' : 'Contact added successfully')
        onSave()
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save contact')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Error saving contact')
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: string) => {
    const days = formData.available_days || []
    if (days.includes(day)) {
      setFormData({
        ...formData,
        available_days: days.filter(d => d !== day),
      })
    } else {
      setFormData({
        ...formData,
        available_days: [...days, day],
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {contact?.id ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h2>
                <p className="text-sm text-gray-600">
                  {contact?.id ? 'Update contact information' : 'Create a new emergency contact'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Manager, Technician, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers are contacted first</p>
                </div>
              </div>
            </div>

            {/* Notification Methods */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Methods</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sms_enabled}
                    onChange={(e) => setFormData({ ...formData, sms_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-600">Send text messages for emergencies</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.call_enabled}
                    onChange={(e) => setFormData({ ...formData, call_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Phone Calls</div>
                    <div className="text-sm text-gray-600">Call this contact for emergencies</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_enabled}
                    onChange={(e) => setFormData({ ...formData, email_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Send email alerts for emergencies</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.available_days?.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.available_hours_start || ''}
                    onChange={(e) => setFormData({ ...formData, available_hours_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.available_hours_end || ''}
                    onChange={(e) => setFormData({ ...formData, available_hours_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Status Toggles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Primary Contact</div>
                    <div className="text-sm text-gray-600">This is the primary emergency contact</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Active</div>
                    <div className="text-sm text-gray-600">Enable notifications for this contact</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : contact?.id ? 'Update Contact' : 'Add Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
