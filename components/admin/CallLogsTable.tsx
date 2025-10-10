'use client'

import { useState, useEffect } from 'react'

interface CallLog {
  id: string
  organization_id: string
  organization_name: string
  vapi_call_id: string
  phone_number: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  status: string
  detected_language: string | null
  cost: number | null
}

interface CallLogsTableProps {
  initialCallLogs: CallLog[]
}

export default function CallLogsTable({ initialCallLogs }: CallLogsTableProps) {
  const [callLogs, setCallLogs] = useState<CallLog[]>(initialCallLogs)
  const [loading, setLoading] = useState(false) // Already loaded by server component
  const [error, setError] = useState<string | null>(null)

  // In a real app, you might want to re-fetch or paginate here
  // For now, we'll just use the initial data

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">All Call Logs</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Call ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organization
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration (s)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Language
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {callLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.vapi_call_id.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.organization_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.phone_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.start_time).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.duration_seconds || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {log.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                  {log.detected_language || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.cost !== null ? `$${log.cost.toFixed(4)}` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
