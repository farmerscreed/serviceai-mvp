'use client'

import { useState } from 'react'

interface DemoRequest {
  id: string
  name: string
  phone_number: string
  industry: string | null
  status: string
  lead_score: number
  follow_up_flag: boolean
  conversion_status: string
  requested_at: string
  call_started_at: string | null
  call_ended_at: string | null
  transcript: string | null
  recording_url: string | null
}

interface DemoRequestsTableProps {
  initialDemoRequests: DemoRequest[]
}

export default function DemoRequestsTable({ initialDemoRequests }: DemoRequestsTableProps) {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>(initialDemoRequests)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // In a real app, you might want to re-fetch or paginate here
  // For now, we'll just use the initial data

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Demo Call Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Industry
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration (s)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Score
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Follow Up
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversion
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {demoRequests.map((req) => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {req.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.phone_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {req.industry || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {req.status.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(req.requested_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.call_started_at && req.call_ended_at
                    ? Math.round((new Date(req.call_ended_at).getTime() - new Date(req.call_started_at).getTime()) / 1000)
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.lead_score || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.follow_up_flag ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {req.conversion_status.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-2">View</button>
                  <button className="text-blue-600 hover:text-blue-900">Follow Up</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
