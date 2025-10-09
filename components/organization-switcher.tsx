'use client'

import { Fragment } from 'react'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function OrganizationSwitcher() {
  const { organizations, currentOrganization, loading, switchOrganization } = useOrganization()
  const router = useRouter()

  const handleSwitch = (organizationId: string) => {
    switchOrganization(organizationId)
    // Optionally refresh the page to load organization-specific data
    router.refresh()
  }

  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        Loading...
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <Link
        href="/organizations/create"
        className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
      >
        + Create Organization
      </Link>
    )
  }

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer list-none hover:bg-gray-100 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
              {currentOrganization?.organization_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentOrganization?.organization_name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {currentOrganization?.user_role}
              </p>
            </div>
          </div>
          <svg
            className="ml-2 h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </summary>

        <div className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Switch Organization
            </div>
            
            {organizations.map((org) => (
              <button
                key={org.organization_id}
                onClick={() => handleSwitch(org.organization_id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                  org.organization_id === currentOrganization?.organization_id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-white font-semibold text-xs ${
                  org.organization_id === currentOrganization?.organization_id
                    ? 'bg-blue-600'
                    : 'bg-gray-400'
                }`}>
                  {org.organization_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{org.organization_name}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{org.user_role}</p>
                </div>
                {org.organization_id === currentOrganization?.organization_id && (
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}

            <div className="border-t border-gray-100 mt-1 pt-1">
              <Link
                href="/organizations/create"
                className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                + Create New Organization
              </Link>
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}

