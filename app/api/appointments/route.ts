import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - List appointments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Get user's organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    if (orgError) {
      console.error('Error fetching user organizations for appointments:', orgError)
      return NextResponse.json({ success: false, appointments: [], error: orgError.message })
    }

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ success: true, appointments: [] })
    }

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        id,
        customer_name,
        customer_phone,
        customer_email,
        service_address,
        appointment_type,
        scheduled_date,
        scheduled_time,
        status,
        notes
      `)
      .in('organization_id', orgIds)
      .order('scheduled_date', { ascending: false })

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status as any)
    }

    const { data: appointments, error: apptError } = await query

    if (apptError) {
      console.error('Error fetching appointments:', apptError)
      return NextResponse.json({ success: false, appointments: [], error: apptError.message })
    }

    // Transform to match frontend interface
    const transformedAppointments = (appointments || []).map((apt: any) => ({
      id: apt.id,
      customerName: apt.customer_name,
      customerPhone: apt.customer_phone,
      serviceAddress: apt.service_address,
      appointmentType: apt.appointment_type,
      scheduledTime: `${apt.scheduled_date}T${apt.scheduled_time}`,
      status: apt.status,
      notes: apt.notes
    }))

    return NextResponse.json({
      success: true,
      appointments: transformedAppointments
    })
  } catch (error: any) {
    console.error('Appointments GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      organizationId,
      customerName,
      customerPhone,
      customerEmail,
      serviceAddress,
      appointmentType,
      scheduledDate,
      scheduledTime,
      durationMinutes = 60,
      languagePreference = 'en',
      notes
    } = body

    // Validate required fields
    if (!organizationId || !customerName || !customerPhone || !appointmentType || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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

    // Insert appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        organization_id: organizationId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        service_address: serviceAddress,
        appointment_type: appointmentType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes,
        language_preference: languagePreference,
        status: 'pending',
        notes: notes
      } as any)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating appointment:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      appointment
    })
  } catch (error: any) {
    console.error('Appointments POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update appointment
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, status, notes } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 })
    }

    // Update appointment
    const updates: any = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      appointment
    })
  } catch (error: any) {
    console.error('Appointments PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Bulk delete all appointments for user's organizations
export async function DELETE(request: NextRequest) {
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
      console.error('Error fetching user organizations for bulk delete:', orgError)
      return NextResponse.json({ success: false, error: orgError.message }, { status: 400 })
    }

    const orgIds = orgs?.map(o => o.organization_id) || []
    if (orgIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .in('organization_id', orgIds)

    if (deleteError) {
      console.error('Bulk delete appointments error:', deleteError)
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Appointments DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

