// Tool Call Handlers - Task 2.3
// Handles specific tool calls from Vapi.ai with language context

import { createEmergencyDetectorFromTemplate } from '@/lib/emergency/multilingual-emergency-detector'
import { createEmergencySMSDispatcher } from '@/lib/emergency/emergency-sms-dispatcher'
import { createServerClient } from '@/lib/supabase/server'
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
    customerId: string,
    toolCall: { id: string; function: { name: string; arguments: any } },
    language: 'en' | 'es'
  ): Promise<ToolCallResult> {
    try {
      console.log(`🚨 Processing emergency check for ${customerId} in ${language}`)

      const args = toolCall.function.arguments as EmergencyCheckData
      
      // Create emergency detector
      const detector = await createEmergencyDetectorFromTemplate('hvac', language) // This would be determined from customer config
      
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
        organizationId: customerId,
        businessName: 'ServiceAI Business', // This would be from customer config
        businessPhone: '+1234567890',
        emergencyContactPhone: '+1234567890',
        industryCode: 'hvac', // This would be from customer config
        timezone: 'America/New_York'
      }

      // Calculate urgency score
      const result = await detector.calculateUrgencyScore(callData, context)

      // Log emergency detection
      if (result.requiresImmediateAttention) {
        await detector.logEmergencyEvent(customerId, callData, result, context)
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
      console.log(`📅 Processing appointment booking for ${customerId} in ${language}`)

      const args = toolCall.function.arguments as AppointmentBookingData

      // Validate required fields
      if (!args.service_type || !args.scheduled_start_time || !args.customer_name || !args.customer_phone) {
        return {
          success: false,
          error: 'Missing required fields: service_type, scheduled_start_time, customer_name, customer_phone'
        }
      }

      // Create appointment record
      const appointment = await this.createAppointment(customerId, args, language)

      // Send SMS confirmation if requested
      if (args.sms_preference) {
        await this.sendAppointmentConfirmationSMS(appointment, language)
      }

      return {
        success: true,
        data: {
          appointment_id: appointment.id,
          service_type: appointment.service_type,
          scheduled_time: appointment.scheduled_start_time,
          customer_name: appointment.customer_name,
          sms_confirmation_sent: args.sms_preference
        }
      }

    } catch (error) {
      console.error('Error handling appointment booking:', error)
      return {
        success: false,
        error: String(error)
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
      const supabase = await createServerClient()
      
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          organization_id: customerId,
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          customer_email: args.customer_email,
          service_type: args.service_type,
          scheduled_start_time: args.scheduled_start_time,
          scheduled_end_time: this.calculateEndTime(args.scheduled_start_time, args.service_type),
          status: 'pending',
          notes: `Language: ${language}, Formality: ${args.cultural_formality}`
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Appointment created: ${appointment.id}`)
      return appointment

    } catch (error) {
      console.error('Error creating appointment:', error)
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
      const supabase = await createServerClient()
      
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
   * Calculate appointment end time based on service type
   */
  private calculateEndTime(startTime: string, serviceType: string): string {
    const start = new Date(startTime)
    let durationMinutes = 60 // Default duration

    // Set duration based on service type
    switch (serviceType.toLowerCase()) {
      case 'emergency':
        durationMinutes = 120
        break
      case 'repair':
        durationMinutes = 90
        break
      case 'maintenance':
        durationMinutes = 60
        break
      case 'installation':
        durationMinutes = 180
        break
    }

    const end = new Date(start.getTime() + durationMinutes * 60000)
    return end.toISOString()
  }

  /**
   * Get customer configuration
   */
  private async getCustomerConfiguration(customerId: string): Promise<any> {
    try {
      const supabase = await createServerClient()
      
      const { data: config, error } = await supabase
        .from('customer_configurations')
        .select('*')
        .eq('organization_id', customerId)
        .single()

      if (error) {
        console.error('Error fetching customer configuration:', error)
        return null
      }

      return config

    } catch (error) {
      console.error('Error getting customer configuration:', error)
      return null
    }
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
