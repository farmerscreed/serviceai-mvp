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
    const type = searchParams.get('type') || ''
    const date = searchParams.get('date') || 'all'
    const status = searchParams.get('status') || 'all'

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        activities: []
      })
    }

    const activities: any[] = []

    // Fetch appointments if type matches
    if (!type || type === 'appointments') {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, customer_name, appointment_type, scheduled_date, scheduled_time, status, created_at')
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })
        .limit(20)

      appointments?.forEach(apt => {
        activities.push({
          id: `appointment-${apt.id}`,
          type: 'appointment',
          title: `Appointment: ${apt.appointment_type}`,
          description: `${apt.customer_name}`,
          timestamp: apt.created_at,
          status: apt.status,
          metadata: apt
        })
      })
    }

    // Fetch emergency notifications if type matches
    if (!type || type === 'emergencies') {
      const { data: emergencies } = await supabase
        .from('emergency_notifications')
        .select('*')
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })
        .limit(20)

      emergencies?.forEach(emergency => {
        activities.push({
          id: `emergency-${emergency.id}`,
          type: 'emergency',
          title: 'Emergency Detected',
          description: emergency.message || 'High urgency situation',
          timestamp: emergency.created_at,
          status: emergency.status,
          metadata: emergency
        })
      })
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Filter by status if provided
    let filteredActivities = activities
    if (status && status !== 'all') {
      filteredActivities = activities.filter(a => a.status === status)
    }

    // Filter by date if provided
    if (date && date !== 'all') {
      const targetDate = new Date(date)
      filteredActivities = filteredActivities.filter(a => {
        const activityDate = new Date(a.timestamp)
        return activityDate.toDateString() === targetDate.toDateString()
      })
    }

    return NextResponse.json({
      success: true,
      activities: filteredActivities.slice(0, 50) // Limit to 50 items
    })
  } catch (error: any) {
    console.error('Activity API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
