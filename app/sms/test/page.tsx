'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function SMSTestPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    phone: '',
    language: 'en' as 'en' | 'es',
    templateKey: 'appointment_confirmation',
    testData: {
      name: 'John Doe',
      date: 'March 15, 2025',
      time: '2:00 PM',
      business_phone: '',
      service_type: 'HVAC Maintenance'
    }
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    messageId?: string
    content?: string
    error?: string
  } | null>(null)

  const templateOptions = [
    { value: 'appointment_confirmation', label: 'Appointment Confirmation' },
    { value: 'appointment_reminder', label: 'Appointment Reminder (24h)' },
    { value: 'appointment_reminder_2h', label: 'Appointment Reminder (2h)' },
    { value: 'emergency_alert', label: 'Emergency Alert' },
    { value: 'service_complete', label: 'Service Complete' },
    { value: 'follow_up', label: 'Follow-up Message' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.phone) {
      setResult({
        success: false,
        error: 'Please enter a phone number'
      })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          messageId: data.messageId,
          content: data.content
        })
        
        // Clear phone number on success
        setFormData(prev => ({ ...prev, phone: '' }))
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to send test SMS'
        })
      }
    } catch (error: any) {
      console.error('Error sending test SMS:', error)
      setResult({
        success: false,
        error: error.message || 'Network error'
      })
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-800">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Test SMS Messaging</h1>
          <p className="text-gray-600 mt-2">
            Send test SMS messages to verify your Twilio integration
          </p>
        </div>

        {/* Configuration Check */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Before Testing:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Ensure TWILIO_ACCOUNT_SID is set in .env.local</li>
            <li>Ensure TWILIO_AUTH_TOKEN is set in .env.local</li>
            <li>Ensure TWILIO_PHONE_NUMBER is set in .env.local</li>
            <li>Use a verified phone number (for Twilio trial accounts)</li>
          </ul>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'es' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish (Español)</option>
              </select>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <select
                value={formData.templateKey}
                onChange={(e) => setFormData({ ...formData, templateKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {templateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Data */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Test Data (for placeholders)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.testData.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      testData: { ...formData.testData, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Service Type</label>
                  <input
                    type="text"
                    value={formData.testData.service_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      testData: { ...formData.testData, service_type: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input
                    type="text"
                    value={formData.testData.date}
                    onChange={(e) => setFormData({
                      ...formData,
                      testData: { ...formData.testData, date: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Time</label>
                  <input
                    type="text"
                    value={formData.testData.time}
                    onChange={(e) => setFormData({
                      ...formData,
                      testData: { ...formData.testData, time: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {sending ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Test SMS
                  </>
                )}
              </button>
              
              <Link
                href="/sms/logs"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View Logs
              </Link>
            </div>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 rounded-lg p-6 ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1">
                <h3 className={`font-medium ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'SMS Sent Successfully!' : 'Failed to Send SMS'}
                </h3>
                
                {result.message && (
                  <p className={`mt-1 text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                )}
                
                {result.messageId && (
                  <p className="mt-2 text-xs text-green-700">
                    Message ID: <code className="bg-green-100 px-2 py-1 rounded">{result.messageId}</code>
                  </p>
                )}
                
                {result.content && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-200">
                    <p className="text-xs text-green-700 mb-1 font-medium">Message Content:</p>
                    <p className="text-sm text-gray-900">{result.content}</p>
                  </div>
                )}
                
                {result.error && (
                  <p className="mt-2 text-sm text-red-800">
                    <strong>Error:</strong> {result.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

