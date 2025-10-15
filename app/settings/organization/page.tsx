'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  Building2,
  ChevronRight,
  Save,
} from 'lucide-react'

export default function OrganizationSettingsPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  
  const [organizationName, setOrganizationName] = useState('')
  const [industryType, setIndustryType] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      loadSettings()
    }
  }, [currentOrganization])

  const loadSettings = async () => {
    if (!currentOrganization) {
      return
    }

    setLoading(true)
    try {
      // Fetch full organization details including all settings
      const response = await fetch(`/api/organizations/${currentOrganization.organization_id}`)
      if (!response.ok) {
        throw new Error('Failed to load organization settings')
      }
      
      const data = await response.json()
      const org = data.organization
      
      setOrganizationName(org.name || '')
      setIndustryType(org.industry_code || '')
    } catch (error) {
      console.error('Error loading organization settings:', error)
      toast.error('Failed to load organization settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!organizationName.trim()) {
      toast.warning('Organization name is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/organizations/${currentOrganization?.organization_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizationName,
          industry_code: industryType,
        }),
      })
      
      if (response.ok) {
        // Reload settings to confirm they were saved
        await loadSettings()
        toast.success('Organization settings saved successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving organization settings:', error)
      toast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/settings" className="hover:text-gray-900">Settings</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Organization</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Organization Settings</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Update your business information and preferences
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading organization settings...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Services Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry Type
                </label>
                <select
                  value={industryType}
                  onChange={(e) => setIndustryType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select industry...</option>
                  <option value="hvac">HVAC</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="medical">Medical</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="property">Property Management</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

