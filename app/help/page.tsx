'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, Book, MessageCircle, Mail, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function HelpPage() {
  const resources = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Comprehensive guides and API reference',
      href: '/docs/README',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: MessageCircle,
      title: 'Community Forum',
      description: 'Connect with other ServiceAI users',
      href: '/community',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Mail,
      title: 'Contact Support',
      description: 'Get help from our support team',
      href: 'mailto:support@serviceai.com',
      color: 'bg-green-100 text-green-600',
    },
  ]

  const quickLinks = [
    { title: 'Getting Started Guide', href: '/docs/setup/quick-start' },
    { title: 'Setting Up Your Assistant', href: '/docs/integrations/vapi-setup' },
    { title: 'Managing Appointments', href: '/docs/development/mvp-roadmap' },
    { title: 'SMS Integration', href: '/docs/integrations/twilio-setup' },
    { title: 'Emergency Detection', href: '/docs/development/architecture' },
    { title: 'Database Schema', href: '/docs/development/database-schema' },
  ]

  const faqs = [
    {
      question: 'How do I create my first AI assistant?',
      answer: 'Navigate to Settings > My Assistant and click "Create New Assistant". Follow the wizard to configure your assistant\'s language, voice, and capabilities.',
    },
    {
      question: 'Can my assistant handle multiple languages?',
      answer: 'Yes! ServiceAI supports both English and Spanish. You can create separate assistants for each language or use automatic language detection.',
    },
    {
      question: 'How does emergency detection work?',
      answer: 'Your AI assistant uses industry-specific keywords to detect emergency situations. When detected, it automatically notifies your emergency contacts via SMS and phone.',
    },
    {
      question: 'How do I integrate my calendar?',
      answer: 'Go to Settings > Phone & Calendar and connect your Google Calendar, Outlook, or Calendly account. Your assistant will then check availability and book appointments automatically.',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-600">Get answers and assistance</p>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {resources.map((resource) => {
            const Icon = resource.icon
            return (
              <Link key={resource.title} href={resource.href}>
                <Card hoverable clickable padding="lg">
                  <div className={`w-12 h-12 ${resource.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Links */}
        <Card padding="lg" className="mb-8">
          <CardHeader title="Quick Links" description="Popular help articles" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.title}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card padding="lg">
          <CardHeader title="Frequently Asked Questions" />
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Can't find what you're looking for?</p>
          <Button variant="primary" size="lg" icon={<Mail />}>
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}
