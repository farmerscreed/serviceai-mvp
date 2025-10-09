"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useOrganizationId } from '@/hooks/use-organization-id'

export function BrandingDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { organizationId } = useOrganizationId()

  const testBrandingFunction = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const debugData: any = {
        hasSession: !!session,
        hasOrganizationId: !!organizationId,
        sessionToken: session?.access_token ? 'Present' : 'Missing',
        organizationId: organizationId || 'Not set'
      }

      if (session && organizationId) {
        try {
          const { data, error } = await supabase.functions.invoke('branding-management', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })

          debugData.functionResponse = { data, error }
        } catch (err: any) {
          debugData.functionError = err.message
        }
      }

      setDebugInfo(debugData)
    } catch (err: any) {
      setDebugInfo({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Branding Function Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testBrandingFunction} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test Branding Function'}
        </Button>
        
        {debugInfo && (
          <pre className="bg-slate-900 p-4 rounded text-sm text-slate-300 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
} 