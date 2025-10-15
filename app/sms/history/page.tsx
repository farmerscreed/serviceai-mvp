'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  MessageSquare, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface SMSCommunication {
  id: string
  organization_id: string
  phone_number: string
  message_content: string
  message_type: string
  language_code: string
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'failed' | 'received'
  external_message_id?: string
  template_key?: string
  variables?: Record<string, any>
  error_message?: string
  provider?: string
  cost?: number
  created_at: string
  delivered_at?: string
}

const statusColors = {
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  received: 'bg-purple-100 text-purple-800'
}

const directionColors = {
  inbound: 'bg-purple-100 text-purple-800',
  outbound: 'bg-blue-100 text-blue-800'
}

export default function SMSHistoryPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [communications, setCommunications] = useState<SMSCommunication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('7')

  useEffect(() => {
    if (currentOrganization) {
      loadCommunications()
    }
  }, [currentOrganization, dateRange])

  const loadCommunications = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      // Calculate date range
      const days = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const response = await fetch(`/api/sms/communications?organizationId=${currentOrganization.organization_id}&startDate=${startDate.toISOString()}`)
      const data = await response.json()
      
      if (data.success) {
        setCommunications(data.communications)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load SMS history',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load SMS history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'received':
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A'
    return `$${cost.toFixed(4)}`
  }

  const exportToCSV = () => {
    const csvData = filteredCommunications.map(comm => ({
      Date: new Date(comm.created_at).toLocaleString(),
      Phone: comm.phone_number,
      Direction: comm.direction,
      Status: comm.status,
      Type: comm.message_type,
      Language: comm.language_code,
      Provider: comm.provider || 'N/A',
      Cost: formatCost(comm.cost),
      Message: comm.message_content.replace(/\n/g, ' ')
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sms-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Success',
      description: 'SMS history exported to CSV'
    })
  }

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.phone_number.includes(searchTerm) ||
                         comm.message_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.template_key?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter
    const matchesDirection = directionFilter === 'all' || comm.direction === directionFilter
    return matchesSearch && matchesStatus && matchesDirection
  })

  const stats = {
    total: communications.length,
    sent: communications.filter(c => c.status === 'sent').length,
    delivered: communications.filter(c => c.status === 'delivered').length,
    failed: communications.filter(c => c.status === 'failed').length,
    received: communications.filter(c => c.direction === 'inbound').length,
    totalCost: communications.reduce((sum, c) => sum + (c.cost || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SMS history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS History</h1>
          <p className="text-gray-600">View and manage your SMS communications</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadCommunications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={filteredCommunications.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold text-gray-900">{stats.received}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">💰</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search by phone number, message content, or template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24h</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Communications List */}
      <div className="space-y-4">
        {filteredCommunications.map((comm) => (
          <Card key={comm.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(comm.status)}
                      <Badge className={statusColors[comm.status as keyof typeof statusColors]}>
                        {comm.status}
                      </Badge>
                    </div>
                    <Badge className={directionColors[comm.direction]}>
                      {comm.direction}
                    </Badge>
                    {comm.template_key && (
                      <Badge variant="outline">
                        {comm.template_key}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {comm.language_code.toUpperCase()}
                    </Badge>
                    {comm.provider && (
                      <Badge variant="outline">
                        {comm.provider}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{formatPhoneNumber(comm.phone_number)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(comm.created_at).toLocaleString()}</span>
                    </div>
                    {comm.cost && (
                      <div className="flex items-center space-x-1">
                        <span>💰</span>
                        <span>{formatCost(comm.cost)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {comm.message_content}
                    </p>
                  </div>
                  {comm.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600">
                        <strong>Error:</strong> {comm.error_message}
                      </p>
                    </div>
                  )}
                  {comm.variables && Object.keys(comm.variables).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Template Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(comm.variables).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCommunications.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No SMS communications found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || directionFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'SMS communications will appear here once you start sending messages'
            }
          </p>
        </div>
      )}
    </div>
  )
}
