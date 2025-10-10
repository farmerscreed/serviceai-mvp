'use client'

import { useState, useEffect } from 'react'

interface SettingsFormProps {
  initialSettings: { [key: string]: any }
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'overage_markup_percentage',
          value: parseFloat(settings.overage_markup_percentage),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
      } else {
        setError(data.error || 'Failed to update setting')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">System Settings</h2>
      <form onSubmit={handleSave}>
        <div className="mb-4">
          <label htmlFor="overage_markup_percentage" className="block text-sm font-medium text-gray-700">
            Overage Markup Percentage (%)
          </label>
          <input
            type="number"
            step="0.01"
            name="overage_markup_percentage"
            id="overage_markup_percentage"
            value={settings.overage_markup_percentage || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 0.25 for 25%"
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            This percentage will be added to the base cost of minutes when users purchase additional time. (e.g., 0.25 = 25% markup)
          </p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
