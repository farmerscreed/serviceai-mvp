'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Settings, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CalendarSetupPage() {
  const calendarProviders = [
    {
      name: 'Google Calendar',
      description: 'Most popular calendar integration with Gmail',
      features: ['Real-time sync', 'Multiple calendars', 'Event creation', 'Availability checking'],
      setup: [
        'Go to Google Cloud Console',
        'Create a new project or select existing',
        'Enable Google Calendar API',
        'Create OAuth 2.0 credentials',
        'Configure redirect URIs',
        'Add credentials to ServiceAI'
      ]
    },
    {
      name: 'Microsoft Outlook',
      description: 'Enterprise calendar solution with Office 365',
      features: ['Office 365 integration', 'Shared calendars', 'Meeting rooms', 'Advanced scheduling'],
      setup: [
        'Go to Azure Portal',
        'Register a new application',
        'Configure API permissions for Calendar',
        'Generate client secret',
        'Set up OAuth redirect URIs',
        'Add credentials to ServiceAI'
      ]
    },
    {
      name: 'Calendly',
      description: 'Specialized scheduling platform for appointments',
      features: ['Custom booking pages', 'Automated scheduling', 'Payment integration', 'Team scheduling'],
      setup: [
        'Create Calendly account',
        'Get your Calendly user URI',
        'Configure webhook endpoints',
        'Set up event types',
        'Generate API access token',
        'Connect to ServiceAI'
      ]
    }
  ]

  const features = [
    {
      icon: Calendar,
      title: 'Automatic Booking',
      description: 'AI assistant books appointments directly to your calendar'
    },
    {
      icon: Clock,
      title: 'Availability Sync',
      description: 'Real-time availability checking and conflict prevention'
    },
    {
      icon: Settings,
      title: 'Multi-Platform',
      description: 'Support for Google, Outlook, and Calendly'
    },
    {
      icon: Zap,
      title: 'Smart Scheduling',
      description: 'Intelligent time slot suggestions and optimization'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/docs/README"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Calendar Integration Setup</h1>
          <p className="text-lg text-gray-600">
            Connect your calendar to enable automatic appointment booking, availability checking, and seamless scheduling. 
            ServiceAI supports Google Calendar, Microsoft Outlook, and Calendly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Supported Calendar Providers</h2>
          {calendarProviders.map((provider, index) => (
            <Card key={provider.name} padding="lg">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{provider.name}</h3>
                <p className="text-gray-600 mb-4">{provider.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {provider.features.map((feature) => (
                      <span key={feature} className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Setup Steps:</h4>
                  <ol className="space-y-1">
                    {provider.setup.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                          {stepIndex + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="Appointment Booking Workflow" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Customer Calls</h4>
                    <p className="text-sm text-gray-600">Customer calls your AI assistant to book an appointment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Availability Check</h4>
                    <p className="text-sm text-gray-600">AI checks your calendar for available time slots</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Appointment Creation</h4>
                    <p className="text-sm text-gray-600">AI creates appointment in your calendar automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Confirmation</h4>
                    <p className="text-sm text-gray-600">Customer receives SMS confirmation with appointment details</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card padding="lg" className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Calendar permissions are required for read/write access</li>
                  <li>• OAuth tokens expire and need periodic refresh</li>
                  <li>• Test calendar integration before going live</li>
                  <li>• Monitor API rate limits for your calendar provider</li>
                  <li>• Keep calendar credentials secure and encrypted</li>
                  <li>• Set up proper error handling for calendar failures</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <CardHeader title="Configuration Options" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Business Hours</h4>
                  <p className="text-sm text-gray-600">Set your available hours for appointment booking</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Buffer Time</h4>
                  <p className="text-sm text-gray-600">Add buffer time between appointments</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Advance Booking</h4>
                  <p className="text-sm text-gray-600">Limit how far in advance customers can book</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card padding="lg">
            <CardHeader title="Troubleshooting" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Connection Issues</h4>
                  <p className="text-sm text-gray-600">Check OAuth credentials and permissions</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Sync Problems</h4>
                  <p className="text-sm text-gray-600">Verify calendar API access and rate limits</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Booking Errors</h4>
                  <p className="text-sm text-gray-600">Check calendar permissions and event creation rights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card padding="lg" className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader title="Ready to Connect Your Calendar?" />
            <CardContent>
              <p className="text-gray-700 mb-6">
                Choose your calendar provider and follow the setup instructions above. 
                Once connected, your AI assistant will be able to book appointments automatically.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/settings/phone-calendar">
                  <Button variant="primary" size="lg">
                    Configure Calendar
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" size="lg">
                    Get Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
