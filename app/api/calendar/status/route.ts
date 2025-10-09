import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    // Fetch organization calendar settings
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('calendar_provider, calendar_sync_enabled, google_calendar_id, outlook_calendar_id, calendly_user_uri, calendar_metadata')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      console.error('Error fetching calendar status:', orgError)
      return NextResponse.json({ error: orgError.message }, { status: 400 })
    }

    const isConnected = !!(
      organization?.calendar_sync_enabled &&
      organization?.calendar_provider &&
      (
        organization?.google_calendar_id ||
        organization?.outlook_calendar_id ||
        organization?.calendly_user_uri
      )
    )

    return NextResponse.json({
      success: true,
      connected: isConnected,
      provider: organization?.calendar_provider || null,
      syncEnabled: organization?.calendar_sync_enabled || false,
      metadata: organization?.calendar_metadata || {}
    })
  } catch (error: any) {
    console.error('Calendar status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

