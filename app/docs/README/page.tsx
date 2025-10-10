'use client'

import Link from 'next/link'
import { ArrowLeft, Book, Settings, Zap, Database, Calendar, Phone, Sparkles, Rocket, Shield, Users } from 'lucide-react'

export default function DocsHomePage() {
  const docSections = [
    {
      icon: Settings,
      title: 'Getting Started',
      description: 'Quick setup and first steps',
      href: '/docs/setup/quick-start',
      gradient: 'from-sparkle-500 to-purple-500',
    },
    {
      icon: Zap,
      title: 'AI Assistant Setup',
      description: 'Configure your AI assistant with Vapi.ai',
      href: '/docs/integrations/vapi-setup',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Phone,
      title: 'SMS Integration',
      description: 'Set up Twilio SMS for customer communication',
      href: '/docs/integrations/twilio-setup',
      gradient: 'from-emerald-500 to-sparkle-500',
    },
    {
      icon: Calendar,
      title: 'Calendar Integration',
      description: 'Connect Google Calendar, Outlook, or Calendly',
      href: '/docs/integrations/calendar-setup',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Database,
      title: 'Database Schema',
      description: 'Understanding the data structure',
      href: '/docs/development/database-schema',
      gradient: 'from-gray-500 to-gray-600',
    },
    {
      icon: Book,
      title: 'Architecture',
      description: 'System architecture and design patterns',
      href: '/docs/development/architecture',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-sparkle-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Book className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-sparkle-500 to-purple-500 rounded-2xl blur opacity-30"></div>
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          ServiceAI Documentation
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          Everything you need to get started with ServiceAI's AI-powered phone assistant platform.
        </p>
      </div>

      {/* Quick Start */}
      <div className="mb-12">
        <div className="sparkle-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-sparkle-500 rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Start Guide</h2>
          <p className="text-gray-600 mb-6">Get your AI assistant up and running in 5 minutes</p>
          <Link
            href="/docs/setup/quick-start"
            className="sparkle-button"
          >
            Start Here
          </Link>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {docSections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group block"
            >
              <div className="sparkle-card p-6 h-full hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sparkle-600 transition-colors">
                    {section.title}
                  </h3>
                </div>
                <p className="text-gray-600">{section.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Support Section */}
      <div className="sparkle-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Need Help?</h2>
        <p className="text-gray-600 mb-6">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/help"
            className="sparkle-button"
          >
            Contact Support
          </Link>
          <Link
            href="/docs/development/architecture"
            className="sparkle-button-secondary"
          >
            View Architecture
          </Link>
        </div>
      </div>
    </div>
  )
}
