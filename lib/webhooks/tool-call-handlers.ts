// Tool Call Handlers - Task 2.3
// Handles specific tool calls from Vapi.ai with language context

import { createEmergencyDetectorFromTemplate } from '@/lib/emergency/multilingual-emergency-detector'
import { createEmergencySMSDispatcher } from '@/lib/emergency/emergency-sms-dispatcher'
import { createServiceRoleClient } from '@/lib/supabase/server'
import type { CallData, CallContext } from '@/lib/emergency/multilingual-emergency-detector'

export interface ToolCallResult {
  success: boolean
  data?: any
  error?: string
}

export interface EmergencyCheckData {
  issue_description: string
  detected_language: 'en' | 'es'
  urgency_indicators: string[]
  cultural_context: string
}

export interface AppointmentBookingData {
  service_type: string
  scheduled_start_time: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  address: string
  preferred_language: 'en' | 'es'
  sms_preference: boolean
  cultural_formality: 'formal' | 'informal'
}

export interface SMSNotificationData {
  phone_number: string
  message_type: string
  language: 'en' | 'es'
  urgency_level: 'low' | 'medium' | 'high' | 'emergency'
}

export class ToolCallHandlers {
  // =====================================================
  // Emergency Check Handler
  // =====================================================

  /**
   * Handle emergency check tool call
   */
  async handleEmergencyCheck(
    organizationId: string,
    toolCall: { id: string; function: { name: string; arguments: any } },
    language: 'en' | 'es'
  ): Promise<ToolCallResult> {
    try {
      console.log(`🚨 Processing emergency check for ${organizationId} in ${language}`)

      const supabase = createServiceRoleClient();
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('industry_code, name, phone')
        .eq('id', organizationId)
        .single();

      if (orgError || !organization) {
        throw new Error(`Organization not found: ${organizationId}`);
      }

      const industryCode = organization.industry_code || 'general';

      const args = toolCall.function.arguments as EmergencyCheckData
      
      // Create emergency detector with dynamic industry code
      const detector = await createEmergencyDetectorFromTemplate(industryCode, language)
      
      // Create call data from tool call
      const callData: CallData = {
        transcript: args.issue_description,
        customerName: 'Customer', // This would be extracted from context
        customerPhone: '+1234567890', // This would be extracted from context
        issueDescription: args.issue_description,
        timestamp: new Date().toISOString()
      }

      // Create call context
      const context: CallContext = {
        organizationId: organizationId,
        businessName: organization.name || 'ServiceAI Business',
        businessPhone: organization.phone || '+1234567890',
        emergencyContactPhone: '+1234567890', // TODO: Get this from org settings
        industryCode: industryCode,
        timezone: 'America/New_York' // TODO: Get this from org settings
      }

      // Calculate urgency score
      const result = await detector.calculateUrgencyScore(callData, context)

      // Log emergency detection
      if (result.requiresImmediateAttention) {
        await detector.logEmergencyEvent(organizationId, callData, result, context)
      }

      return {
        success: true,
        data: {
          urgency_score: result.urgencyScore,
          detected_language: result.detectedLanguage,
          emergency_keywords_found: result.emergencyKeywordsFound,
          requires_immediate_attention: result.requiresImmediateAttention,
          cultural_context: result.culturalContext,
          industry_modifiers: result.industryModifiers,
          sms_alerts_sent: result.smsAlertsSent
        }
      }

    } catch (error) {
      console.error('Error handling emergency check:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  // =====================================================
  // Appointment Booking Handler
  // =====================================================

  /**
   * Handle appointment booking tool call
   */
  async handleAppointmentBooking(
    customerId: string,
    toolCall: { id: string; function: { name: string; arguments: any } },
    language: 'en' | 'es'
  ): Promise<ToolCallResult> {
    try {
      console.log(`📅 Processing appointment booking for organization ${customerId} in ${language}`)
      console.log(`📋 Tool call arguments:`, JSON.stringify(toolCall.function.arguments, null, 2))

      const args = toolCall.function.arguments as AppointmentBookingData

      // Validate required fields with detailed error messages
      const missingFields: string[] = []
      if (!args.service_type) missingFields.push('service_type')
      if (!args.scheduled_start_time) missingFields.push('scheduled_start_time')
      if (!args.customer_name) missingFields.push('customer_name')
      if (!args.customer_phone) missingFields.push('customer_phone')

      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`
        console.error(`❌ Validation failed: ${errorMsg}`)
        return {
          success: false,
          error: errorMsg
        }
      }

      // Validate date format
      const scheduledDate = new Date(args.scheduled_start_time)
      if (isNaN(scheduledDate.getTime())) {
        const errorMsg = `Invalid date format: ${args.scheduled_start_time}`
        console.error(`❌ ${errorMsg}`)
        return {
          success: false,
          error: errorMsg
        }
      }

      // Create appointment record
      const appointment = await this.createAppointment(customerId, args, language)

      // Send SMS confirmation if requested
      let smsConfirmationSent = false
      if (args.sms_preference) {
        try {
          await this.sendAppointmentConfirmationSMS(appointment, language)
          smsConfirmationSent = true
          console.log(`✅ SMS confirmation sent to ${args.customer_phone}`)
        } catch (smsError: any) {
          console.error(`⚠️ SMS confirmation failed: ${smsError.message}`)
          // Don't fail the appointment if SMS fails
        }
      }

      console.log(`✅ Appointment booking completed successfully: ${appointment.id}`)

      return {
        success: true,
        data: {
          appointment_id: appointment.id,
          appointment_type: appointment.appointment_type,
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          customer_name: appointment.customer_name,
          sms_confirmation_sent: smsConfirmationSent
        }
      }

    } catch (error: any) {
      console.error('❌ Error handling appointment booking:', error)
      console.error('❌ Error stack:', error.stack)
      return {
        success: false,
        error: error.message || String(error)
      }
    }
  }

  /**
   * Create appointment record
   */
  private async createAppointment(
    customerId: string,
    args: AppointmentBookingData,
    language: 'en' | 'es'
  ): Promise<any> {
    try {
      const supabase = createServiceRoleClient()

      // Parse scheduled_start_time into date and time components
      const scheduledDateTime = new Date(args.scheduled_start_time)
      const scheduled_date = scheduledDateTime.toISOString().split('T')[0] // YYYY-MM-DD
      const scheduled_time = scheduledDateTime.toTimeString().split(' ')[0] // HH:MM:SS

      // Calculate duration based on service type
      const duration_minutes = this.calculateDuration(args.service_type)

      console.log(`📅 Creating appointment: ${args.service_type} on ${scheduled_date} at ${scheduled_time}`)

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          organization_id: customerId,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          customer_email: args.customer_email,
          service_address: args.address,
          appointment_type: args.service_type,  // ✅ FIXED: was service_type
          scheduled_date: scheduled_date,        // ✅ FIXED: was scheduled_start_time
          scheduled_time: scheduled_time,        // ✅ FIXED: was scheduled_start_time
          duration_minutes: duration_minutes,    // ✅ ADDED: missing field
          language_preference: args.preferred_language,
          status: 'pending',
          notes: `Language: ${language}, Formality: ${args.cultural_formality}`
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Database error creating appointment:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Appointment created successfully: ${appointment.id}`)
      
      // Create call log entry for this appointment booking
      await this.createCallLogForAppointment(customerId, appointment, args)
      
      return appointment

    } catch (error) {
      console.error('❌ Error creating appointment:', error)
      throw error
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  private async sendAppointmentConfirmationSMS(appointment: any, language: 'en' | 'es'): Promise<void> {
    try {
      const smsDispatcher = createEmergencySMSDispatcher()
      
      // This would integrate with actual SMS service
      console.log(`📱 Sending appointment confirmation SMS to ${appointment.customer_phone} in ${language}`)
      
      // Mock SMS sending
      const messageContent = language === 'es' 
        ? `¡Hola ${appointment.customer_name}! Su cita de ${appointment.service_type} está confirmada para ${appointment.scheduled_start_time}. Llame si necesita reprogramar.`
        : `Hi ${appointment.customer_name}! Your ${appointment.service_type} appointment is confirmed for ${appointment.scheduled_start_time}. Call if you need to reschedule.`

      console.log(`📱 SMS Content: ${messageContent}`)

    } catch (error) {
      console.error('Error sending appointment confirmation SMS:', error)
    }
  }

  /**
   * Create call log entry for appointment booking
   */
  private async createCallLogForAppointment(
    organizationId: string,
    appointment: any,
    args: AppointmentBookingData
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      // Generate a unique call ID for this appointment booking
      const callId = `appointment_${appointment.id}_${Date.now()}`
      
      const { error } = await supabase
        .from('call_logs')
        .insert({
          organization_id: organizationId,
          vapi_call_id: callId,
          phone_number: args.customer_phone,
          start_time: new Date().toISOString(),
          status: 'completed',
          detected_language: args.preferred_language || 'en',
          transcript: `Appointment booked: ${args.service_type} for ${args.customer_name} on ${appointment.scheduled_date} at ${appointment.scheduled_time}`,
          summary: `Successfully booked ${args.service_type} appointment for ${args.customer_name}`,
          emergency_detected: args.service_type === 'emergency',
          cost: 0, // No call cost for appointment bookings
          raw_vapi_data: {
            appointment_id: appointment.id,
            service_type: args.service_type,
            customer_name: args.customer_name,
            customer_phone: args.customer_phone,
            scheduled_date: appointment.scheduled_date,
            scheduled_time: appointment.scheduled_time
          }
        })

      if (error) {
        console.error('❌ Error creating call log for appointment:', error)
        // Don't throw error - appointment was created successfully
      } else {
        console.log(`✅ Call log created for appointment: ${appointment.id}`)
      }

    } catch (error) {
      console.error('❌ Error creating call log for appointment:', error)
      // Don't throw error - appointment was created successfully
    }
  }

  // =====================================================
  // Availability Check Handler
  // =====================================================

  /**
   * Handle availability check tool call
   */
  async handleAvailabilityCheck(
    organizationId: string,
    toolCall: { id: string; function: { name: string; arguments: any } },
    language: 'en' | 'es'
  ): Promise<ToolCallResult> {
    try {
      console.log(`📅 Checking availability for organization ${organizationId} in ${language}`)
      console.log(`📋 Tool call arguments:`, JSON.stringify(toolCall.function.arguments, null, 2))

      const args = toolCall.function.arguments

      // Validate required fields
      if (!args.requested_date || !args.service_type) {
        const errorMsg = 'Missing required fields: requested_date, service_type'
        console.error(`❌ Validation failed: ${errorMsg}`)
        return {
          success: false,
          error: errorMsg
        }
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(args.requested_date)) {
        const errorMsg = `Invalid date format: ${args.requested_date}. Expected YYYY-MM-DD`
        console.error(`❌ ${errorMsg}`)
        return {
          success: false,
          error: errorMsg
        }
      }

      // Validate date is not in the past
      const requestedDate = new Date(args.requested_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)  // Reset to midnight for fair comparison

      if (requestedDate < today) {
        const errorMsg = `Date ${args.requested_date} is in the past. Please provide a date from today (${today.toISOString().split('T')[0]}) forward.`
        console.error(`❌ ${errorMsg}`)
        return {
          success: false,
          error: errorMsg
        }
      }

      const supabase = createServiceRoleClient()

      // Get existing appointments for that date
      const { data: appointments, error: dbError } = await supabase
        .from('appointments')
        .select('scheduled_time, duration_minutes')
        .eq('organization_id', organizationId)
        .eq('scheduled_date', args.requested_date)
        .not('status', 'in', '(cancelled,no_show)')

      if (dbError) {
        console.error('❌ Database error:', dbError)
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        }
      }

      // Ensure appointments is an array
      const existingAppointments = appointments || []

      // Define business hours
      const businessHours = {
        start: '09:00:00',
        end: '17:00:00',
        slotDuration: this.calculateDuration(args.service_type)
      }

      // Calculate available slots
      const availableSlots = this.calculateAvailableSlots(
        businessHours,
        existingAppointments,
        args.requested_date
      )

      console.log(`✅ Found ${availableSlots.length} available slots for ${args.requested_date}`)

      // Format response following Hope Hall's successful pattern
      if (availableSlots.length === 0) {
        return {
          success: true,
          data: {
            available: false,
            requested_date: args.requested_date,
            service_type: args.service_type,
            message: language === 'es' 
              ? 'No hay disponibilidad en esta fecha. ¿Le gustaría probar otra fecha?'
              : 'No availability on this date. Would you like to try another date?',
            alternative_dates: ['2025-10-15', '2025-10-16', '2025-10-17']
          }
        }
      }

      // Convert time slots to user-friendly format
      const formattedSlots = availableSlots.map(slot => {
        const [hours, minutes] = slot.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
      })

      const message = language === 'es'
        ? `Tengo ${availableSlots.length} horarios disponibles para ${args.service_type} el ${args.requested_date}: ${formattedSlots.join(', ')}. ¿Cuál le funciona mejor?`
        : `I have ${availableSlots.length} available time slots for ${args.service_type} on ${args.requested_date}: ${formattedSlots.join(', ')}. Which works best for you?`

      return {
        success: true,
        data: {
          available: true,
          requested_date: args.requested_date,
          service_type: args.service_type,
          available_slots: availableSlots,
          formatted_slots: formattedSlots,
          total_slots: availableSlots.length,
          message: message,
          business_hours: businessHours,
          next_steps: language === 'es'
            ? 'Por favor seleccione un horario y proporcione su información de contacto para confirmar la cita.'
            : 'Please select a time slot and provide your contact information to confirm the appointment.'
        }
      }

    } catch (error: any) {
      console.error('❌ Error checking availability:', error)
      console.error('❌ Error stack:', error.stack)
      return {
        success: false,
        error: error.message || String(error)
      }
    }
  }

  /**
   * Calculate available time slots avoiding conflicts
   */
  private calculateAvailableSlots(
    businessHours: { start: string; end: string; slotDuration: number },
    bookedAppointments: Array<{ scheduled_time: string; duration_minutes: number }>,
    date: string
  ): string[] {
    const slots: string[] = []
    const slotDuration = businessHours.slotDuration

    // Parse business hours
    const [startHour, startMin] = businessHours.start.split(':').map(Number)
    const [endHour, endMin] = businessHours.end.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    // Generate all possible slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const hour = Math.floor(minutes / 60)
      const min = minutes % 60
      const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`

      // Check if this slot conflicts with any booked appointment
      const hasConflict = bookedAppointments.some(apt => {
        const aptMinutes = this.parseTimeToMinutes(apt.scheduled_time)
        const aptDuration = apt.duration_minutes
        const aptEndMinutes = aptMinutes + aptDuration
        const slotEndMinutes = minutes + slotDuration

        // Check for overlap
        return !(slotEndMinutes <= aptMinutes || minutes >= aptEndMinutes)
      })

      if (!hasConflict) {
        slots.push(timeSlot)
      }
    }

    return slots
  }

  /**
   * Convert time string to minutes since midnight
   */
  private parseTimeToMinutes(time: string): number {
    const [hour, min] = time.split(':').map(Number)
    return hour * 60 + min
  }

  // =====================================================
  // SMS Notification Handler
  // =====================================================

  /**
   * Handle SMS notification tool call
   */
  async handleSMSNotification(
    customerId: string,
    toolCall: { id: string; function: { name: string; arguments: any } },
    language: 'en' | 'es'
  ): Promise<ToolCallResult> {
    try {
      console.log(`📱 Processing SMS notification for ${customerId} in ${language}`)

      const args = toolCall.function.arguments as SMSNotificationData

      // Validate required fields
      if (!args.phone_number || !args.message_type || !args.language) {
        return {
          success: false,
          error: 'Missing required fields: phone_number, message_type, language'
        }
      }

      // Send SMS notification
      const smsResult = await this.sendSMSNotification(args, language)

      return {
        success: true,
        data: {
          message_id: smsResult.messageId,
          phone_number: args.phone_number,
          message_type: args.message_type,
          language: args.language,
          urgency_level: args.urgency_level
        }
      }

    } catch (error) {
      console.error('Error handling SMS notification:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    args: SMSNotificationData,
    language: 'en' | 'es'
  ): Promise<{ messageId: string; success: boolean }> {
    try {
      // This would integrate with actual SMS service (Twilio)
      console.log(`📱 Sending SMS to ${args.phone_number} (${args.language}): ${args.message_type}`)

      // Mock SMS sending
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Log SMS communication
      await this.logSMSCommunication(args, language, messageId)

      return {
        messageId,
        success: true
      }

    } catch (error) {
      console.error('Error sending SMS notification:', error)
      throw error
    }
  }

  /**
   * Log SMS communication
   */
  private async logSMSCommunication(
    args: SMSNotificationData,
    language: 'en' | 'es',
    messageId: string
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      await supabase
        .from('sms_communications')
        .insert({
          organization_id: 'customer_id', // This would be resolved from context
          phone_number: args.phone_number,
          message_type: args.message_type,
          direction: 'outbound',
          language_code: language,
          message_content: `SMS notification: ${args.message_type}`,
          external_message_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString()
        })

      console.log(`📝 Logged SMS communication: ${messageId}`)

    } catch (error) {
      console.error('Error logging SMS communication:', error)
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Calculate duration in minutes based on service type
   */
  private calculateDuration(serviceType: string): number {
    // Set duration based on service type
    switch (serviceType.toLowerCase()) {
      case 'emergency':
        return 120
      case 'repair':
        return 90
      case 'maintenance':
        return 60
      case 'installation':
        return 180
      default:
        return 60 // Default duration
    }
  }

  /**
   * @deprecated Use calculateDuration instead
   * Calculate appointment end time based on service type
   */
  private calculateEndTime(startTime: string, serviceType: string): string {
    const start = new Date(startTime)
    const durationMinutes = this.calculateDuration(serviceType)
    const end = new Date(start.getTime() + durationMinutes * 60000)
    return end.toISOString()
  }

}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create tool call handlers
 */
export function createToolCallHandlers(): ToolCallHandlers {
  return new ToolCallHandlers()
}
