'use client'

import Link from 'next/link'
import { ArrowLeft, Book, Settings, Zap, Database, Calendar, Phone } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

export default function DocsHomePage() {
  const docSections = [
    {
      icon: Settings,
      title: 'Getting Started',
      description: 'Quick setup and first steps',
      href: '/docs/setup/quick-start',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Zap,
      title: 'AI Assistant Setup',
      description: 'Configure your AI assistant with Vapi.ai',
      href: '/docs/integrations/vapi-setup',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Phone,
      title: 'SMS Integration',
      description: 'Set up Twilio SMS for customer communication',
      href: '/docs/integrations/twilio-setup',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Calendar,
      title: 'Calendar Integration',
      description: 'Connect Google Calendar, Outlook, or Calendly',
      href: '/docs/integrations/calendar-setup',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: Database,
      title: 'Database Schema',
      description: 'Understanding the data structure',
      href: '/docs/development/database-schema',
      color: 'bg-gray-100 text-gray-600',
    },
    {
      icon: Book,
      title: 'Architecture',
      description: 'System architecture and design patterns',
      href: '/docs/development/architecture',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Book className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ServiceAI Documentation</h1>
            <p className="text-gray-600">Complete guides and technical reference</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.title} href={section.href}>
                <Card hoverable clickable padding="lg">
                  <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-12">
          <Card padding="lg">
            <CardHeader title="Quick Links" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">For New Users</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <Link href="/docs/setup/quick-start" className="text-blue-600 hover:text-blue-700">Quick Start Guide</Link></li>
                    <li>• <Link href="/docs/integrations/vapi-setup" className="text-blue-600 hover:text-blue-700">Setting Up Your First Assistant</Link></li>
                    <li>• <Link href="/docs/integrations/twilio-setup" className="text-blue-600 hover:text-blue-700">SMS Configuration</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">For Developers</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• <Link href="/docs/development/architecture" className="text-blue-600 hover:text-blue-700">System Architecture</Link></li>
                    <li>• <Link href="/docs/development/database-schema" className="text-blue-600 hover:text-blue-700">Database Schema</Link></li>
                    <li>• <Link href="/docs/development/mvp-roadmap" className="text-blue-600 hover:text-blue-700">MVP Roadmap</Link></li>
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
