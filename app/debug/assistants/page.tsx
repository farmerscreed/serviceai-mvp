'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, RefreshCw } from 'lucide-react'

export default function DebugAssistantsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/assistants/stats')
      const result = await response.json()
      setData(result)
    } catch (error) {
      setData({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Assistants Debug</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <pre className="text-sm text-green-400 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        {data?.assistants && data.assistants.length > 0 && (
          <div className="mt-6 space-y-4">
            {data.assistants.map((assistant: any) => (
              <div key={assistant.id} className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Assistant ID: {assistant.id}</div>
                <div className="text-white font-medium">Industry: {assistant.industry_code}</div>
                <div className="text-gray-300">Language: {assistant.language_code}</div>
                <div className="text-gray-300">Active: {assistant.is_active ? 'Yes' : 'No'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

