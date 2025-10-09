'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import Link from 'next/link'
import {
  Phone,
  Calendar,
  ChevronRight,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PhoneCalendarSettingsPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [phoneProvider, setPhoneProvider] = useState<string | null>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarProvider, setCalendarProvider] = useState<string | null>(null)
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      loadSettings()
    }
  }, [currentOrganization])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Load phone number info
      const assistantsRes = await fetch('/api/assistants')
      if (assistantsRes.ok) {
        const data = await assistantsRes.json()
        if (data.assistants?.length > 0) {
          setPhoneNumber(data.assistants[0].phone_number)
          setPhoneProvider('Vapi') // or detect from metadata
        }
      }

      // Load calendar connection status
      const orgRes = await fetch(`/api/organizations/${currentOrganization?.organization_id}`)
      if (orgRes.ok) {
        const data = await orgRes.json()
        const org = data.organization
        setCalendarConnected(org?.calendar_sync_enabled || false)
        setCalendarProvider(org?.calendar_provider || null)
        setCalendarEmail(org?.calendar_metadata?.email || null)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGoogleCalendar = async () => {
    setConnecting(true)
    try {
      // TODO: Implement Google OAuth flow
      alert('Google Calendar connection will be implemented soon!')
      // This would redirect to Google OAuth, then callback to /api/calendar/google/callback
    } catch (error) {
      console.error('Error connecting calendar:', error)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect your calendar?')) {
      return
    }

    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      })
      
      if (response.ok) {
        await loadSettings()
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
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
          <span className="text-gray-900 font-medium">Phone & Calendar</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Phone & Calendar</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your phone number and calendar integrations
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Phone Number Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Phone Number</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Your AI assistant's dedicated phone number for receiving calls
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {phoneNumber ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Active</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                          {phoneNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          Provider: <span className="font-medium text-gray-900">{phoneProvider || 'Vapi'}</span>
                        </div>
                      </div>
                      
                      <button
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Change</span>
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        <strong>Tip:</strong> Share this number with your customers to let them call your AI assistant directly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Phone Number</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create an AI assistant to get a phone number
                    </p>
                    <Link
                      href="/assistants/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Create Assistant
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Integration Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Calendar Integration</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Sync appointments with your calendar for seamless scheduling
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {calendarConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">Connected</span>
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1 capitalize">
                          {calendarProvider || 'Calendar'}
                        </div>
                        {calendarEmail && (
                          <div className="text-sm text-gray-600 mb-3">
                            {calendarEmail}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => loadSettings()}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Sync Now
                          </button>
                          <button
                            onClick={handleDisconnectCalendar}
                            className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700">
                        <strong>Success!</strong> Appointments booked by your AI assistant will automatically appear in your calendar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Calendar</h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                      Sync appointments automatically and check availability in real-time
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <button
                        onClick={handleConnectGoogleCalendar}
                        disabled={connecting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google Calendar
                      </button>

                      <button
                        disabled={connecting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#0078D4" d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
                        </svg>
                        Outlook Calendar
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      More providers coming soon: Calendly, iCloud
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">Why Connect Your Calendar?</h3>
              <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                <li>Automatically sync appointments booked by your AI assistant</li>
                <li>Check real-time availability before confirming bookings</li>
                <li>Prevent double-booking and scheduling conflicts</li>
                <li>Get calendar reminders for upcoming appointments</li>
                <li>View all appointments in one place</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

