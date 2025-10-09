'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, PhoneIncoming, PhoneOutgoing, Search, Filter } from 'lucide-react'
import { useOrganization } from '@/lib/organizations/organization-context'
import { LoadingList, EmptyCalls } from '@/components/ui/LoadingStates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Call {
  id: string
  direction: 'inbound' | 'outbound'
  customer_name?: string
  customer_phone: string
  duration: number
  status: 'completed' | 'failed' | 'missed'
  created_at: string
  transcript?: string
}

export default function CallsPage() {
  const { currentOrganization } = useOrganization()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDirection, setFilterDirection] = useState<string>('all')

  useEffect(() => {
    if (!currentOrganization) return
    loadCalls()
  }, [currentOrganization])

  const loadCalls = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/recent-calls?limit=50')
      if (response.ok) {
        const data = await response.json()
        setCalls(data.calls || [])
      }
    } catch (error) {
      console.error('Error loading calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.customer_phone.includes(searchQuery)
    const matchesDirection = filterDirection === 'all' || call.direction === filterDirection
    return matchesSearch && matchesDirection
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/activity"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Activity
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
            <p className="text-gray-600">{currentOrganization?.organization_name}</p>
          </div>
        </div>

        <Card padding="md" className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Calls</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <LoadingList count={5} showIcons={true} />
        ) : filteredCalls.length === 0 ? (
          <EmptyCalls />
        ) : (
          <div className="space-y-4">
            {filteredCalls.map((call) => (
              <Card key={call.id} padding="md" hoverable>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    call.direction === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {call.direction === 'inbound' ? (
                      <PhoneIncoming className={`w-6 h-6 ${call.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}`} />
                    ) : (
                      <PhoneOutgoing className={`w-6 h-6 text-green-600`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {call.customer_name || call.customer_phone}
                      </h3>
                      <Badge 
                        variant={call.status === 'completed' ? 'success' : call.status === 'failed' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {call.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{call.customer_phone}</span>
                      <span>•</span>
                      <span>{formatDuration(call.duration)}</span>
                      <span>•</span>
                      <span>{new Date(call.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge variant={call.direction === 'inbound' ? 'primary' : 'success'} size="md">
                    {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
