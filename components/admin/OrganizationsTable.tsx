'use client'

import { useState } from 'react'

interface OrganizationUsage {
  id: string
  name: string
  stripe_customer_id: string | null
  subscription_status: string
  subscription_tier: string | null
  minutes_used_this_cycle: number
  credit_minutes: number
  monthlyMinutesAllocation: number
  remainingMinutes: number
}

interface OrganizationsTableProps {
  organizations: OrganizationUsage[]
}

export default function OrganizationsTable({ organizations }: OrganizationsTableProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">All Organizations</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organization Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Used / Allocated
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit Minutes
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remaining
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {organizations.map((org) => (
              <tr key={org.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {org.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {org.subscription_tier || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {org.subscription_status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.minutes_used_this_cycle} / {org.monthlyMinutesAllocation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.credit_minutes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.remainingMinutes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
