'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  AlertCircle,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Activity
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'call' | 'sms' | 'appointment' | 'emergency'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'pending' | 'failed' | 'warning'
  href?: string
}

interface ActivityFeedProps {
  organizationId: string
  limit?: number
}

export default function ActivityFeed({ organizationId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
    
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [organizationId])

  const loadActivities = async () => {
    try {
      // Fetch recent activity from various sources
      const calls = { calls: [] }
      const sms = { logs: [] }
      const appointments = { appointments: [] }
      const emergencies = { alerts: [] }

      try {
        const callsRes = await fetch(`/api/analytics/recent-calls?limit=5`)
        if (callsRes.ok) {
          Object.assign(calls, await callsRes.json())
        }
      } catch (error) {
        console.error('Error fetching calls:', error)
      }

      try {
        const smsRes = await fetch(`/api/sms/logs?limit=5`)
        if (smsRes.ok) {
          Object.assign(sms, await smsRes.json())
        }
      } catch (error) {
        console.error('Error fetching SMS:', error)
      }

      try {
        const appointmentsRes = await fetch(`/api/appointments?limit=5`)
        if (appointmentsRes.ok) {
          Object.assign(appointments, await appointmentsRes.json())
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
      }

      try {
        const emergenciesRes = await fetch(`/api/emergency-contacts/alerts?limit=3`)
        if (emergenciesRes.ok) {
          Object.assign(emergencies, await emergenciesRes.json())
        }
      } catch (error) {
        console.error('Error fetching emergencies:', error)
      }

      // Transform to unified activity format
      const allActivities: ActivityItem[] = []

      // Add calls
      calls.calls?.forEach((call: any) => {
        allActivities.push({
          id: `call-${call.id}`,
          type: 'call',
          title: call.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call',
          description: `${call.customer_name || call.customer_phone || 'Unknown'} • ${call.duration || 0}s`,
          timestamp: call.created_at,
          status: call.status === 'completed' ? 'success' : call.status === 'failed' ? 'failed' : 'pending',
          href: `/activity/calls`,
        })
      })

      // Add SMS
      sms.logs?.forEach((msg: any) => {
        allActivities.push({
          id: `sms-${msg.id}`,
          type: 'sms',
          title: 'SMS Sent',
          description: `To ${msg.phone_number} • ${msg.message_type}`,
          timestamp: msg.created_at,
          status: msg.status === 'delivered' ? 'success' : msg.status === 'failed' ? 'failed' : 'pending',
          href: `/activity/sms`,
        })
      })

      // Add appointments
      appointments.appointments?.forEach((apt: any) => {
        allActivities.push({
          id: `appointment-${apt.id}`,
          type: 'appointment',
          title: 'Appointment Booked',
          description: `${apt.customer_name} • ${apt.appointment_type}`,
          timestamp: apt.created_at,
          status: apt.status === 'confirmed' ? 'success' : 'pending',
          href: `/appointments/${apt.id}`,
        })
      })

      // Add emergencies
      emergencies.alerts?.forEach((alert: any) => {
        allActivities.push({
          id: `emergency-${alert.id}`,
          type: 'emergency',
          title: 'Emergency Detected',
          description: alert.description || 'High urgency situation',
          timestamp: alert.created_at,
          status: 'warning',
          href: `/activity/emergencies`,
        })
      })

      // Sort by timestamp (most recent first) and limit
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(allActivities.slice(0, limit))
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'call':
        return Phone
      case 'sms':
        return MessageSquare
      case 'appointment':
        return Calendar
      case 'emergency':
        return AlertCircle
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string, status?: string) => {
    if (type === 'emergency') return 'text-red-600 bg-red-50'
    
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-orange-600 bg-orange-50'
      case 'pending':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return CheckCircle
      case 'failed':
        return XCircle
      case 'pending':
        return Clock
      case 'warning':
        return AlertCircle
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h3>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 sm:gap-4 animate-pulse">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-1.5 sm:mb-2"></div>
                <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-12 sm:w-16 flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h3>
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-1">No activity yet</p>
          <p className="text-xs sm:text-sm text-gray-500">Activity will appear here once you start receiving calls</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link 
          href="/activity"
          className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span className="hidden sm:inline">View all</span>
          <span className="sm:hidden">All</span>
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Link>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type, activity.status)
          const colorClasses = getActivityColor(activity.type, activity.status)
          const StatusIcon = getStatusIcon(activity.status)
          
          const content = (
            <div className="flex items-start gap-3 sm:gap-4 group">
              <div className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                colorClasses
              )}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {activity.title}
                  </p>
                  {StatusIcon && (
                    <StatusIcon className={cn(
                      'w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0',
                      activity.status === 'success' && 'text-green-600',
                      activity.status === 'failed' && 'text-red-600',
                      activity.status === 'pending' && 'text-blue-600',
                      activity.status === 'warning' && 'text-orange-600'
                    )} />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{activity.description}</p>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <time className="text-xs text-gray-500 hidden sm:block">
                  {formatRelativeTime(activity.timestamp)}
                </time>
                {activity.href && (
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </div>
          )

          if (activity.href) {
            return (
              <Link
                key={activity.id}
                href={activity.href}
                className="block hover:bg-gray-50 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2 rounded-lg transition-colors"
              >
                {content}
              </Link>
            )
          }

          return (
            <div key={activity.id} className="-mx-3 sm:-mx-4 px-3 sm:px-4 py-2">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

