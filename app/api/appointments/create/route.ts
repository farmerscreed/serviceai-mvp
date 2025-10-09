import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { UnifiedCalendarService } from '@/lib/calendar/unified-calendar-service'
import { SMSWorkflowEngine } from '@/lib/sms/sms-workflow-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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
      serviceDescription,
      scheduledDate,
      scheduledTime,
      durationMinutes = 60,
      languagePreference = 'en',
      vapiCallId
    } = body
    
    // Validate required fields
    if (!organizationId || !customerName || !customerPhone || !scheduledDate || !scheduledTime || !appointmentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    
    // Check availability
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('scheduled_date', scheduledDate)
      .eq('scheduled_time', scheduledTime)
      .not('status', 'in', '(cancelled,no_show)')
      .single()
    
    if (existingAppointment) {
      return NextResponse.json(
        { 
          error: 'Time slot not available',
          message: 'An appointment already exists at this time'
        },
        { status: 409 }
      )
    }
    
    // Create or get customer
    const { data: customer, error: customerError } = await (supabase as any)
      .from('customers')
      .upsert({
        organization_id: organizationId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: serviceAddress,
        language_preference: languagePreference,
        sms_opt_in: true
      }, {
        onConflict: 'organization_id,phone',
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (customerError) {
      console.error('Customer upsert error:', customerError)
      // Continue anyway - customer creation is not critical
    }
    
    // Create appointment in database
    const { data: appointment, error: appointmentError } = await (supabase as any)
      .from('appointments')
      .insert({
        organization_id: organizationId,
        customer_id: customer?.id || null,
        vapi_call_id: vapiCallId || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        service_address: serviceAddress,
        appointment_type: appointmentType,
        service_description: serviceDescription,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes,
        language_preference: languagePreference,
        status: 'pending'
      })
      .select()
      .single()
    
    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError)
      return NextResponse.json(
        { error: appointmentError.message },
        { status: 400 }
      )
    }
    
    // Create calendar event (if calendar integration is set up)
    const calendarService = new UnifiedCalendarService()
    const { eventId, provider } = await calendarService.createAppointment(
      organizationId,
      appointment
    )

    // Update appointment with calendar event ID
    if (eventId) {
      const calendarField = `${provider}_calendar_event_id`
      await supabase
        .from('appointments')
        .update({
          [calendarField]: eventId,
          calendar_provider: provider
        })
        .eq('id', appointment.id)
      
      console.log(`✅ Calendar event created: ${eventId} (${provider})`)
    }

    // Trigger SMS confirmation workflow
    try {
      const smsEngine = new SMSWorkflowEngine()
      await smsEngine.triggerAppointmentWorkflow(appointment, languagePreference as 'en' | 'es')
      console.log('✅ SMS workflow triggered')
    } catch (smsError: any) {
      console.error('⚠️ SMS workflow error (non-critical):', smsError.message)
      // Don't fail appointment creation if SMS fails
    }
    
    console.log('✅ Appointment created:', appointment.id)
    
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        customer_name: appointment.customer_name,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        appointment_type: appointment.appointment_type,
        status: appointment.status,
        calendar_event_id: eventId,
        calendar_provider: provider
      }
    })
    
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

