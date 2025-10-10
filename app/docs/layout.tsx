import { SparkleNavbar } from '@/components/marketing/SparkleNavbar'
import { SparkleFooter } from '@/components/marketing/SparkleFooter'
import Link from 'next/link'
import { ArrowLeft, Book, Settings, Zap, Database, Calendar, Phone, FileText, Code, HelpCircle } from 'lucide-react'

const docSections = [
  {
    icon: Settings,
    title: 'Getting Started',
    description: 'Quick setup and first steps',
    href: '/docs/setup/quick-start',
    color: 'from-sparkle-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'AI Assistant Setup',
    description: 'Configure your AI assistant with Vapi.ai',
    href: '/docs/integrations/vapi-setup',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Phone,
    title: 'SMS Integration',
    description: 'Set up Twilio SMS for customer communication',
    href: '/docs/integrations/twilio-setup',
    color: 'from-emerald-500 to-sparkle-500',
  },
  {
    icon: Calendar,
    title: 'Calendar Integration',
    description: 'Connect Google Calendar, Outlook, or Calendly',
    href: '/docs/integrations/calendar-setup',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Database,
    title: 'Database Schema',
    description: 'Understanding the data structure',
    href: '/docs/development/database-schema',
    color: 'from-gray-500 to-gray-600',
  },
  {
    icon: Book,
    title: 'Architecture',
    description: 'System architecture and design patterns',
    href: '/docs/development/architecture',
    color: 'from-indigo-500 to-purple-500',
  },
]

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen sparkle-bg-pattern">
      <SparkleNavbar />
      
      <div className="sparkle-container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-sparkle-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/docs" className="hover:text-sparkle-600 transition-colors">Documentation</Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="sparkle-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
                <nav className="space-y-2">
                  <Link
                    href="/docs"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-sparkle-50 hover:text-sparkle-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Overview
                  </Link>
                  <Link
                    href="/docs/setup"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-sparkle-50 hover:text-sparkle-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Setup
                  </Link>
                  <Link
                    href="/docs/integrations"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-sparkle-50 hover:text-sparkle-600 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Integrations
                  </Link>
                  <Link
                    href="/docs/development"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-sparkle-50 hover:text-sparkle-600 transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    Development
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-sparkle-50 hover:text-sparkle-600 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help Center
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="sparkle-card p-8">
              {children}
            </div>
          </div>
        </div>
      </div>

      <SparkleFooter />
    </div>
  )
}
