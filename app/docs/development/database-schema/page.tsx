'use client'

import Link from 'next/link'
import { ArrowLeft, Database, Table, Key, Users, Bot, Calendar, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

export default function DatabaseSchemaPage() {
  const tables = [
    {
      name: 'organizations',
      description: 'Multi-tenant organization data',
      icon: Users,
      columns: [
        { name: 'id', type: 'UUID', description: 'Primary key' },
        { name: 'name', type: 'VARCHAR', description: 'Organization name' },
        { name: 'industry_code', type: 'VARCHAR', description: 'Industry type' },
        { name: 'phone_config', type: 'JSONB', description: 'Phone configuration' },
        { name: 'calendar_config', type: 'JSONB', description: 'Calendar settings' },
        { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
      ]
    },
    {
      name: 'vapi_assistants',
      description: 'AI assistant configurations',
      icon: Bot,
      columns: [
        { name: 'id', type: 'UUID', description: 'Primary key' },
        { name: 'organization_id', type: 'UUID', description: 'Foreign key to organizations' },
        { name: 'assistant_name', type: 'VARCHAR', description: 'Assistant display name' },
        { name: 'vapi_assistant_id', type: 'VARCHAR', description: 'Vapi.ai assistant ID' },
        { name: 'phone_number', type: 'VARCHAR', description: 'Assigned phone number' },
        { name: 'language', type: 'VARCHAR', description: 'Assistant language' },
        { name: 'industry_code', type: 'VARCHAR', description: 'Industry specialization' },
        { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
      ]
    },
    {
      name: 'appointments',
      description: 'Scheduled appointments and bookings',
      icon: Calendar,
      columns: [
        { name: 'id', type: 'UUID', description: 'Primary key' },
        { name: 'organization_id', type: 'UUID', description: 'Foreign key to organizations' },
        { name: 'customer_id', type: 'UUID', description: 'Foreign key to customers' },
        { name: 'customer_name', type: 'VARCHAR', description: 'Customer name' },
        { name: 'customer_phone', type: 'VARCHAR', description: 'Customer phone number' },
        { name: 'appointment_type', type: 'VARCHAR', description: 'Type of service' },
        { name: 'scheduled_date', type: 'DATE', description: 'Appointment date' },
        { name: 'scheduled_time', type: 'TIME', description: 'Appointment time' },
        { name: 'status', type: 'VARCHAR', description: 'Appointment status' },
        { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
      ]
    },
    {
      name: 'customers',
      description: 'Customer information and history',
      icon: Users,
      columns: [
        { name: 'id', type: 'UUID', description: 'Primary key' },
        { name: 'organization_id', type: 'UUID', description: 'Foreign key to organizations' },
        { name: 'name', type: 'VARCHAR', description: 'Customer name' },
        { name: 'phone_number', type: 'VARCHAR', description: 'Phone number' },
        { name: 'email', type: 'VARCHAR', description: 'Email address' },
        { name: 'address', type: 'TEXT', description: 'Physical address' },
        { name: 'primary_language', type: 'VARCHAR', description: 'Language preference' },
        { name: 'sms_enabled', type: 'BOOLEAN', description: 'SMS communication enabled' },
        { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
      ]
    },
    {
      name: 'call_logs',
      description: 'AI assistant call history and analytics',
      icon: MessageSquare,
      columns: [
        { name: 'id', type: 'UUID', description: 'Primary key' },
        { name: 'organization_id', type: 'UUID', description: 'Foreign key to organizations' },
        { name: 'vapi_call_id', type: 'VARCHAR', description: 'Vapi.ai call ID' },
        { name: 'customer_phone_number', type: 'VARCHAR', description: 'Customer phone' },
        { name: 'call_duration', type: 'INTEGER', description: 'Call duration in seconds' },
        { name: 'status', type: 'VARCHAR', description: 'Call status' },
        { name: 'transcript', type: 'TEXT', description: 'Call transcript' },
        { name: 'sentiment', type: 'DECIMAL', description: 'Sentiment analysis score' },
        { name: 'emergency_detected', type: 'BOOLEAN', description: 'Emergency flag' },
        { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Call timestamp' }
      ]
    },
    {
      name: 'sms_communications',
      description: 'SMS message history and templates',
      icon: MessageSquare,
      columns: [
        { name: 'id', type: 'UUID', description: 'Primary key' },
        { name: 'organization_id', type: 'UUID', description: 'Foreign key to organizations' },
        { name: 'phone_number', type: 'VARCHAR', description: 'Phone number' },
        { name: 'message_content', type: 'TEXT', description: 'SMS content' },
        { name: 'direction', type: 'VARCHAR', description: 'inbound/outbound' },
        { name: 'status', type: 'VARCHAR', description: 'Message status' },
        { name: 'template_key', type: 'VARCHAR', description: 'Template used' },
        { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Message timestamp' }
      ]
    }
  ]

  const relationships = [
    {
      from: 'organizations',
      to: 'vapi_assistants',
      type: 'One-to-Many',
      description: 'One organization can have multiple AI assistants'
    },
    {
      from: 'organizations',
      to: 'customers',
      type: 'One-to-Many',
      description: 'One organization can have multiple customers'
    },
    {
      from: 'organizations',
      to: 'appointments',
      type: 'One-to-Many',
      description: 'One organization can have multiple appointments'
    },
    {
      from: 'customers',
      to: 'appointments',
      type: 'One-to-Many',
      description: 'One customer can have multiple appointments'
    },
    {
      from: 'organizations',
      to: 'call_logs',
      type: 'One-to-Many',
      description: 'One organization can have multiple call logs'
    },
    {
      from: 'organizations',
      to: 'sms_communications',
      type: 'One-to-Many',
      description: 'One organization can have multiple SMS communications'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Database Schema</h1>
          <p className="text-lg text-gray-600">
            Complete overview of the ServiceAI database structure, including all tables, relationships, and data types. 
            This schema supports multi-tenant architecture with proper data isolation.
          </p>
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="Schema Overview" />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Database</h3>
                  <p className="text-sm text-gray-600">PostgreSQL with Supabase</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Security</h3>
                  <p className="text-sm text-gray-600">Row Level Security (RLS)</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Architecture</h3>
                  <p className="text-sm text-gray-600">Multi-tenant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Database Tables</h2>
          {tables.map((table) => {
            const Icon = table.icon
            return (
              <Card key={table.name} padding="lg">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{table.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{table.description}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-900">Column</th>
                        <th className="text-left py-2 font-medium text-gray-900">Type</th>
                        <th className="text-left py-2 font-medium text-gray-900">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column) => (
                        <tr key={column.name} className="border-b border-gray-100">
                          <td className="py-2 font-mono text-blue-600">{column.name}</td>
                          <td className="py-2 font-mono text-gray-600">{column.type}</td>
                          <td className="py-2 text-gray-700">{column.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mb-8">
          <Card padding="lg">
            <CardHeader title="Table Relationships" />
            <CardContent>
              <div className="space-y-4">
                {relationships.map((rel, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {rel.from}
                    </div>
                    <div className="text-sm text-gray-600">
                      {rel.type}
                    </div>
                    <div className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {rel.to}
                    </div>
                    <div className="text-sm text-gray-700 flex-1">
                      {rel.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <CardHeader title="Key Features" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Multi-Tenancy</h4>
                  <p className="text-sm text-gray-600">Complete data isolation between organizations</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Row Level Security</h4>
                  <p className="text-sm text-gray-600">Database-level access control and permissions</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Audit Trail</h4>
                  <p className="text-sm text-gray-600">Comprehensive logging and timestamps</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Scalability</h4>
                  <p className="text-sm text-gray-600">Optimized indexes and query performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card padding="lg">
            <CardHeader title="Data Types" />
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">UUID</h4>
                  <p className="text-sm text-gray-600">Primary keys and foreign key references</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">JSONB</h4>
                  <p className="text-sm text-gray-600">Flexible configuration and metadata storage</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">TIMESTAMPTZ</h4>
                  <p className="text-sm text-gray-600">Timezone-aware timestamps</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">TEXT</h4>
                  <p className="text-sm text-gray-600">Variable-length text fields</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card padding="lg" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader title="Database Management" />
            <CardContent>
              <p className="text-gray-700 mb-6">
                The ServiceAI database is built on PostgreSQL with Supabase, providing robust multi-tenant architecture, 
                real-time capabilities, and comprehensive security through Row Level Security policies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/docs/development/architecture">
                  <Button variant="primary" size="lg">
                    View Architecture
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
