'use client'

import { useEffect, useState } from 'react'
import { Phone, Calendar, MessageSquare, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: any
  iconColor: string
  iconBg: string
}

interface QuickStatsProps {
  organizationId: string
}

export default function QuickStats({ organizationId }: QuickStatsProps) {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [organizationId])

  const loadStats = async () => {
    try {
      // Fetch today's statistics
      const today = new Date().toISOString().split('T')[0]
      
      let todayCalls = 0
      let callsChange = 0
      let pendingAppointments = 0
      let nextAppointment: any = null
      let smsSent = 0
      let smsDeliveryRate = 0
      let assistantStatus = 'Offline'
      let isOnline = false

      try {
        const callsRes = await fetch(`/api/analytics/calls?date=${today}`)
        if (callsRes.ok) {
          const callsData = await callsRes.json()
          todayCalls = callsData?.count || 0
          callsChange = callsData?.change || 0
        }
      } catch (error) {
        console.error('Error fetching calls:', error)
      }

      try {
        const appointmentsRes = await fetch(`/api/appointments?status=pending&limit=1`)
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json()
          pendingAppointments = appointmentsData?.appointments?.length || 0
          nextAppointment = appointmentsData?.appointments?.[0]
        }
      } catch (error) {
        console.error('Error fetching appointments:', error)
      }

      try {
        const smsRes = await fetch(`/api/sms/logs?date=${today}`)
        if (smsRes.ok) {
          const smsData = await smsRes.json()
          smsSent = smsData?.logs?.length || 0
          smsDeliveryRate = smsData?.deliveryRate || 0
        }
      } catch (error) {
        console.error('Error fetching SMS:', error)
      }

      try {
        const assistantRes = await fetch('/api/assistants/stats')
        if (assistantRes.ok) {
          const assistantData = await assistantRes.json()
          assistantStatus = assistantData?.stats?.active > 0 ? 'Online' : 'Offline'
          isOnline = assistantData?.stats?.active > 0
        }
      } catch (error) {
        console.error('Error fetching assistant stats:', error)
      }

      const statsData: Stat[] = [
        {
          label: "Today's Calls",
          value: todayCalls,
          change: callsChange,
          changeLabel: 'vs yesterday',
          icon: Phone,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50',
        },
        {
          label: 'Pending Appointments',
          value: pendingAppointments,
          changeLabel: nextAppointment 
            ? `Next: ${new Date(nextAppointment.scheduled_date).toLocaleDateString()}`
            : 'No upcoming',
          icon: Calendar,
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-50',
        },
        {
          label: 'SMS Sent Today',
          value: smsSent,
          changeLabel: smsDeliveryRate > 0 ? `${smsDeliveryRate}% delivered` : undefined,
          icon: MessageSquare,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-50',
        },
        {
          label: 'Assistant Status',
          value: assistantStatus,
          changeLabel: isOnline ? 'Ready to receive calls' : 'No active assistant',
          icon: Activity,
          iconColor: isOnline ? 'text-emerald-600' : 'text-gray-400',
          iconBg: isOnline ? 'bg-emerald-50' : 'bg-gray-50',
        },
      ]

      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-2 sm:mb-3"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
                <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const hasPositiveChange = stat.change && stat.change > 0
        const hasNegativeChange = stat.change && stat.change < 0
        
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {stat.value}
                </p>
                
                {stat.changeLabel && (
                  <div className="flex items-center gap-1.5">
                    {hasPositiveChange && (
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    )}
                    {hasNegativeChange && (
                      <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <p className={cn(
                      'text-xs font-medium',
                      hasPositiveChange && 'text-green-600',
                      hasNegativeChange && 'text-red-600',
                      !stat.change && 'text-gray-500'
                    )}>
                      {stat.change && (
                        <span className="mr-1">
                          {hasPositiveChange ? '+' : ''}{stat.change}
                        </span>
                      )}
                      {stat.changeLabel}
                    </p>
                  </div>
                )}
              </div>
              
              <div className={cn(
                'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                stat.iconBg
              )}>
                <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', stat.iconColor)} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

