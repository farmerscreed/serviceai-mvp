'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import Link from 'next/link'
import {
  Bot,
  Phone,
  Calendar,
  AlertCircle,
  Users,
  CreditCard,
  Building2,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingCard {
  id: string
  title: string
  description: string
  icon: any
  href: string
  status?: 'complete' | 'incomplete' | 'warning'
  statusText?: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  
  const [assistantStatus, setAssistantStatus] = useState<'complete' | 'incomplete'>('incomplete')
  const [calendarStatus, setCalendarStatus] = useState<'complete' | 'incomplete'>('incomplete')
  const [emergencyStatus, setEmergencyStatus] = useState<'complete' | 'incomplete'>('incomplete')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization) {
      checkStatuses()
    }
  }, [currentOrganization])

  const checkStatuses = async () => {
    setLoading(true)
    try {
      // Check if assistant exists
      const assistantRes = await fetch('/api/assistants')
      if (assistantRes.ok) {
        const data = await assistantRes.json()
        setAssistantStatus(data.assistants?.length > 0 ? 'complete' : 'incomplete')
      }

      // Check if calendar is connected
      const orgRes = await fetch(`/api/organizations/${currentOrganization?.organization_id}`)
      if (orgRes.ok) {
        const data = await orgRes.json()
        setCalendarStatus(data.organization?.calendar_sync_enabled ? 'complete' : 'incomplete')
      }

      // Check if emergency contacts exist
      const emergencyRes = await fetch('/api/emergency-contacts')
      if (emergencyRes.ok) {
        const data = await emergencyRes.json()
        setEmergencyStatus(data.contacts?.length > 0 ? 'complete' : 'incomplete')
      }
    } catch (error) {
      console.error('Error checking statuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const settingCards: SettingCard[] = [
    {
      id: 'assistant',
      title: 'My AI Assistant',
      description: 'Configure your AI phone assistant, test calls, and manage settings',
      icon: Bot,
      href: '/settings/assistant',
      status: assistantStatus,
      statusText: assistantStatus === 'complete' ? 'Active' : 'Not configured',
    },
    {
      id: 'phone-calendar',
      title: 'Phone & Calendar',
      description: 'Manage your phone number and integrate your calendar',
      icon: Phone,
      href: '/settings/phone-calendar',
      status: calendarStatus,
      statusText: calendarStatus === 'complete' ? 'Connected' : 'Not connected',
    },
    {
      id: 'emergency',
      title: 'Emergency Contacts',
      description: 'Set up contacts for emergency situations and critical alerts',
      icon: AlertCircle,
      href: '/settings/emergency',
      status: emergencyStatus,
      statusText: emergencyStatus === 'complete' ? 'Configured' : 'Not configured',
    },
    {
      id: 'team',
      title: 'Team & Access',
      description: 'Manage team members, roles, and permissions',
      icon: Users,
      href: '/settings/team',
    },
    {
      id: 'billing',
      title: 'Billing & Plans',
      description: 'View your subscription, usage, and payment methods',
      icon: CreditCard,
      href: '/settings/billing',
    },
    {
      id: 'organization',
      title: 'Organization',
      description: 'Update your business information and preferences',
      icon: Building2,
      href: '/settings/organization',
    },
  ]

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'incomplete':
        return <XCircle className="w-5 h-5 text-gray-400" />
      case 'warning':
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return null
    }
  }

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your account, assistant, and organization settings
          </p>
        </div>

        {/* Quick Setup Status */}
        {!loading && (assistantStatus === 'incomplete' || calendarStatus === 'incomplete' || emergencyStatus === 'incomplete') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Complete Your Setup</h3>
              <p className="text-sm text-blue-700 mb-2">
                Finish setting up your account to get the most out of ServiceAI
              </p>
              <div className="flex flex-wrap gap-2">
                {assistantStatus === 'incomplete' && (
                  <Link
                    href="/settings/assistant"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    Configure Assistant
                  </Link>
                )}
                {calendarStatus === 'incomplete' && (
                  <Link
                    href="/settings/phone-calendar"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    Connect Calendar
                  </Link>
                )}
                {emergencyStatus === 'incomplete' && (
                  <Link
                    href="/settings/emergency"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    Add Emergency Contact
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {settingCards.map((card) => {
            const Icon = card.icon
            const StatusIcon = getStatusIcon(card.status)
            
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    card.status === 'complete' ? 'bg-green-50' :
                    card.status === 'incomplete' ? 'bg-gray-50' :
                    card.status === 'warning' ? 'bg-orange-50' : 'bg-blue-50'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      card.status === 'complete' ? 'text-green-600' :
                      card.status === 'incomplete' ? 'text-gray-400' :
                      card.status === 'warning' ? 'text-orange-600' : 'text-blue-600'
                    )} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  {card.description}
                </p>

                {card.statusText && (
                  <div className="flex items-center gap-2">
                    {StatusIcon}
                    <span className={cn(
                      'text-xs sm:text-sm font-medium',
                      card.status === 'complete' ? 'text-green-700' :
                      card.status === 'incomplete' ? 'text-gray-500' :
                      card.status === 'warning' ? 'text-orange-700' : 'text-gray-500'
                    )}>
                      {card.statusText}
                    </span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Organization Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Current Organization</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                {currentOrganization.organization_name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Industry: {currentOrganization.industry_type || 'Not specified'}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Created: {new Date(currentOrganization.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link
              href="/settings/organization"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

