'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Search, Filter } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SMSHistory from '@/app/sms/history/page'
import SMSTemplates from '@/app/sms/templates/page'
import { useOrganization } from '@/lib/organizations/organization-context'
import { LoadingList, EmptyMessages } from '@/components/ui/LoadingStates'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface SMS {
  id: string
  phone_number: string
  message_type: string
  message_content: string
  status: 'sent' | 'delivered' | 'failed'
  language_code: string
  created_at: string
  delivered_at?: string
}

export default function SMSPage() {
  const { currentOrganization } = useOrganization()
  const [messages, setMessages] = useState<SMS[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (!currentOrganization) return
    loadMessages()
  }, [currentOrganization])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sms/logs?limit=50')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.logs || [])
      }
    } catch (error) {
      console.error('Error loading SMS:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.phone_number.includes(searchQuery) ||
      msg.message_content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || msg.status === filterStatus
    return matchesSearch && matchesStatus
  })

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
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMS Messages</h1>
            <p className="text-gray-600">{currentOrganization?.organization_name}</p>
          </div>
        </div>

        <Card padding="md" className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="history" className="mt-6">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <SMSHistory />
          </TabsContent>
          <TabsContent value="templates">
            <SMSTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
