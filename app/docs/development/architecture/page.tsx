'use client'

import Link from 'next/link'
import { ArrowLeft, Layers, Database, Globe, Smartphone, Bot, Shield, Zap } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

export default function ArchitecturePage() {
  const layers = [
    {
      name: 'Frontend Layer',
      icon: Globe,
      description: 'Next.js React application with TypeScript',
      components: [
        'Next.js 15 with App Router',
        'React 18 with Server Components',
        'Tailwind CSS for styling',
        'shadcn/ui component library',
        'Responsive design for mobile/desktop'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'API Layer',
      icon: Zap,
      description: 'RESTful API endpoints and middleware',
      components: [
        'Next.js API Routes',
        'Supabase client integration',
        'Authentication middleware',
        'Request validation and sanitization',
        'Error handling and logging'
      ],
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Database Layer',
      icon: Database,
      description: 'PostgreSQL with Supabase backend',
      components: [
        'PostgreSQL database',
        'Row Level Security (RLS)',
        'Real-time subscriptions',
        'Database migrations',
        'Backup and recovery'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Integration Layer',
      icon: Bot,
      description: 'Third-party service integrations',
      components: [
        'Vapi.ai for AI voice assistants',
        'Twilio for SMS and phone services',
        'Google Calendar API',
        'Microsoft Outlook API',
        'Calendly integration'
      ],
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const features = [
    {
      icon: Shield,
      title: 'Multi-Tenant Architecture',
      description: 'Complete data isolation between organizations with Row Level Security'
    },
    {
      icon: Smartphone,
      title: 'Responsive Design',
      description: 'Mobile-first design that works seamlessly across all devices'
    },
    {
      icon: Bot,
      title: 'AI Integration',
      description: 'Advanced AI voice assistants with natural language processing'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Live data synchronization and real-time notifications'
    }
  ]

  const techStack = [
    {
      category: 'Frontend',
      technologies: [
        { name: 'Next.js 15', description: 'React framework with App Router' },
        { name: 'TypeScript', description: 'Type-safe JavaScript' },
        { name: 'Tailwind CSS', description: 'Utility-first CSS framework' },
        { name: 'shadcn/ui', description: 'Component library' },
        { name: 'Lucide React', description: 'Icon library' }
      ]
    },
    {
      category: 'Backend',
      technologies: [
        { name: 'Supabase', description: 'Backend-as-a-Service' },
        { name: 'PostgreSQL', description: 'Relational database' },
        { name: 'Row Level Security', description: 'Database security' },
        { name: 'Edge Functions', description: 'Serverless functions' },
        { name: 'Real-time', description: 'Live data synchronization' }
      ]
    },
    {
      category: 'Integrations',
      technologies: [
        { name: 'Vapi.ai', description: 'AI voice assistant platform' },
        { name: 'Twilio', description: 'SMS and voice services' },
        { name: 'Google Calendar', description: 'Calendar integration' },
        { name: 'Microsoft Outlook', description: 'Enterprise calendar' },
        { name: 'Calendly', description: 'Scheduling platform' }
      ]
    },
    {
      category: 'DevOps',
      technologies: [
        { name: 'Vercel', description: 'Deployment platform' },
        { name: 'GitHub', description: 'Version control' },
        { name: 'Environment Variables', description: 'Configuration management' },
        { name: 'Database Migrations', description: 'Schema versioning' },
        { name: 'Monitoring', description: 'Error tracking and analytics' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/docs/README"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Architecture</h1>
          <p className="text-lg text-gray-600">
            Comprehensive overview of the ServiceAI platform architecture, including technology stack, 
            system layers, and integration patterns. Built for scalability, security, and performance.
          </p>
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="Architecture Overview" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">System Layers</h2>
          {layers.map((layer, index) => {
            const Icon = layer.icon
            return (
              <Card key={layer.name} padding="lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 bg-gradient-to-br ${layer.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                        Layer {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900">{layer.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{layer.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {layer.components.map((component) => (
                        <div key={component} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          {component}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="Technology Stack" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {techStack.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{category.category}</h3>
                    <div className="space-y-2">
                      {category.technologies.map((tech) => (
                        <div key={tech.name} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <div className="font-medium text-gray-900">{tech.name}</div>
                            <div className="text-sm text-gray-600">{tech.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="Data Flow Architecture" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">User Interaction</h4>
                    <p className="text-sm text-gray-600">User interacts with Next.js frontend through web browser or mobile device</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">API Processing</h4>
                    <p className="text-sm text-gray-600">Next.js API routes handle requests, validate data, and process business logic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Database Operations</h4>
                    <p className="text-sm text-gray-600">Supabase handles database operations with RLS for multi-tenant security</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">External Integrations</h4>
                    <p className="text-sm text-gray-600">Third-party services (Vapi, Twilio, Calendar) provide specialized functionality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                    <p className="text-sm text-gray-600">Supabase real-time subscriptions push updates to connected clients</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <CardHeader title="Security Features" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Row Level Security</h4>
                  <p className="text-sm text-gray-600">Database-level access control for multi-tenant data isolation</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Authentication</h4>
                  <p className="text-sm text-gray-600">Supabase Auth with JWT tokens and session management</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Input Validation</h4>
                  <p className="text-sm text-gray-600">Comprehensive validation and sanitization of all user inputs</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">API Security</h4>
                  <p className="text-sm text-gray-600">Rate limiting, CORS, and secure API endpoints</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card padding="lg">
            <CardHeader title="Performance Optimizations" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Server Components</h4>
                  <p className="text-sm text-gray-600">Next.js Server Components for optimal rendering performance</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Database Indexing</h4>
                  <p className="text-sm text-gray-600">Optimized indexes for fast query performance</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Caching</h4>
                  <p className="text-sm text-gray-600">Strategic caching at multiple levels for reduced latency</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">CDN</h4>
                  <p className="text-sm text-gray-600">Global content delivery for fast asset loading</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card padding="lg" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader title="Architecture Benefits" />
            <CardContent>
              <p className="text-gray-700 mb-6">
                The ServiceAI architecture is designed for scalability, security, and maintainability. 
                Built on modern technologies with a focus on developer experience and user performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/docs/development/database-schema">
                  <Button variant="primary" size="lg">
                    View Database Schema
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
