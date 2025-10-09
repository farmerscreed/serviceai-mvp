'use client'

import Link from 'next/link'
import { ArrowLeft, Bot, Phone, Settings, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function VapiSetupPage() {
  const setupSteps = [
    {
      title: 'Get Vapi.ai API Key',
      description: 'Sign up for a Vapi.ai account and get your API credentials',
      details: [
        'Visit vapi.ai and create an account',
        'Navigate to your dashboard',
        'Go to API Keys section',
        'Generate a new API key',
        'Copy the key and keep it secure'
      ]
    },
    {
      title: 'Configure Environment Variables',
      description: 'Add your Vapi credentials to your ServiceAI configuration',
      details: [
        'Open your .env.local file',
        'Add VAPI_API_KEY=your_api_key_here',
        'Add VAPI_BASE_URL=https://api.vapi.ai',
        'Restart your development server',
        'Verify the connection in settings'
      ]
    },
    {
      title: 'Create Your First Assistant',
      description: 'Set up an AI assistant through the ServiceAI interface',
      details: [
        'Go to Settings > My Assistant',
        'Click "Create New Assistant"',
        'Choose your assistant name and voice',
        'Configure the system prompt',
        'Select industry-specific tools',
        'Test the assistant configuration'
      ]
    },
    {
      title: 'Phone Number Assignment',
      description: 'Get a phone number for your assistant to receive calls',
      details: [
        'ServiceAI will automatically provision a phone number',
        'You can use free Vapi numbers (up to 10)',
        'Or connect your own Twilio account',
        'Phone numbers are assigned per organization',
        'Test the phone number with a call'
      ]
    }
  ]

  const features = [
    {
      icon: Bot,
      title: 'AI Voice Assistant',
      description: 'Natural conversation with customers using advanced AI'
    },
    {
      icon: Phone,
      title: 'Phone Integration',
      description: 'Receive and make calls with real phone numbers'
    },
    {
      icon: Settings,
      title: 'Customizable',
      description: 'Configure voice, personality, and industry-specific tools'
    },
    {
      icon: Zap,
      title: 'Real-time',
      description: 'Instant responses and real-time conversation handling'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vapi.ai Integration Setup</h1>
          <p className="text-lg text-gray-600">
            Learn how to set up and configure Vapi.ai for your AI voice assistants. This integration powers all voice interactions with your customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} padding="lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
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
          <Card padding="lg" className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Keep your Vapi API key secure and never share it publicly</li>
                  <li>• Free Vapi accounts include up to 10 phone numbers</li>
                  <li>• Phone numbers are automatically assigned to your organization</li>
                  <li>• Test your assistant thoroughly before going live</li>
                  <li>• Monitor usage to stay within your plan limits</li>
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
                  <h4 className="font-medium text-gray-900 mb-1">Voice Settings</h4>
                  <p className="text-sm text-gray-600">Choose from multiple voice options and adjust speech rate</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">System Prompts</h4>
                  <p className="text-sm text-gray-600">Customize your assistant's personality and responses</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Industry Tools</h4>
                  <p className="text-sm text-gray-600">Enable industry-specific capabilities and workflows</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card padding="lg">
            <CardHeader title="Testing & Troubleshooting" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Test Calls</h4>
                  <p className="text-sm text-gray-600">Use the test call feature to verify your setup</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Call Logs</h4>
                  <p className="text-sm text-gray-600">Monitor all calls and conversations in real-time</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Error Handling</h4>
                  <p className="text-sm text-gray-600">Check logs for any configuration issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card padding="lg" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader title="Ready to Set Up Vapi?" />
            <CardContent>
              <p className="text-gray-700 mb-6">
                Follow the setup instructions above to get your AI assistant running. 
                Need help? Check out our troubleshooting guide or contact support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/settings/assistant">
                  <Button variant="primary" size="lg">
                    Configure Assistant
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
