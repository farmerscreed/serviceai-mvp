import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 })
    }

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          calls: { total: 0, thisWeek: 0, lastWeek: 0, avgDuration: 0, emergencies: 0 },
          sms: { total: 0, thisWeek: 0, lastWeek: 0, delivered: 0, failed: 0 },
          appointments: { total: 0, confirmed: 0, pending: 0, completed: 0 },
          languages: { english: 0, spanish: 0 }
        }
      })
    }

    // Calculate week boundaries
    const now = new Date()
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay())
    startOfThisWeek.setHours(0, 0, 0, 0)
    
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    // Fetch call stats
    const { data: allCalls, error: callsError } = await supabase
      .from('call_logs')
      .select('id, start_time, duration_seconds, emergency_detected, detected_language')
      .in('organization_id', orgIds)

    if (callsError) {
      console.error('Error fetching calls:', callsError)
    }

    const calls = allCalls || []
    const thisWeekCalls = calls.filter(c => new Date(c.start_time) >= startOfThisWeek)
    const lastWeekCalls = calls.filter(c => {
      const callDate = new Date(c.start_time)
      return callDate >= startOfLastWeek && callDate < startOfThisWeek
    })

    const avgDuration = calls.length > 0
      ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / calls.length)
      : 0

    const emergencies = calls.filter(c => c.emergency_detected).length

    // Fetch SMS stats
    const { data: allSms, error: smsError } = await supabase
      .from('sms_communications')
      .select('id, created_at, delivery_status')
      .in('organization_id', orgIds)

    if (smsError) {
      console.error('Error fetching SMS:', smsError)
    }

    const sms = allSms || []
    const thisWeekSms = sms.filter(s => new Date(s.created_at) >= startOfThisWeek)
    const lastWeekSms = sms.filter(s => {
      const smsDate = new Date(s.created_at)
      return smsDate >= startOfLastWeek && smsDate < startOfThisWeek
    })

    const deliveredSms = sms.filter(s => s.delivery_status === 'delivered').length
    const failedSms = sms.filter(s => s.delivery_status === 'failed').length

    // Fetch appointment stats
    const { data: allAppointments, error: apptError } = await supabase
      .from('appointments')
      .select('id, status')
      .in('organization_id', orgIds)

    if (apptError) {
      console.error('Error fetching appointments:', apptError)
    }

    const appointments = allAppointments || []
    const confirmedAppts = appointments.filter(a => a.status === 'confirmed').length
    const pendingAppts = appointments.filter(a => a.status === 'pending').length
    const completedAppts = appointments.filter(a => a.status === 'completed').length

    // Count languages from calls
    const englishCalls = calls.filter(c => c.detected_language === 'en').length
    const spanishCalls = calls.filter(c => c.detected_language === 'es').length

    return NextResponse.json({
      success: true,
      stats: {
        calls: {
          total: calls.length,
          thisWeek: thisWeekCalls.length,
          lastWeek: lastWeekCalls.length,
          avgDuration,
          emergencies
        },
        sms: {
          total: sms.length,
          thisWeek: thisWeekSms.length,
          lastWeek: lastWeekSms.length,
          delivered: deliveredSms,
          failed: failedSms
        },
        appointments: {
          total: appointments.length,
          confirmed: confirmedAppts,
          pending: pendingAppts,
          completed: completedAppts
        },
        languages: {
          english: englishCalls,
          spanish: spanishCalls
        }
      }
    })
  } catch (error: any) {
    console.error('Analytics stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

