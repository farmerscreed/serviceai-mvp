'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrganizationSettingsPage() {
  const { user } = useAuth()
  const { currentOrganization, refreshOrganizations } = useOrganization()
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [industryCode, setIndustryCode] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState('en')
  const [timezone, setTimezone] = useState('America/New_York')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canEdit = currentOrganization && ['owner', 'admin'].includes(currentOrganization.user_role)

  useEffect(() => {
    if (currentOrganization) {
      // Load organization settings from Supabase
      loadOrganizationSettings()
    }
  }, [currentOrganization])

  const loadOrganizationSettings = async () => {
    // TODO: Load from Supabase once we have the full organization object
    // For now, use what we have from currentOrganization
    if (currentOrganization) {
      setName(currentOrganization.organization_name)
      setSlug(currentOrganization.organization_slug)
      setIndustryCode(currentOrganization.industry_code || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/organizations/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization?.organization_id,
          name,
          slug,
          industry_code: industryCode || null,
          primary_language: primaryLanguage,
          timezone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization')
      }

      setSuccess('Organization settings updated successfully')
      await refreshOrganizations()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  if (!user || !currentOrganization) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage settings for {currentOrganization.organization_name}
          </p>
        </div>

        {!canEdit && (
          <div className="mb-4 rounded-md bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              You need to be an owner or admin to edit organization settings.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  disabled={!canEdit}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  URL Slug
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    serviceai.com/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    required
                    disabled={!canEdit}
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select
                  id="industry"
                  disabled={!canEdit}
                  value={industryCode}
                  onChange={(e) => setIndustryCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select an industry...</option>
                  <option value="hvac">HVAC & Climate Control</option>
                  <option value="plumbing">Plumbing Services</option>
                  <option value="electrical">Electrical Services</option>
                  <option value="medical">Medical/Dental Practice</option>
                  <option value="veterinary">Veterinary Services</option>
                  <option value="property">Property Management</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Primary Language
                </label>
                <select
                  id="language"
                  disabled={!canEdit}
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  id="timezone"
                  disabled={!canEdit}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Phoenix">Arizona Time (MST)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                </select>
              </div>

              {canEdit && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Danger Zone - Only for owners */}
        {currentOrganization.user_role === 'owner' && (
          <div className="mt-8 bg-white shadow rounded-lg border-2 border-red-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-4">
                These actions are permanent and cannot be undone.
              </p>
              <button
                onClick={() => alert('Organization deletion will be implemented in a future update')}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                Delete Organization
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

