import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - Get appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get appointment with organization access check via RLS
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment
    })
    
  } catch (error: any) {
    console.error('Appointment GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Get existing appointment to verify access
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select('organization_id, scheduled_date, scheduled_time')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // If rescheduling, check new time availability
    if (body.scheduledDate || body.scheduledTime) {
      const newDate = body.scheduledDate || existing.scheduled_date
      const newTime = body.scheduledTime || existing.scheduled_time

      // Check if new time conflicts with other appointments
      const { data: conflict } = await supabase
        .from('appointments')
        .select('id')
        .eq('organization_id', existing.organization_id)
        .eq('scheduled_date', newDate)
        .eq('scheduled_time', newTime)
        .neq('id', id)
        .not('status', 'in', '(cancelled,no_show)')
        .single()

      if (conflict) {
        return NextResponse.json(
          { error: 'Time slot not available' },
          { status: 409 }
        )
      }
    }

    // Update appointment
    const updateData: any = {}
    if (body.customerName) updateData.customer_name = body.customerName
    if (body.customerPhone) updateData.customer_phone = body.customerPhone
    if (body.customerEmail) updateData.customer_email = body.customerEmail
    if (body.serviceAddress) updateData.service_address = body.serviceAddress
    if (body.appointmentType) updateData.appointment_type = body.appointmentType
    if (body.serviceDescription) updateData.service_description = body.serviceDescription
    if (body.scheduledDate) updateData.scheduled_date = body.scheduledDate
    if (body.scheduledTime) updateData.scheduled_time = body.scheduledTime
    if (body.durationMinutes) updateData.duration_minutes = body.durationMinutes
    if (body.status) updateData.status = body.status
    if (body.notes) updateData.notes = body.notes

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Appointment update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    console.log('✅ Appointment updated:', id)

    return NextResponse.json({
      success: true,
      appointment: updated
    })
    
  } catch (error: any) {
    console.error('Appointment PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete - mark as cancelled
    const { data: cancelled, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Appointment cancellation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('✅ Appointment cancelled:', id)

    // TODO: Send cancellation SMS
    // TODO: Delete calendar event

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully'
    })
    
  } catch (error: any) {
    console.error('Appointment DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

