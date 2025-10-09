import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    
    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    // Verify appointment belongs to user's organization
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('organization_id')
      .eq('id', id)
      .single()
    
    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    
    if (appointment.organization_id !== membership.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get SMS logs for this appointment
    const { data: smsLogs, error } = await supabase
      .from('sms_communications')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .eq('appointment_id', id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching SMS logs:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      smsLogs: smsLogs || [] 
    })
    
  } catch (error: any) {
    console.error('Error in appointment SMS API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
