'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  ArrowLeft, 
  BarChart3, 
  Phone, 
  MessageSquare, 
  Users, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  calls: {
    total: number
    thisWeek: number
    lastWeek: number
    avgDuration: number
    emergencies: number
  }
  sms: {
    total: number
    thisWeek: number
    lastWeek: number
    delivered: number
    failed: number
  }
  appointments: {
    total: number
    confirmed: number
    pending: number
    completed: number
  }
  languages: {
    english: number
    spanish: number
  }
}

export default function AnalyticsPage() {
  const { currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    calls: { total: 0, thisWeek: 0, lastWeek: 0, avgDuration: 0, emergencies: 0 },
    sms: { total: 0, thisWeek: 0, lastWeek: 0, delivered: 0, failed: 0 },
    appointments: { total: 0, confirmed: 0, pending: 0, completed: 0 },
    languages: { english: 0, spanish: 0 }
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/analytics/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }
        const result = await response.json()
        if (result.success) {
          setData(result.stats)
        }
      } catch (error) {
        console.error('Error loading analytics:', error)
        // Keep default empty state on error
      } finally {
        setLoading(false)
      }
    }
    
    if (currentOrganization) {
      loadData()
    }
  }, [currentOrganization])

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const callsChange = calculateChange(data.calls.thisWeek, data.calls.lastWeek)
  const smsChange = calculateChange(data.sms.thisWeek, data.sms.lastWeek)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
            <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">{currentOrganization?.organization_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
            <Activity className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              {callsChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${callsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {callsChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(callsChange)}%
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{data.calls.total}</div>
            <div className="text-sm text-gray-600">Total Calls</div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              {data.calls.thisWeek} this week • {data.calls.emergencies} emergencies
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              {smsChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${smsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {smsChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(smsChange)}%
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{data.sms.total}</div>
            <div className="text-sm text-gray-600">SMS Sent</div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              {data.sms.delivered} delivered • {data.sms.failed} failed
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{data.appointments.total}</div>
            <div className="text-sm text-gray-600">Appointments</div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              {data.appointments.confirmed} confirmed • {data.appointments.pending} pending
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{data.calls.avgDuration}s</div>
            <div className="text-sm text-gray-600">Avg Call Duration</div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              3 min 5 sec average
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Language Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Language Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">English</span>
                  <span className="text-sm font-semibold text-gray-900">{data.languages.english} calls</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${(data.languages.english / (data.languages.english + data.languages.spanish)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Spanish</span>
                  <span className="text-sm font-semibold text-gray-900">{data.languages.spanish} calls</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${(data.languages.spanish / (data.languages.english + data.languages.spanish)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Appointment Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Confirmed</div>
                    <div className="text-xs text-gray-500">Ready to go</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">{data.appointments.confirmed}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Pending</div>
                    <div className="text-xs text-gray-500">Awaiting confirmation</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{data.appointments.pending}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Completed</div>
                    <div className="text-xs text-gray-500">Service done</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{data.appointments.completed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Calls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Calls Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-red-50 rounded-xl">
              <div className="text-4xl font-bold text-red-600 mb-2">{data.calls.emergencies}</div>
              <div className="text-sm text-gray-700 font-medium">Emergency Calls</div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="text-4xl font-bold text-orange-600 mb-2">{Math.round((data.calls.emergencies / data.calls.total) * 100)}%</div>
              <div className="text-sm text-gray-700 font-medium">Emergency Rate</div>
              <div className="text-xs text-gray-500 mt-1">Of total calls</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">&lt;5min</div>
              <div className="text-sm text-gray-700 font-medium">Avg Response Time</div>
              <div className="text-xs text-gray-500 mt-1">To emergencies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
