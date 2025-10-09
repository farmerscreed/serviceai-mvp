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
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        alerts: []
      })
    }

    // Fetch emergency notifications
    const { data: alerts, error: alertsError } = await supabase
      .from('emergency_notifications')
      .select('*')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (alertsError) {
      console.error('Error fetching emergency alerts:', alertsError)
      return NextResponse.json(
        { success: false, alerts: [], error: alertsError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    })
  } catch (error: any) {
    console.error('Emergency alerts GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
