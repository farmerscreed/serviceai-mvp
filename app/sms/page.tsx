'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  Smartphone, 
  MessageSquare, 
  Settings, 
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ArrowRight
} from 'lucide-react'

interface SMSStats {
  totalMessages: number
  deliveredMessages: number
  failedMessages: number
  pendingMessages: number
  totalCost: number
  templatesCount: number
  lastMessageDate?: string
}

export default function SMSPage() {
  const { currentOrganization } = useOrganization()
  const [stats, setStats] = useState<SMSStats>({
    totalMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    pendingMessages: 0,
    totalCost: 0,
    templatesCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization) {
      loadStats()
    }
  }, [currentOrganization])

  const loadStats = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      // In a real implementation, this would load from your database
      // For now, we'll use mock data
      setStats({
        totalMessages: 1247,
        deliveredMessages: 1189,
        failedMessages: 23,
        pendingMessages: 35,
        totalCost: 9.36,
        templatesCount: 14,
        lastMessageDate: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to load SMS stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Create Template',
      description: 'Create a new SMS template for your messages',
      href: '/sms/templates',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View History',
      description: 'Check your SMS message history and analytics',
      href: '/sms/history',
      icon: MessageSquare,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Configure Settings',
      description: 'Set up SMS providers and automation',
      href: '/sms/settings',
      icon: Settings,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  const recentTemplates = [
    { key: 'appointment_confirmation', name: 'Appointment Confirmation', usage: 45, lastUsed: '2 hours ago' },
    { key: 'appointment_reminder', name: 'Appointment Reminder', usage: 23, lastUsed: '1 day ago' },
    { key: 'emergency_alert', name: 'Emergency Alert', usage: 2, lastUsed: '3 days ago' },
    { key: 'service_completion', name: 'Service Completion', usage: 18, lastUsed: '1 day ago' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SMS dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Management</h1>
          <p className="text-gray-600">Manage your SMS communications, templates, and settings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            SMS Active
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveredMessages.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {((stats.deliveredMessages / stats.totalMessages) * 100).toFixed(1)}% success rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  ${(stats.totalCost / stats.totalMessages).toFixed(4)} per message
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Templates</span>
              </CardTitle>
              <Link href="/activity/sms">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>
              Your most frequently used SMS templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTemplates.map((template) => (
                <div key={template.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">Used {template.usage} times</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{template.lastUsed}</p>
                    <Badge variant="outline" className="text-xs">
                      {template.key}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SMS Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>SMS Features</span>
            </CardTitle>
            <CardDescription>
              Available SMS capabilities and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Multi-Provider Support</h4>
                  <p className="text-sm text-gray-600">Twilio + Vonage fallback for reliability</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Multi-Language Templates</h4>
                  <p className="text-sm text-gray-600">English and Spanish support</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Emergency Alerts</h4>
                  <p className="text-sm text-gray-600">Automatic emergency SMS broadcasting</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Template Management</h4>
                  <p className="text-sm text-gray-600">14 pre-built templates ready to use</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Delivery Tracking</h4>
                  <p className="text-sm text-gray-600">Real-time delivery status and analytics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with SMS</CardTitle>
          <CardDescription>
            Set up your SMS system in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Configure Providers</h3>
              <p className="text-sm text-gray-600 mb-4">
                Set up your Twilio and Vonage credentials in SMS Settings
              </p>
              <Link href="/settings/sms">
                <Button variant="outline" size="sm">
                  Go to Settings
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Review Templates</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check out the 14 pre-built templates and customize as needed
              </p>
              <Link href="/activity/sms">
                <Button variant="outline" size="sm">
                  View Templates
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Test & Monitor</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send test messages and monitor delivery in SMS History
              </p>
              <Link href="/activity/sms">
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
