#!/usr/bin/env tsx

/**
 * Backfill call logs for existing appointments
 * This script creates call log entries for appointments that were booked but don't have call logs
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

async function backfillCallLogs() {
  console.log('🔄 Starting call log backfill for existing appointments...\n')

  const supabase = createServiceRoleClient()

  try {
    // Get all appointments that don't have corresponding call logs
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError)
      return
    }

    console.log(`📋 Found ${appointments?.length || 0} appointments`)

    if (!appointments || appointments.length === 0) {
      console.log('✅ No appointments found to backfill')
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const appointment of appointments) {
      try {
        // Check if call log already exists for this appointment
        const { data: existingLog } = await supabase
          .from('call_logs')
          .select('id')
          .eq('raw_vapi_data->appointment_id', appointment.id)
          .single()

        if (existingLog) {
          console.log(`⏭️  Call log already exists for appointment ${appointment.id}`)
          continue
        }

        // Generate a unique call ID for this appointment
        const callId = `appointment_${appointment.id}_${Date.now()}`

        // Create call log entry
        const { error: insertError } = await supabase
          .from('call_logs')
          .insert({
            organization_id: appointment.organization_id,
            vapi_call_id: callId,
            phone_number: appointment.customer_phone,
            start_time: appointment.created_at,
            status: 'completed',
            detected_language: appointment.language_preference || 'en',
            transcript: `Appointment booked: ${appointment.appointment_type} for ${appointment.customer_name} on ${appointment.scheduled_date} at ${appointment.scheduled_time}`,
            summary: `Successfully booked ${appointment.appointment_type} appointment for ${appointment.customer_name}`,
            emergency_detected: appointment.emergency_detected || false,
            cost: 0,
            raw_vapi_data: {
              appointment_id: appointment.id,
              service_type: appointment.appointment_type,
              customer_name: appointment.customer_name,
              customer_phone: appointment.customer_phone,
              scheduled_date: appointment.scheduled_date,
              scheduled_time: appointment.scheduled_time,
              backfilled: true
            }
          })

        if (insertError) {
          console.error(`❌ Error creating call log for appointment ${appointment.id}:`, insertError)
          errorCount++
        } else {
          console.log(`✅ Created call log for appointment ${appointment.id} (${appointment.customer_name})`)
          successCount++
        }

      } catch (error) {
        console.error(`❌ Error processing appointment ${appointment.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n📊 Backfill Summary:`)
    console.log(`✅ Successfully created: ${successCount} call logs`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📋 Total appointments processed: ${appointments.length}`)

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error)
  }
}

// Run the backfill
backfillCallLogs()
  .then(() => {
    console.log('\n🎉 Call log backfill completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  })
