// Two-Way SMS Handler - Task 3.1
// Handles incoming SMS responses from customers

import { createServerClient } from '@/lib/supabase/server'
import { TwilioSMSService } from './twilio-sms-service'
import { SMSDeliveryTracker } from './sms-delivery-tracker'

export interface IncomingSMS {
  messageId: string
  from: string
  to: string
  body: string
  timestamp: string
  mediaUrls?: string[]
}

export interface SMSResponse {
  success: boolean
  action: string
  message?: string
  error?: string
}

export interface CustomerContext {
  customerId: string
  organizationId: string
  language: string
  lastAppointment?: {
    id: string
    date: string
    time: string
    status: string
  }
  lastService?: {
    id: string
    type: string
    date: string
  }
}

export class TwoWaySMSHandler {
  private smsService: TwilioSMSService
  private deliveryTracker: SMSDeliveryTracker

  constructor() {
    this.smsService = new TwilioSMSService()
    this.deliveryTracker = new SMSDeliveryTracker()
  }

  // =====================================================
  // Main Handler
  // =====================================================

  /**
   * Handle incoming SMS message
   */
  async handleIncomingSMS(incomingSMS: IncomingSMS): Promise<SMSResponse> {
    try {
      console.log(`📱 Handling incoming SMS from ${incomingSMS.from}`)
      console.log(`   Message: ${incomingSMS.body}`)

      // Find customer context
      const customerContext = await this.findCustomerContext(incomingSMS.from)
      
      if (!customerContext) {
        console.log(`❌ Customer not found for phone: ${incomingSMS.from}`)
        return {
          success: false,
          action: 'unknown_customer',
          error: 'Customer not found'
        }
      }

      // Detect language
      const detectedLanguage = await this.detectLanguage(incomingSMS.body, customerContext.language)
      
      // Log incoming SMS
      await this.logIncomingSMS(incomingSMS, customerContext, detectedLanguage)

      // Process based on message content
      const response = await this.processMessage(incomingSMS, customerContext, detectedLanguage)

      console.log(`✅ SMS processed: ${response.action}`)
      return response

    } catch (error) {
      console.error('Error handling incoming SMS:', error)
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // =====================================================
  // Message Processing
  // =====================================================

  /**
   * Process incoming message based on content
   */
  private async processMessage(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<SMSResponse> {
    const message = incomingSMS.body.toLowerCase().trim()

    // Check for appointment-related responses
    if (this.isAppointmentResponse(message)) {
      return await this.handleAppointmentResponse(incomingSMS, customerContext, language)
    }

    // Check for service-related responses
    if (this.isServiceResponse(message)) {
      return await this.handleServiceResponse(incomingSMS, customerContext, language)
    }

    // Check for emergency responses
    if (this.isEmergencyResponse(message)) {
      return await this.handleEmergencyResponse(incomingSMS, customerContext, language)
    }

    // Check for general inquiries
    if (this.isGeneralInquiry(message)) {
      return await this.handleGeneralInquiry(incomingSMS, customerContext, language)
    }

    // Default response
    return await this.handleDefaultResponse(incomingSMS, customerContext, language)
  }

  /**
   * Handle appointment-related responses
   */
  private async handleAppointmentResponse(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<SMSResponse> {
    const message = incomingSMS.body.toLowerCase()

    // Check for confirmation
    if (this.isConfirmation(message)) {
      await this.confirmAppointment(customerContext, language)
      return {
        success: true,
        action: 'appointment_confirmed',
        message: language === 'es' 
          ? '¡Gracias! Su cita ha sido confirmada. Le enviaremos un recordatorio 24 horas antes.'
          : 'Thank you! Your appointment has been confirmed. We\'ll send you a reminder 24 hours before.'
      }
    }

    // Check for cancellation
    if (this.isCancellation(message)) {
      await this.cancelAppointment(customerContext, language)
      return {
        success: true,
        action: 'appointment_cancelled',
        message: language === 'es'
          ? 'Su cita ha sido cancelada. Si necesita reprogramar, por favor llámenos.'
          : 'Your appointment has been cancelled. If you need to reschedule, please call us.'
      }
    }

    // Check for rescheduling
    if (this.isRescheduling(message)) {
      return {
        success: true,
        action: 'rescheduling_requested',
        message: language === 'es'
          ? 'Entendemos que necesita reprogramar. Por favor llámenos al (555) 123-4567 para encontrar un nuevo horario.'
          : 'We understand you need to reschedule. Please call us at (555) 123-4567 to find a new time.'
      }
    }

    return {
      success: true,
      action: 'appointment_help',
      message: language === 'es'
        ? 'Para confirmar, cancelear o reprogramar su cita, responda CONFIRMAR, CANCELAR o REPROGRAMAR.'
        : 'To confirm, cancel or reschedule your appointment, reply CONFIRM, CANCEL or RESCHEDULE.'
    }
  }

  /**
   * Handle service-related responses
   */
  private async handleServiceResponse(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<SMSResponse> {
    const message = incomingSMS.body.toLowerCase()

    // Check for service satisfaction
    if (this.isSatisfactionResponse(message)) {
      await this.recordServiceSatisfaction(customerContext, message, language)
      return {
        success: true,
        action: 'satisfaction_recorded',
        message: language === 'es'
          ? '¡Gracias por su retroalimentación! Valoramos su opinión.'
          : 'Thank you for your feedback! We value your opinion.'
      }
    }

    // Check for follow-up questions
    if (this.isFollowUpQuestion(message)) {
      return {
        success: true,
        action: 'follow_up_help',
        message: language === 'es'
          ? 'Si tiene preguntas sobre el servicio, por favor llámenos al (555) 123-4567.'
          : 'If you have questions about the service, please call us at (555) 123-4567.'
      }
    }

    return {
      success: true,
      action: 'service_help',
      message: language === 'es'
        ? 'Para preguntas sobre el servicio, llámenos al (555) 123-4567.'
        : 'For service questions, call us at (555) 123-4567.'
    }
  }

  /**
   * Handle emergency responses
   */
  private async handleEmergencyResponse(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<SMSResponse> {
    const message = incomingSMS.body.toLowerCase()

    // Check for emergency confirmation
    if (this.isEmergencyConfirmation(message)) {
      await this.alertEmergencyTeam(customerContext, incomingSMS.body, language)
      return {
        success: true,
        action: 'emergency_alerted',
        message: language === 'es'
          ? '¡Entendido! Hemos alertado a nuestro equipo de emergencias. Alguien se pondrá en contacto con usted pronto.'
          : 'Understood! We\'ve alerted our emergency team. Someone will contact you soon.'
      }
    }

    // Check for emergency cancellation
    if (this.isEmergencyCancellation(message)) {
      await this.cancelEmergencyAlert(customerContext, language)
      return {
        success: true,
        action: 'emergency_cancelled',
        message: language === 'es'
          ? 'Alerta de emergencia cancelada. Si la situación cambia, por favor llámenos.'
          : 'Emergency alert cancelled. If the situation changes, please call us.'
      }
    }

    return {
      success: true,
      action: 'emergency_help',
      message: language === 'es'
        ? 'Para emergencias, llámenos al (555) 911-HELP o responda EMERGENCIA.'
        : 'For emergencies, call us at (555) 911-HELP or reply EMERGENCY.'
    }
  }

  /**
   * Handle general inquiries
   */
  private async handleGeneralInquiry(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<SMSResponse> {
    const message = incomingSMS.body.toLowerCase()

    // Check for business hours
    if (this.isBusinessHoursQuestion(message)) {
      return {
        success: true,
        action: 'business_hours',
        message: language === 'es'
          ? 'Nuestro horario es de lunes a viernes de 8:00 AM a 6:00 PM, sábados de 9:00 AM a 2:00 PM.'
          : 'Our hours are Monday-Friday 8:00 AM to 6:00 PM, Saturday 9:00 AM to 2:00 PM.'
      }
    }

    // Check for contact information
    if (this.isContactQuestion(message)) {
      return {
        success: true,
        action: 'contact_info',
        message: language === 'es'
          ? 'Puede llamarnos al (555) 123-4567 o visitar nuestro sitio web para más información.'
          : 'You can call us at (555) 123-4567 or visit our website for more information.'
      }
    }

    return {
      success: true,
      action: 'general_help',
      message: language === 'es'
        ? 'Para asistencia, llámenos al (555) 123-4567 o visite nuestro sitio web.'
        : 'For assistance, call us at (555) 123-4567 or visit our website.'
    }
  }

  /**
   * Handle default response
   */
  private async handleDefaultResponse(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<SMSResponse> {
    return {
      success: true,
      action: 'default_response',
      message: language === 'es'
        ? 'Gracias por su mensaje. Para asistencia, llámenos al (555) 123-4567.'
        : 'Thank you for your message. For assistance, call us at (555) 123-4567.'
    }
  }

  // =====================================================
  // Message Classification
  // =====================================================

  /**
   * Check if message is appointment-related
   */
  private isAppointmentResponse(message: string): boolean {
    const appointmentKeywords = [
      'appointment', 'cita', 'confirm', 'confirmar', 'cancel', 'cancelar',
      'reschedule', 'reprogramar', 'yes', 'sí', 'no'
    ]
    return appointmentKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is service-related
   */
  private isServiceResponse(message: string): boolean {
    const serviceKeywords = [
      'service', 'servicio', 'satisfied', 'satisfecho', 'good', 'bueno',
      'bad', 'malo', 'rating', 'calificación', 'feedback', 'retroalimentación'
    ]
    return serviceKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is emergency-related
   */
  private isEmergencyResponse(message: string): boolean {
    const emergencyKeywords = [
      'emergency', 'emergencia', 'urgent', 'urgente', 'help', 'ayuda',
      'broken', 'roto', 'not working', 'no funciona', 'leak', 'fuga'
    ]
    return emergencyKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is general inquiry
   */
  private isGeneralInquiry(message: string): boolean {
    const inquiryKeywords = [
      'hours', 'horario', 'contact', 'contacto', 'phone', 'teléfono',
      'address', 'dirección', 'website', 'sitio web'
    ]
    return inquiryKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is confirmation
   */
  private isConfirmation(message: string): boolean {
    const confirmationKeywords = ['yes', 'sí', 'confirm', 'confirmar', 'ok', 'okay']
    return confirmationKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is cancellation
   */
  private isCancellation(message: string): boolean {
    const cancellationKeywords = ['no', 'cancel', 'cancelar', 'stop', 'parar']
    return cancellationKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is rescheduling
   */
  private isRescheduling(message: string): boolean {
    const reschedulingKeywords = ['reschedule', 'reprogramar', 'change', 'cambiar', 'different', 'diferente']
    return reschedulingKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is satisfaction response
   */
  private isSatisfactionResponse(message: string): boolean {
    const satisfactionKeywords = ['good', 'bueno', 'excellent', 'excelente', 'bad', 'malo', 'terrible']
    return satisfactionKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is follow-up question
   */
  private isFollowUpQuestion(message: string): boolean {
    const followUpKeywords = ['question', 'pregunta', 'help', 'ayuda', 'how', 'cómo']
    return followUpKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is emergency confirmation
   */
  private isEmergencyConfirmation(message: string): boolean {
    const emergencyConfirmationKeywords = ['yes', 'sí', 'emergency', 'emergencia', 'urgent', 'urgente']
    return emergencyConfirmationKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is emergency cancellation
   */
  private isEmergencyCancellation(message: string): boolean {
    const emergencyCancellationKeywords = ['no', 'cancel', 'cancelar', 'false', 'falso', 'mistake', 'error']
    return emergencyCancellationKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is business hours question
   */
  private isBusinessHoursQuestion(message: string): boolean {
    const businessHoursKeywords = ['hours', 'horario', 'open', 'abierto', 'closed', 'cerrado']
    return businessHoursKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if message is contact question
   */
  private isContactQuestion(message: string): boolean {
    const contactKeywords = ['contact', 'contacto', 'phone', 'teléfono', 'address', 'dirección']
    return contactKeywords.some(keyword => message.includes(keyword))
  }

  // =====================================================
  // Action Handlers
  // =====================================================

  /**
   * Confirm appointment
   */
  private async confirmAppointment(customerContext: CustomerContext, language: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      if (customerContext.lastAppointment) {
        await supabase
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('id', customerContext.lastAppointment.id)

        console.log(`✅ Appointment confirmed: ${customerContext.lastAppointment.id}`)
      }
    } catch (error) {
      console.error('Error confirming appointment:', error)
    }
  }

  /**
   * Cancel appointment
   */
  private async cancelAppointment(customerContext: CustomerContext, language: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      if (customerContext.lastAppointment) {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', customerContext.lastAppointment.id)

        console.log(`✅ Appointment cancelled: ${customerContext.lastAppointment.id}`)
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }

  /**
   * Record service satisfaction
   */
  private async recordServiceSatisfaction(
    customerContext: CustomerContext,
    message: string,
    language: string
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      // Determine satisfaction level
      let satisfactionLevel = 'neutral'
      if (message.includes('good') || message.includes('bueno') || message.includes('excellent') || message.includes('excelente')) {
        satisfactionLevel = 'positive'
      } else if (message.includes('bad') || message.includes('malo') || message.includes('terrible')) {
        satisfactionLevel = 'negative'
      }

      // Record satisfaction
      await supabase
        .from('service_satisfaction')
        .insert({
          customer_id: customerContext.customerId,
          organization_id: customerContext.organizationId,
          satisfaction_level: satisfactionLevel,
          feedback: message,
          language_code: language,
          source: 'sms'
        })

      console.log(`✅ Service satisfaction recorded: ${satisfactionLevel}`)
    } catch (error) {
      console.error('Error recording service satisfaction:', error)
    }
  }

  /**
   * Alert emergency team
   */
  private async alertEmergencyTeam(
    customerContext: CustomerContext,
    message: string,
    language: string
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      // Create emergency alert
      await supabase
        .from('emergency_alerts')
        .insert({
          customer_id: customerContext.customerId,
          organization_id: customerContext.organizationId,
          message: message,
          language_code: language,
          status: 'active',
          source: 'sms'
        })

      console.log(`🚨 Emergency alert created for customer: ${customerContext.customerId}`)
    } catch (error) {
      console.error('Error creating emergency alert:', error)
    }
  }

  /**
   * Cancel emergency alert
   */
  private async cancelEmergencyAlert(customerContext: CustomerContext, language: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      // Cancel active emergency alerts
      await supabase
        .from('emergency_alerts')
        .update({ status: 'cancelled' })
        .eq('customer_id', customerContext.customerId)
        .eq('status', 'active')

      console.log(`✅ Emergency alert cancelled for customer: ${customerContext.customerId}`)
    } catch (error) {
      console.error('Error cancelling emergency alert:', error)
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Find customer context by phone number
   */
  private async findCustomerContext(phoneNumber: string): Promise<CustomerContext | null> {
    try {
      const supabase = await createServerClient()
      
      // Find customer by phone number
      const { data: customer, error } = await supabase
        .from('customers')
        .select(`
          id,
          organization_id,
          primary_language,
          appointments!inner(
            id,
            start_time,
            status
          ),
          services!inner(
            id,
            service_type,
            completed_at
          )
        `)
        .eq('phone_number', phoneNumber)
        .order('appointments.start_time', { ascending: false })
        .limit(1)
        .single()

      if (error || !customer) {
        return null
      }

      return {
        customerId: customer.id,
        organizationId: customer.organization_id,
        language: customer.primary_language || 'en',
        lastAppointment: customer.appointments?.[0] ? {
          id: customer.appointments[0].id,
          date: customer.appointments[0].start_time.split('T')[0],
          time: customer.appointments[0].start_time.split('T')[1],
          status: customer.appointments[0].status
        } : undefined,
        lastService: customer.services?.[0] ? {
          id: customer.services[0].id,
          type: customer.services[0].service_type,
          date: customer.services[0].completed_at
        } : undefined
      }

    } catch (error) {
      console.error('Error finding customer context:', error)
      return null
    }
  }

  /**
   * Detect language from message
   */
  private async detectLanguage(message: string, fallbackLanguage: string): Promise<string> {
    // Simple language detection based on keywords
    const spanishKeywords = ['hola', 'gracias', 'sí', 'no', 'por favor', 'ayuda']
    const englishKeywords = ['hello', 'thank you', 'yes', 'no', 'please', 'help']

    const lowerMessage = message.toLowerCase()
    
    const spanishCount = spanishKeywords.filter(keyword => lowerMessage.includes(keyword)).length
    const englishCount = englishKeywords.filter(keyword => lowerMessage.includes(keyword)).length

    if (spanishCount > englishCount) {
      return 'es'
    } else if (englishCount > spanishCount) {
      return 'en'
    }

    return fallbackLanguage
  }

  /**
   * Log incoming SMS
   */
  private async logIncomingSMS(
    incomingSMS: IncomingSMS,
    customerContext: CustomerContext,
    language: string
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('sms_communications')
        .insert({
          organization_id: customerContext.organizationId,
          customer_id: customerContext.customerId,
          phone_number: incomingSMS.from,
          message_type: 'incoming_response',
          direction: 'inbound',
          language_code: language,
          message_content: incomingSMS.body,
          external_message_id: incomingSMS.messageId,
          status: 'received',
          received_at: new Date().toISOString()
        })

      console.log(`📝 Incoming SMS logged for customer: ${customerContext.customerId}`)
    } catch (error) {
      console.error('Error logging incoming SMS:', error)
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create two-way SMS handler
 */
export function createTwoWaySMSHandler(): TwoWaySMSHandler {
  return new TwoWaySMSHandler()
}
