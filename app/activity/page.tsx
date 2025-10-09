'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  MessageSquare,
  Calendar,
  AlertCircle,
  Activity as ActivityIcon,
  Filter,
  Search,
  Download,
  RefreshCw,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

type ActivityType = 'all' | 'calls' | 'sms' | 'appointments' | 'emergencies'

interface ActivityItem {
  id: string
  type: 'call' | 'sms' | 'appointment' | 'emergency'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'pending' | 'failed' | 'warning'
  metadata?: any
}

export default function ActivityPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [activeTab, setActiveTab] = useState<ActivityType>('all')
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // Read tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as ActivityType
    if (tab && ['all', 'calls', 'sms', 'appointments', 'emergencies'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (currentOrganization) {
      loadActivities()
    }
  }, [currentOrganization, activeTab, dateFilter, statusFilter])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeTab === 'all' ? '' : activeTab,
        date: dateFilter,
        status: statusFilter,
      })

      const response = await fetch(`/api/activity?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadActivities()
    setRefreshing(false)
  }

  const handleTabChange = (tab: ActivityType) => {
    setActiveTab(tab)
    router.push(`/activity?tab=${tab}`)
  }

  const filteredActivities = activities.filter((activity) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query)
      )
    }
    return true
  })

  const tabs = [
    { id: 'all' as const, label: 'All Activity', icon: ActivityIcon, count: activities.length },
    { id: 'calls' as const, label: 'Calls', icon: Phone, count: activities.filter(a => a.type === 'call').length },
    { id: 'sms' as const, label: 'SMS', icon: MessageSquare, count: activities.filter(a => a.type === 'sms').length },
    { id: 'appointments' as const, label: 'Appointments', icon: Calendar, count: activities.filter(a => a.type === 'appointment').length },
    { id: 'emergencies' as const, label: 'Emergencies', icon: AlertCircle, count: activities.filter(a => a.type === 'emergency').length },
  ]

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Activity</h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage all activity for {currentOrganization.organization_name}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0',
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Filters & Search */}
          <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4 text-gray-600', refreshing && 'animate-spin')} />
            </button>

            {/* Export */}
            <button
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Activity List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              <div className="p-4 sm:p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              // Empty state
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ActivityIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No activity found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : 'Activity will appear here as your assistant handles calls, sends SMS, and more.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              // Activity items
              <div className="divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <ActivityItemRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityItemRow({ activity }: { activity: ActivityItem }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'call':
        return Phone
      case 'sms':
        return MessageSquare
      case 'appointment':
        return Calendar
      case 'emergency':
        return AlertCircle
    }
  }

  const getColorClasses = () => {
    if (activity.type === 'emergency') return 'bg-red-50 text-red-600'
    
    switch (activity.status) {
      case 'success':
        return 'bg-green-50 text-green-600'
      case 'failed':
        return 'bg-red-50 text-red-600'
      case 'pending':
        return 'bg-blue-50 text-blue-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  const Icon = getIcon()
  const colorClasses = getColorClasses()

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClasses)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 mb-1">{activity.title}</h4>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{activity.description}</p>
        </div>

        <div className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
          {formatRelativeTime(activity.timestamp)}
        </div>
      </div>
    </div>
  )
}

