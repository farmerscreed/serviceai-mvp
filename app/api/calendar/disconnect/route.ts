import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Disconnect calendar
    const { error } = await supabase
      .from('organizations')
      .update({
        calendar_provider: null,
        calendar_sync_enabled: false,
        google_refresh_token: null,
        google_calendar_id: null,
        outlook_refresh_token: null,
        outlook_calendar_id: null,
        calendly_api_key: null,
        calendly_user_uri: null,
        calendar_metadata: {}
      })
      .eq('id', organizationId)

    if (error) {
      console.error('Error disconnecting calendar:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✅ Calendar disconnected for organization:', organizationId)

    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected successfully'
    })

  } catch (error: any) {
    console.error('Calendar disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

