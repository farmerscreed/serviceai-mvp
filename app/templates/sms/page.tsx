'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  ArrowLeft, 
  MessageSquare, 
  Plus,
  Edit,
  Eye,
  Languages,
  Save,
  X
} from 'lucide-react'

interface SMSTemplate {
  id: string
  key: string
  name: string
  content: {
    en: string
    es: string
  }
  variables: string[]
  category: 'appointment' | 'emergency' | 'general'
}

const MOCK_TEMPLATES: SMSTemplate[] = [
  {
    id: '1',
    key: 'appointment_confirmation',
    name: 'Appointment Confirmation',
    content: {
      en: 'Hi {name}! Your {service_type} is confirmed for {date} at {time}. Address: {address}. Call {business_phone} with questions.',
      es: '¡Hola {name}! Su {service_type} está confirmado para {date} a las {time}. Dirección: {address}. Llame {business_phone} con preguntas.'
    },
    variables: ['name', 'service_type', 'date', 'time', 'address', 'business_phone'],
    category: 'appointment'
  },
  {
    id: '2',
    key: 'appointment_reminder',
    name: 'Appointment Reminder',
    content: {
      en: 'Reminder: Your {service_type} is tomorrow at {time}. Address: {address}. Call {business_phone} to reschedule.',
      es: 'Recordatorio: Su {service_type} es mañana a las {time}. Dirección: {address}. Llame {business_phone} para reprogramar.'
    },
    variables: ['service_type', 'time', 'address', 'business_phone'],
    category: 'appointment'
  },
  {
    id: '3',
    key: 'emergency_alert',
    name: 'Emergency Alert (Internal)',
    content: {
      en: 'URGENT: Emergency from {customer_name} at {address}. Issue: {description}. Contact: {phone}',
      es: 'URGENTE: Emergencia de {customer_name} en {address}. Problema: {description}. Contacto: {phone}'
    },
    variables: ['customer_name', 'address', 'description', 'phone'],
    category: 'emergency'
  },
  {
    id: '4',
    key: 'emergency_confirmation',
    name: 'Emergency Confirmation (Customer)',
    content: {
      en: 'Emergency service dispatched. Technician {technician_name} will arrive within 30-60 minutes. Call {business_phone} for updates.',
      es: 'Servicio de emergencia despachado. Técnico {technician_name} llegará en 30-60 minutos. Llame {business_phone} para actualizaciones.'
    },
    variables: ['technician_name', 'business_phone'],
    category: 'emergency'
  },
  {
    id: '5',
    key: 'status_update',
    name: 'Status Update',
    content: {
      en: 'Update: Your technician {technician_name} is en route. ETA: {eta}. Call {business_phone} if you have questions.',
      es: 'Actualización: Su técnico {technician_name} está en camino. Tiempo estimado: {eta}. Llame {business_phone} si tiene preguntas.'
    },
    variables: ['technician_name', 'eta', 'business_phone'],
    category: 'general'
  },
  {
    id: '6',
    key: 'follow_up',
    name: 'Follow-up',
    content: {
      en: 'Thank you for choosing {business_name}! How was your service? Rate us: {rating_link}. Schedule maintenance: {business_phone}',
      es: '¡Gracias por elegir {business_name}! ¿Cómo fue su servicio? Califíquenos: {rating_link}. Programe mantenimiento: {business_phone}'
    },
    variables: ['business_name', 'rating_link', 'business_phone'],
    category: 'general'
  }
]

export default function SMSTemplatesPage() {
  const { currentOrganization } = useOrganization()
  const [templates] = useState<SMSTemplate[]>(MOCK_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null)
  const [previewLang, setPreviewLang] = useState<'en' | 'es'>('en')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredTemplates = templates.filter(t => 
    activeCategory === 'all' || t.category === activeCategory
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'appointment': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'emergency': return 'bg-red-50 text-red-700 border-red-200'
      case 'general': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const calculateCharCount = (text: string) => {
    return text.length
  }

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

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SMS Templates</h1>
              <p className="text-gray-600">{currentOrganization?.organization_name}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'appointment', 'emergency', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Language Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPreviewLang('en')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    previewLang === 'en'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setPreviewLang('es')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    previewLang === 'es'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🇪🇸 Español
                </button>
              </div>

              {/* Template Content */}
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-800 leading-relaxed">{template.content[previewLang]}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {calculateCharCount(template.content[previewLang])} characters
                  {calculateCharCount(template.content[previewLang]) > 160 && (
                    <span className="text-amber-600 ml-2">
                      ⚠️ May be split into multiple SMS
                    </span>
                  )}
                </div>
              </div>

              {/* Variables */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Variables:</div>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-mono"
                    >
                      {'{'}{variable}{'}'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Template</h2>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Languages className="w-4 h-4 inline mr-1" />
                    English Version
                  </label>
                  <textarea
                    value={editingTemplate.content.en}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: { ...editingTemplate.content, en: e.target.value } })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {calculateCharCount(editingTemplate.content.en)} characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Languages className="w-4 h-4 inline mr-1" />
                    Spanish Version
                  </label>
                  <textarea
                    value={editingTemplate.content.es}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: { ...editingTemplate.content, es: e.target.value } })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {calculateCharCount(editingTemplate.content.es)} characters
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
