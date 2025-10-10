'use client'

import { useState } from 'react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

interface DemoCallFormProps {
  industries: { code: string; name: string }[] // Pass available industries
}

export default function DemoCallForm({ industries }: DemoCallFormProps) {
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [industry, setIndustry] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!name || !phoneNumber || !consent) {
      setMessage({ type: 'error', text: 'Please fill in all required fields and agree to the consent.' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/demo-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone_number: phoneNumber, industry, consent }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `Thanks, ${name}! Our AI agent will call you shortly at ${phoneNumber}.` })
        setName('')
        setPhoneNumber('')
        setIndustry('')
        setConsent(false)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to request demo call.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Experience Our AI Agent Now!</h2>
      <p className="text-gray-600 mb-6 text-center">
        Enter your details, and our AI agent will call you to demonstrate our service.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Your Phone Number
          </label>
          <PhoneInput
            defaultCountry="us"
            value={phoneNumber}
            onChange={(phone) => setPhoneNumber(phone)}
            inputClassName="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            countrySelectorStyleProps={{
              buttonClassName: "rounded-l-md border-r-0"
            }}
          />
        </div>
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
            Your Industry (Optional)
          </label>
          <select
            id="industry"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select your industry</option>
            {industries.map((ind) => (
              <option key={ind.code} value={ind.code}>{ind.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          <label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
            By providing my number, I agree to receive a demo call from ServiceAI's AI agent.
          </label>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Calling...' : 'Call Me Now'}
        </button>
      </form>
    </div>
  )
}
