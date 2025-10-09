'use client'

import Link from 'next/link'
import { ArrowLeft, MessageSquare, Phone, Settings, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function TwilioSetupPage() {
  const setupSteps = [
    {
      title: 'Create Twilio Account',
      description: 'Sign up for a Twilio account and get your credentials',
      details: [
        'Visit twilio.com and create an account',
        'Verify your phone number',
        'Navigate to Console Dashboard',
        'Find your Account SID and Auth Token',
        'Copy these credentials securely'
      ]
    },
    {
      title: 'Configure Environment Variables',
      description: 'Add your Twilio credentials to ServiceAI',
      details: [
        'Open your .env.local file',
        'Add TWILIO_ACCOUNT_SID=your_account_sid',
        'Add TWILIO_AUTH_TOKEN=your_auth_token',
        'Add TWILIO_PHONE_NUMBER=your_phone_number',
        'Restart your development server'
      ]
    },
    {
      title: 'Set Up Phone Numbers',
      description: 'Configure phone numbers for SMS and voice',
      details: [
        'Purchase phone numbers in Twilio Console',
        'Configure webhook URLs for incoming messages',
        'Set up SMS templates and workflows',
        'Test phone number functionality',
        'Configure emergency notification settings'
      ]
    },
    {
      title: 'SMS Templates & Workflows',
      description: 'Create automated SMS messages for customers',
      details: [
        'Design appointment confirmation messages',
        'Set up reminder notifications',
        'Configure follow-up messages',
        'Create emergency alert templates',
        'Test SMS delivery and formatting'
      ]
    }
  ]

  const features = [
    {
      icon: MessageSquare,
      title: 'SMS Automation',
      description: 'Automated appointment confirmations and reminders'
    },
    {
      icon: Phone,
      title: 'Voice Integration',
      description: 'High-quality voice calls and call forwarding'
    },
    {
      icon: Settings,
      title: 'Customizable',
      description: 'Flexible templates and workflow configuration'
    },
    {
      icon: Zap,
      title: 'Real-time',
      description: 'Instant message delivery and status tracking'
    }
  ]

  const smsTemplates = [
    {
      type: 'Appointment Confirmation',
      template: 'Hi {name}! Your {service_type} appointment is confirmed for {date} at {time}. We\'ll see you soon!',
      variables: ['name', 'service_type', 'date', 'time']
    },
    {
      type: 'Reminder',
      template: 'Reminder: You have a {service_type} appointment tomorrow at {time}. Please reply CONFIRM to confirm or RESCHEDULE to reschedule.',
      variables: ['service_type', 'time']
    },
    {
      type: 'Follow-up',
      template: 'Thank you for choosing us! How was your {service_type} service? Reply with a rating 1-5.',
      variables: ['service_type']
    },
    {
      type: 'Emergency Alert',
      template: 'URGENT: Emergency detected for {customer_name}. Please contact immediately at {phone_number}.',
      variables: ['customer_name', 'phone_number']
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Twilio SMS Integration Setup</h1>
          <p className="text-lg text-gray-600">
            Learn how to set up Twilio for SMS automation, appointment reminders, and customer communication. 
            This integration enables automated messaging workflows for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
          <h2 className="text-2xl font-bold text-gray-900">Setup Instructions</h2>
          {setupSteps.map((step, index) => (
            <Card key={step.title} padding="lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  <ul className="space-y-1">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="SMS Templates" description="Pre-built message templates for common scenarios" />
            <CardContent>
              <div className="space-y-4">
                {smsTemplates.map((template, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.type}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {template.variables.length} variables
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 font-mono bg-gray-50 p-2 rounded">
                      {template.template}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <span key={variable} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card padding="lg" className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Considerations</h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Twilio charges per SMS sent - monitor your usage</li>
                  <li>• Follow SMS compliance regulations (TCPA, CAN-SPAM)</li>
                  <li>• Always include opt-out instructions in messages</li>
                  <li>• Test SMS delivery in different regions</li>
                  <li>• Keep your Twilio credentials secure</li>
                  <li>• Set up webhook endpoints for delivery status</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <CardHeader title="SMS Workflows" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Appointment Flow</h4>
                  <p className="text-sm text-gray-600">Confirmation → Reminder → Follow-up</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Emergency Flow</h4>
                  <p className="text-sm text-gray-600">Detection → Alert → Escalation</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Marketing Flow</h4>
                  <p className="text-sm text-gray-600">Promotions → Follow-up → Feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card padding="lg">
            <CardHeader title="Best Practices" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Message Timing</h4>
                  <p className="text-sm text-gray-600">Send during business hours for better engagement</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Personalization</h4>
                  <p className="text-sm text-gray-600">Use customer names and service details</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Compliance</h4>
                  <p className="text-sm text-gray-600">Include opt-out and company identification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card padding="lg" className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader title="Ready to Set Up Twilio?" />
            <CardContent>
              <p className="text-gray-700 mb-6">
                Follow the setup instructions above to enable SMS automation for your business. 
                Start with basic templates and customize them for your specific needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/settings/phone-calendar">
                  <Button variant="primary" size="lg">
                    Configure SMS Settings
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
