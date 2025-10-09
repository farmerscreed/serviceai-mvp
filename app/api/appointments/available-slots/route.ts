import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60')

    if (!organizationId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, date' },
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

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get available time slots using database function
    const { data: slots, error } = await (supabase as any)
      .rpc('get_available_time_slots', {
        org_id: organizationId,
        target_date: date,
        slot_duration: duration
      })

    if (error) {
      console.error('Error fetching available slots:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      date,
      duration,
      slots: slots || []
    })
    
  } catch (error: any) {
    console.error('Available slots error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

