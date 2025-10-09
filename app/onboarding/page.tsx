'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Check } from 'lucide-react'

interface OnboardingData {
  organizationName: string
  organizationSlug: string
  industryCode: string
  primaryLanguage: string
  timezone: string
  businessPhone: string
  businessAddress: string
  assistantName: string
  assistantLanguage: string
  createAssistant: boolean
}

const INDUSTRIES = [
  { code: 'hvac', name: 'HVAC & Climate Control', icon: '❄️', description: 'Heating, cooling, and ventilation services' },
  { code: 'plumbing', name: 'Plumbing & Water Systems', icon: '🔧', description: 'Plumbing repairs, installations, and maintenance' },
  { code: 'electrical', name: 'Electrical & Power Systems', icon: '⚡', description: 'Electrical repairs, installations, and safety' },
  { code: 'medical', name: 'Medical & Healthcare', icon: '🏥', description: 'Healthcare appointments and patient management' },
  { code: 'veterinary', name: 'Veterinary Services', icon: '🐾', description: 'Pet care and veterinary appointments' },
  { code: 'property', name: 'Property Management', icon: '🏢', description: 'Property tours and tenant management' },
]

const STEPS = [
  { id: 1, name: 'Organization', description: 'Basic information' },
  { id: 2, name: 'Industry', description: 'Choose your industry' },
  { id: 3, name: 'Language', description: 'Communication preferences' },
  { id: 4, name: 'Assistant', description: 'Create AI assistant' },
  { id: 5, name: 'Complete', description: 'Finish setup' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    organizationName: '',
    organizationSlug: '',
    industryCode: '',
    primaryLanguage: 'en',
    timezone: 'America/New_York',
    businessPhone: '',
    businessAddress: '',
    assistantName: '',
    assistantLanguage: 'en',
    createAssistant: true,
  })

  const generateSlug = (name: string) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Add random suffix to avoid conflicts
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    return baseSlug ? `${baseSlug}-${randomSuffix}` : `org-${randomSuffix}`
  }

  const handleNameChange = (name: string) => {
    setData({
      ...data,
      organizationName: name,
      organizationSlug: generateSlug(name),
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create organization
      const orgRes = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.organizationName,
          slug: data.organizationSlug,
          industry_code: data.industryCode,
          primary_language: data.primaryLanguage,
          timezone: data.timezone,
        }),
      })

      if (!orgRes.ok) {
        const errData = await orgRes.json()
        throw new Error(errData.error || 'Failed to create organization')
      }

      const { organization } = await orgRes.json()

      // Seed templates if not already done
      await fetch('/api/templates/seed', { method: 'POST' })

      // Create assistant if requested
      if (data.createAssistant && data.assistantName) {
        const assistantRes = await fetch('/api/assistants/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: organization.id,
            assistantName: data.assistantName,
            industryCode: data.industryCode,
            language: data.assistantLanguage,
            businessName: data.organizationName,
            businessPhone: data.businessPhone,
          }),
        })

        if (!assistantRes.ok) {
          const errData = await assistantRes.json()
          console.warn('Failed to create assistant:', errData.error)
          // Don't fail the whole onboarding for assistant creation failure
        }
      }

      setCurrentStep(5)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = data.organizationName.length > 0 && data.organizationSlug.length > 0
  const canProceedStep2 = data.industryCode.length > 0
  const canProceedStep3 = data.primaryLanguage.length > 0
  const canProceedStep4 = !data.createAssistant || (data.assistantName.length > 0 && data.assistantLanguage.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to ServiceAI</h1>
          <p className="text-lg text-gray-600">Let's set up your organization in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-6 h-6" /> : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 rounded transition-all ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Organization Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Information</h2>
                <p className="text-gray-600">Tell us about your business</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                <input
                  type="text"
                  value={data.organizationName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Acme HVAC Services"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">serviceai.com/</span>
                  <input
                    type="text"
                    value={data.organizationSlug}
                    onChange={(e) => setData({ ...data, organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="acme-hvac-a1b2"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
                <p className="mt-1 text-xs text-gray-500">Auto-generated with a unique suffix. You can edit if needed.</p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedStep1}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Industry Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Industry</h2>
                <p className="text-gray-600">Select the industry that best matches your business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry.code}
                    onClick={() => setData({ ...data, industryCode: industry.code })}
                    className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                      data.industryCode === industry.code
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">{industry.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{industry.name}</h3>
                    <p className="text-sm text-gray-600">{industry.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedStep2}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Language & Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Communication Preferences</h2>
                <p className="text-gray-600">Set your primary language and timezone</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setData({ ...data, primaryLanguage: 'en' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.primaryLanguage === 'en'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🇺🇸</div>
                    <div className="font-semibold text-gray-900">English</div>
                    <div className="text-sm text-gray-600">Primary language</div>
                  </button>
                  <button
                    onClick={() => setData({ ...data, primaryLanguage: 'es' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      data.primaryLanguage === 'es'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🇪🇸</div>
                    <div className="font-semibold text-gray-900">Español</div>
                    <div className="text-sm text-gray-600">Idioma principal</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={data.timezone}
                  onChange={(e) => setData({ ...data, timezone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Error</h4>
                      <p className="text-sm text-red-700">{error}</p>
                      {error.includes('slug') && (
                        <p className="text-xs text-red-600 mt-2">Try clicking the name field again to generate a new slug.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!canProceedStep3 || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Assistant Setup */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your AI Assistant</h2>
                <p className="text-gray-600">Set up your AI phone assistant to handle customer calls</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-xl">🤖</div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">What is an AI Assistant?</h3>
                    <p className="text-sm text-blue-800">
                      Your AI assistant will answer phone calls, book appointments, handle emergencies, 
                      and provide customer service 24/7 in {data.primaryLanguage === 'en' ? 'English' : 'Spanish'}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Create AI Assistant Now?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setData({ ...data, createAssistant: true })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        data.createAssistant
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">✅</div>
                      <div className="font-semibold text-gray-900">Yes, Create Now</div>
                      <div className="text-sm text-gray-600">Set up assistant immediately</div>
                    </button>
                    <button
                      onClick={() => setData({ ...data, createAssistant: false })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !data.createAssistant
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">⏰</div>
                      <div className="font-semibold text-gray-900">Skip for Now</div>
                      <div className="text-sm text-gray-600">Create later from dashboard</div>
                    </button>
                  </div>
                </div>

                {data.createAssistant && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assistant Name
                      </label>
                      <input
                        type="text"
                        value={data.assistantName}
                        onChange={(e) => setData({ ...data, assistantName: e.target.value })}
                        placeholder={`e.g., ${data.organizationName} Assistant`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This name will be used in the assistant's voice and responses
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assistant Language
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setData({ ...data, assistantLanguage: 'en' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            data.assistantLanguage === 'en'
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">🇺🇸</div>
                          <div className="font-semibold text-gray-900">English</div>
                          <div className="text-sm text-gray-600">Primary language</div>
                        </button>
                        <button
                          onClick={() => setData({ ...data, assistantLanguage: 'es' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            data.assistantLanguage === 'es'
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">🇪🇸</div>
                          <div className="font-semibold text-gray-900">Español</div>
                          <div className="text-sm text-gray-600">Idioma principal</div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-green-600 text-xl">📞</div>
                        <div>
                          <h3 className="font-semibold text-green-900 mb-1">What Your Assistant Will Do</h3>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Answer calls professionally in {data.assistantLanguage === 'en' ? 'English' : 'Spanish'}</li>
                            <li>• Book appointments automatically</li>
                            <li>• Detect emergencies and escalate</li>
                            <li>• Provide business information</li>
                            <li>• Transfer to humans when needed</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Error</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedStep4 || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">All Set!</h2>
                <p className="text-lg text-gray-600">Your organization has been created successfully</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">Setup Complete:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Organization "{data.organizationName}" created</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Industry templates loaded for {data.industryCode}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Configured for {data.primaryLanguage === 'en' ? 'English' : 'Spanish'}</span>
                  </li>
                  {data.createAssistant && data.assistantName && (
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>AI Assistant "{data.assistantName}" created</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="mr-2">→</span>
                    <span>Configure phone numbers and emergency contacts from the dashboard</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

