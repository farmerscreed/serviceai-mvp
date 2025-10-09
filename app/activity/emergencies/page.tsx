'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import Link from 'next/link'
import {
  AlertCircle,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface EmergencyAlert {
  id: string
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'contacted' | 'resolved' | 'failed'
  timestamp: string
  customerName?: string
  customerPhone?: string
  contactedAt?: string
  resolvedAt?: string
  notes?: string
  callId?: string
}

export default function EmergenciesPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  
  const [emergencies, setEmergencies] = useState<EmergencyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyAlert | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all')

  useEffect(() => {
    if (currentOrganization) {
      loadEmergencies()
    }
  }, [currentOrganization])

  const loadEmergencies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/emergency-contacts/alerts')
      if (response.ok) {
        const data = await response.json()
        setEmergencies(data.alerts || [])
      }
    } catch (error) {
      console.error('Error loading emergencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkResolved = async (id: string) => {
    try {
      const response = await fetch(`/api/emergency-contacts/alerts/${id}/resolve`, {
        method: 'POST',
      })
      if (response.ok) {
        await loadEmergencies()
        setSelectedEmergency(null)
      }
    } catch (error) {
      console.error('Error resolving emergency:', error)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return CheckCircle
      case 'contacted':
        return Phone
      case 'failed':
        return XCircle
      default:
        return Clock
    }
  }

  const filteredEmergencies = emergencies.filter((emergency) => {
    if (filter === 'all') return true
    if (filter === 'pending') return emergency.status === 'pending' || emergency.status === 'contacted'
    if (filter === 'resolved') return emergency.status === 'resolved'
    return true
  })

  const pendingCount = emergencies.filter(e => e.status === 'pending' || e.status === 'contacted').length
  const resolvedCount = emergencies.filter(e => e.status === 'resolved').length

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/activity" className="hover:text-gray-900">Activity</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Emergencies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Emergency Alerts</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Critical situations detected by your AI assistant
          </p>
        </div>

        {/* Alert Banner - if there are pending emergencies */}
        {pendingCount > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                {pendingCount} {pendingCount === 1 ? 'Emergency' : 'Emergencies'} Requiring Attention
              </h3>
              <p className="text-sm text-red-700">
                Please review and take action on pending emergency alerts.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{emergencies.length}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{resolvedCount}</div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            )}
          >
            All ({emergencies.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            )}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            )}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Emergency List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEmergencies.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'pending' ? 'No Pending Emergencies' : 'No Emergencies Found'}
              </h3>
              <p className="text-sm text-gray-600">
                {filter === 'pending'
                  ? 'All emergency situations have been resolved.'
                  : 'Emergency alerts will appear here when detected by your AI assistant.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEmergencies.map((emergency) => {
                const StatusIcon = getStatusIcon(emergency.status)
                const urgencyColor = getUrgencyColor(emergency.urgency)
                
                return (
                  <div
                    key={emergency.id}
                    className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmergency(emergency)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                        emergency.status === 'resolved' ? 'bg-green-50' :
                        emergency.urgency === 'critical' ? 'bg-red-50' : 'bg-orange-50'
                      )}>
                        <StatusIcon className={cn(
                          'w-6 h-6',
                          emergency.status === 'resolved' ? 'text-green-600' :
                          emergency.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">{emergency.title}</h4>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', urgencyColor)}>
                            {emergency.urgency.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{emergency.description}</p>
                        
                        {emergency.customerName && (
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{emergency.customerName}</span>
                            {emergency.customerPhone && (
                              <span>{emergency.customerPhone}</span>
                            )}
                          </div>
                        )}

                        {emergency.status === 'resolved' && emergency.resolvedAt && (
                          <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Resolved {formatRelativeTime(emergency.resolvedAt)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <time className="text-xs text-gray-500">
                          {formatRelativeTime(emergency.timestamp)}
                        </time>
                        
                        {emergency.status !== 'resolved' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkResolved(emergency.id)
                            }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

