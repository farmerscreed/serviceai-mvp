// Twilio SMS Service - Task 3.1
// Complete SMS service with multi-language support and template management

import { createServerClient } from '@/lib/supabase/server'
import { SMSTemplateManager } from './sms-template-manager'
import { SMSDeliveryTracker } from './sms-delivery-tracker'
import { LanguageDetector } from '@/lib/emergency/language-detector'

// Twilio types (simplified for this implementation)
interface TwilioClient {
  messages: {
    create(params: {
      body: string
      from: string
      to: string
      statusCallback?: string
    }): Promise<{ sid: string; status: string }>
  }
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  content?: string
  language?: string
  deliveryStatus?: string
}

interface IncomingSMS {
  From: string
  To: string
  Body: string
  MessageSid: string
  AccountSid: string
}

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service_type: string
  scheduled_start_time: string
  scheduled_end_time: string
  service_address: string
  business_phone: string
  organization_id: string
}

export class TwilioSMSService {
  private twilioClient: TwilioClient
  private templateManager: SMSTemplateManager
  private deliveryTracker: SMSDeliveryTracker
  private languageDetector: LanguageDetector

  constructor(twilioClient?: TwilioClient) {
    this.twilioClient = twilioClient || this.createTwilioClient()
    this.templateManager = new SMSTemplateManager()
    this.deliveryTracker = new SMSDeliveryTracker()
    this.languageDetector = new LanguageDetector()
  }

  // =====================================================
  // Core SMS Sending
  // =====================================================

  /**
   * Send multilingual SMS with template management
   */
  async sendMultilingualSMS(
    phone: string,
    templateKey: string,
    language: 'en' | 'es',
    data: Record<string, any>
  ): Promise<SMSResult> {
    try {
      console.log(`📱 Sending SMS to ${phone} (${language}): ${templateKey}`)

      // 1. Get template in specified language
      const template = await this.templateManager.getTemplate(templateKey, language)
      if (!template) {
        console.warn(`Template ${templateKey} not found in ${language}, falling back to English`)
        const fallbackTemplate = await this.templateManager.getTemplate(templateKey, 'en')
        if (!fallbackTemplate) {
          throw new Error(`Template ${templateKey} not found in any language`)
        }
        language = 'en'
      }

      // 2. Format message with provided data
      const messageContent = await this.templateManager.formatTemplate(
        template || await this.templateManager.getTemplate(templateKey, 'en'),
        data
      )

      // 3. Send via Twilio
      const message = await this.twilioClient.messages.create({
        body: messageContent,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: phone,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/status`
      })

      // 4. Log SMS communication
      await this.logSMSCommunication({
        organizationId: data.organizationId || data.customer_id,
        phone,
        messageType: templateKey,
        language,
        content: messageContent,
        twilioMessageId: message.sid,
        status: 'sent',
        templateData: data
      })

      console.log(`✅ SMS sent successfully: ${message.sid}`)
      return {
        success: true,
        messageId: message.sid,
        content: messageContent,
        language,
        deliveryStatus: message.status
      }

    } catch (error) {
      console.error('Error sending SMS:', error)
      await this.logSMSError(data.organizationId || data.customer_id, phone, templateKey, String(error))
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(
    appointment: Appointment,
    language: 'en' | 'es'
  ): Promise<SMSResult> {
    try {
      console.log(`📅 Sending appointment confirmation to ${appointment.customer_phone}`)

      const data = {
        customer_name: appointment.customer_name,
        service_type: appointment.service_type,
        date: new Date(appointment.scheduled_start_time).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: new Date(appointment.scheduled_start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        address: appointment.service_address,
        business_phone: appointment.business_phone,
        organization_id: appointment.organization_id
      }

      return await this.sendMultilingualSMS(
        appointment.customer_phone,
        'appointment_confirmation',
        language,
        data
      )

    } catch (error) {
      console.error('Error sending appointment confirmation:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(
    appointment: Appointment,
    language: 'en' | 'es',
    hoursBefore: number = 24
  ): Promise<SMSResult> {
    try {
      console.log(`⏰ Sending appointment reminder (${hoursBefore}h before) to ${appointment.customer_phone}`)

      const data = {
        customer_name: appointment.customer_name,
        service_type: appointment.service_type,
        time: new Date(appointment.scheduled_start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        date: new Date(appointment.scheduled_start_time).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric'
        }),
        address: appointment.service_address,
        business_phone: appointment.business_phone,
        hours_before: hoursBefore,
        organization_id: appointment.organization_id
      }

      return await this.sendMultilingualSMS(
        appointment.customer_phone,
        'appointment_reminder',
        language,
        data
      )

    } catch (error) {
      console.error('Error sending appointment reminder:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Send emergency alert SMS
   */
  async sendEmergencyAlert(
    phone: string,
    language: 'en' | 'es',
    emergencyData: {
      customer_name: string
      address: string
      issue_description: string
      urgency_level: string
      business_name: string
      emergency_contact: string
    }
  ): Promise<SMSResult> {
    try {
      console.log(`🚨 Sending emergency alert to ${phone} (${language})`)

      const data = {
        customer_name: emergencyData.customer_name,
        address: emergencyData.address,
        issue_description: emergencyData.issue_description,
        urgency_level: emergencyData.urgency_level,
        business_name: emergencyData.business_name,
        emergency_contact: emergencyData.emergency_contact
      }

      return await this.sendMultilingualSMS(
        phone,
        'emergency_alert',
        language,
        data
      )

    } catch (error) {
      console.error('Error sending emergency alert:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  // =====================================================
  // Two-Way SMS Handling
  // =====================================================

  /**
   * Handle incoming SMS responses from customers
   */
  async handleTwoWaySMS(incomingSMS: IncomingSMS): Promise<SMSResult> {
    try {
      console.log(`📨 Processing incoming SMS from ${incomingSMS.From}`)

      const phone = incomingSMS.From
      const message = incomingSMS.Body.toLowerCase().trim()

      // 1. Find customer by phone number
      const customer = await this.getCustomerByPhone(phone)
      if (!customer) {
        return await this.sendUnknownCustomerResponse(phone)
      }

      // 2. Detect language of incoming message
      const detectedLanguage = this.languageDetector.detectLanguage(message)
      console.log(`🌍 Detected language: ${detectedLanguage}`)

      // 3. Handle common responses
      if (this.isConfirmationMessage(message)) {
        return await this.handleConfirmation(customer, detectedLanguage)
      } else if (this.isCancellationMessage(message)) {
        return await this.handleCancellationRequest(customer, detectedLanguage)
      } else if (this.isHelpMessage(message)) {
        return await this.sendHelpMessage(customer, detectedLanguage)
      } else {
        // 4. Forward to human agent
        return await this.forwardToHumanAgent(customer, message, detectedLanguage)
      }

    } catch (error) {
      console.error('Error handling two-way SMS:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Handle confirmation responses
   */
  private async handleConfirmation(
    customer: any,
    language: 'en' | 'es'
  ): Promise<SMSResult> {
    try {
      const templateKey = language === 'es' ? 'confirmation_received_es' : 'confirmation_received_en'
      
      return await this.sendMultilingualSMS(
        customer.phone,
        templateKey,
        language,
        {
          customer_name: customer.name,
          business_name: customer.business_name
        }
      )

    } catch (error) {
      console.error('Error handling confirmation:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Handle cancellation requests
   */
  private async handleCancellationRequest(
    customer: any,
    language: 'en' | 'es'
  ): Promise<SMSResult> {
    try {
      const templateKey = language === 'es' ? 'cancellation_received_es' : 'cancellation_received_en'
      
      return await this.sendMultilingualSMS(
        customer.phone,
        templateKey,
        language,
        {
          customer_name: customer.name,
          business_phone: customer.business_phone
        }
      )

    } catch (error) {
      console.error('Error handling cancellation:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Send help message
   */
  private async sendHelpMessage(
    customer: any,
    language: 'en' | 'es'
  ): Promise<SMSResult> {
    try {
      const templateKey = language === 'es' ? 'help_message_es' : 'help_message_en'
      
      return await this.sendMultilingualSMS(
        customer.phone,
        templateKey,
        language,
        {
          customer_name: customer.name,
          business_phone: customer.business_phone
        }
      )

    } catch (error) {
      console.error('Error sending help message:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Forward to human agent
   */
  private async forwardToHumanAgent(
    customer: any,
    message: string,
    language: 'en' | 'es'
  ): Promise<SMSResult> {
    try {
      // Log the message for human agent review
      await this.logHumanAgentMessage(customer, message, language)
      
      const templateKey = language === 'es' ? 'forwarded_to_agent_es' : 'forwarded_to_agent_en'
      
      return await this.sendMultilingualSMS(
        customer.phone,
        templateKey,
        language,
        {
          customer_name: customer.name,
          business_phone: customer.business_phone
        }
      )

    } catch (error) {
      console.error('Error forwarding to human agent:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Check if message is confirmation
   */
  private isConfirmationMessage(message: string): boolean {
    const confirmationWords = ['yes', 'confirm', 'ok', 'sí', 'confirmar', 'sí', 'ok']
    return confirmationWords.some(word => message.includes(word))
  }

  /**
   * Check if message is cancellation
   */
  private isCancellationMessage(message: string): boolean {
    const cancellationWords = ['no', 'cancel', 'reschedule', 'cambiar', 'cancelar', 'reprogramar']
    return cancellationWords.some(word => message.includes(word))
  }

  /**
   * Check if message is help request
   */
  private isHelpMessage(message: string): boolean {
    const helpWords = ['help', 'ayuda', 'info', 'información', 'assist', 'asistencia']
    return helpWords.some(word => message.includes(word))
  }

  /**
   * Get customer by phone number
   */
  private async getCustomerByPhone(phone: string): Promise<any> {
    try {
      const supabase = await createServerClient()
      
      const { data: customer, error } = await supabase
        .from('appointments')
        .select(`
          customer_name,
          customer_phone,
          organization_id,
          business_phone
        `)
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !customer) {
        return null
      }

      return {
        name: customer.customer_name,
        phone: customer.customer_phone,
        organization_id: customer.organization_id,
        business_phone: customer.business_phone
      }

    } catch (error) {
      console.error('Error getting customer by phone:', error)
      return null
    }
  }

  /**
   * Send unknown customer response
   */
  private async sendUnknownCustomerResponse(phone: string): Promise<SMSResult> {
    try {
      return await this.sendMultilingualSMS(
        phone,
        'unknown_customer',
        'en', // Default to English for unknown customers
        {
          phone,
          business_phone: process.env.BUSINESS_PHONE || '+1234567890'
        }
      )

    } catch (error) {
      console.error('Error sending unknown customer response:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  // =====================================================
  // Database Operations
  // =====================================================

  /**
   * Log SMS communication
   */
  private async logSMSCommunication(data: {
    organizationId: string
    phone: string
    messageType: string
    language: string
    content: string
    twilioMessageId: string
    status: string
    templateData: Record<string, any>
  }): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('sms_communications')
        .insert({
          organization_id: data.organizationId,
          phone_number: data.phone,
          message_type: data.messageType,
          direction: 'outbound',
          language_code: data.language,
          message_content: data.content,
          external_message_id: data.twilioMessageId,
          status: data.status,
          sent_at: new Date().toISOString(),
          template_data: data.templateData
        })

      console.log(`📝 Logged SMS communication: ${data.twilioMessageId}`)

    } catch (error) {
      console.error('Error logging SMS communication:', error)
    }
  }

  /**
   * Log SMS error
   */
  private async logSMSError(
    organizationId: string,
    phone: string,
    templateKey: string,
    error: string
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('sms_communications')
        .insert({
          organization_id: organizationId,
          phone_number: phone,
          message_type: templateKey,
          direction: 'outbound',
          status: 'failed',
          error_message: error,
          sent_at: new Date().toISOString()
        })

      console.log(`📝 Logged SMS error: ${error}`)

    } catch (error) {
      console.error('Error logging SMS error:', error)
    }
  }

  /**
   * Log human agent message
   */
  private async logHumanAgentMessage(
    customer: any,
    message: string,
    language: 'en' | 'es'
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('sms_communications')
        .insert({
          organization_id: customer.organization_id,
          phone_number: customer.phone,
          message_type: 'human_agent_forward',
          direction: 'inbound',
          language_code: language,
          message_content: message,
          status: 'received',
          received_at: new Date().toISOString()
        })

      console.log(`📝 Logged human agent message from ${customer.phone}`)

    } catch (error) {
      console.error('Error logging human agent message:', error)
    }
  }

  // =====================================================
  // Twilio Client Creation
  // =====================================================

  /**
   * Create Twilio client (mock implementation for now)
   */
  private createTwilioClient(): TwilioClient {
    // This would be replaced with actual Twilio client
    return {
      messages: {
        create: async (params: {
          body: string
          from: string
          to: string
          statusCallback?: string
        }) => {
          console.log(`📱 Twilio SMS: ${params.from} -> ${params.to}`)
          console.log(`   Content: ${params.body}`)
          
          // Simulate SMS sending
          const messageId = `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          return {
            sid: messageId,
            status: 'sent'
          }
        }
      }
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create Twilio SMS service
 */
export function createTwilioSMSService(): TwilioSMSService {
  return new TwilioSMSService()
}
