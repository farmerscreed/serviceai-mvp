'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle, ArrowRight, User, Building, Bot, Phone } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function QuickStartPage() {
  const steps = [
    {
      icon: User,
      title: 'Create Your Account',
      description: 'Sign up and verify your email address',
      details: [
        'Visit the ServiceAI homepage',
        'Click "Get Started" or "Sign Up"',
        'Enter your email and create a password',
        'Verify your email address',
        'Complete your profile information'
      ]
    },
    {
      icon: Building,
      title: 'Set Up Your Organization',
      description: 'Configure your business details and industry',
      details: [
        'Enter your company name and details',
        'Select your industry (HVAC, Plumbing, Electrical, etc.)',
        'Choose your primary language (English/Spanish)',
        'Set your business hours and contact information',
        'Configure your service area'
      ]
    },
    {
      icon: Bot,
      title: 'Create Your AI Assistant',
      description: 'Set up your first AI assistant for customer calls',
      details: [
        'Choose an assistant name and voice',
        'Configure language preferences',
        'Set up your system prompt and personality',
        'Enable industry-specific tools and capabilities',
        'Test your assistant configuration'
      ]
    },
    {
      icon: Phone,
      title: 'Configure Phone & SMS',
      description: 'Set up phone numbers and SMS communication',
      details: [
        'Connect your Twilio account (optional)',
        'Or use free Vapi phone numbers',
        'Configure SMS templates and workflows',
        'Set up emergency contact notifications',
        'Test phone and SMS functionality'
      ]
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quick Start Guide</h1>
          <p className="text-lg text-gray-600">
            Get your ServiceAI platform up and running in minutes. Follow these simple steps to set up your AI assistant and start taking customer calls.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={step.title} padding="lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                        Step {index + 1}
                      </span>
                      <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
                    </div>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <ul className="space-y-2">
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
            )
          })}
        </div>

        <div className="mt-12">
          <Card padding="lg" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader title="Ready to Get Started?" />
            <CardContent>
              <p className="text-gray-700 mb-6">
                Follow the steps above to set up your ServiceAI platform. If you need help with any specific step, 
                check out our detailed guides or contact support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/onboarding">
                  <Button variant="primary" size="lg" icon={<ArrowRight />}>
                    Start Setup Now
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" size="lg">
                    Get Help
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card padding="lg">
            <CardHeader title="Next Steps" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">After Setup</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <Link href="/docs/integrations/calendar-setup" className="text-blue-600 hover:text-blue-700">Connect your calendar</Link></li>
                    <li>• <Link href="/docs/integrations/vapi-setup" className="text-blue-600 hover:text-blue-700">Customize your assistant</Link></li>
                    <li>• <Link href="/assistants" className="text-blue-600 hover:text-blue-700">Test your assistant</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Advanced Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <Link href="/docs/integrations/twilio-setup" className="text-blue-600 hover:text-blue-700">SMS automation</Link></li>
                    <li>• <Link href="/settings/emergency-contacts" className="text-blue-600 hover:text-blue-700">Emergency detection</Link></li>
                    <li>• <Link href="/appointments" className="text-blue-600 hover:text-blue-700">Appointment booking</Link></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
