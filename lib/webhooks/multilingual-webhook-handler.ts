// Multilingual Webhook Handler - Task 2.3
// Processes Vapi.ai webhook events with multi-language support and SMS integration

import { createServerClient } from '@/lib/supabase/server'
import { createEmergencyDetectorFromTemplate } from '@/lib/emergency/multilingual-emergency-detector'
import { ToolCallHandlers } from './tool-call-handlers'
import { LanguageContext } from './language-context'
import type { CallData, CallContext } from '@/lib/emergency/multilingual-emergency-detector'

export interface VapiWebhookData {
  type: string
  call?: {
    id: string
    status: string
    duration?: number
  }
  toolCalls?: Array<{
    id: string
    function: {
      name: string
      arguments: any
    }
  }>
  transcript?: string
  language?: string
  customer?: {
    name?: string
    phone?: string
    email?: string
  }
  metadata?: any
}

export interface WebhookResponse {
  success: boolean
  result?: any
  error?: string
}

export interface ToolCallResult {
  success: boolean
  data?: any
  error?: string
}

export class MultilingualWebhookHandler {
  private templateService: any
  private toolCallHandlers: ToolCallHandlers
  private languageContext: LanguageContext

  constructor() {
    this.templateService = null // Will be initialized when needed
    this.toolCallHandlers = new ToolCallHandlers()
    this.languageContext = new LanguageContext()
  }

  // =====================================================
  // Main Webhook Processing
  // =====================================================

  /**
   * Handle Vapi webhook with multi-language support
   */
  async handleWebhook(
    customerId: string,
    webhookData: VapiWebhookData
  ): Promise<WebhookResponse> {
    try {
      console.log(`🔗 Processing webhook for customer ${customerId}: ${webhookData.type}`)

      // 1. Verify webhook signature (would be implemented with actual Vapi verification)
      const isValid = await this.verifyWebhookSignature(webhookData)
      if (!isValid) {
        throw new Error('Invalid webhook signature')
      }

      // 2. Get customer configuration
      const customerConfig = await this.languageContext.getCustomerContext(customerId)
      if (!customerConfig) {
        throw new Error('Customer configuration not found')
      }

      // 3. Detect language from event data
      const detectedLanguage = await this.languageContext.detectLanguageFromEvent(webhookData)
      console.log(`🌍 Detected language: ${detectedLanguage}`)

      // 4. Route to appropriate handler
      let result: any

      switch (webhookData.type) {
        case 'tool-calls':
          result = await this.handleToolCalls(customerId, webhookData.toolCalls || [], detectedLanguage)
          break

        case 'language-detected':
          result = await this.handleLanguageDetection(customerId, webhookData.language || 'en', webhookData.call?.id || '')
          break

        case 'call-started':
          result = await this.handleCallStarted(customerId, webhookData, detectedLanguage)
          break

        case 'call-ended':
          result = await this.handleCallEnded(customerId, webhookData, detectedLanguage)
          break

        case 'transcript-updated':
          result = await this.handleTranscriptUpdated(customerId, webhookData, detectedLanguage)
          break

        default:
          result = { status: 'processed', message: 'Event type not handled' }
      }

      // 5. Log webhook event
      await this.logWebhookEvent(customerId, webhookData, result, detectedLanguage)

      console.log(`✅ Webhook processed successfully: ${webhookData.type}`)
      return {
        success: true,
        result
      }

    } catch (error) {
      console.error('Error processing webhook:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  // =====================================================
  // Tool Call Handling
  // =====================================================

  /**
   * Handle tool calls with language context
   */
  async handleToolCalls(
    customerId: string,
    toolCalls: Array<{ id: string; function: { name: string; arguments: any } }>,
    language: 'en' | 'es'
  ): Promise<ToolCallResult[]> {
    try {
      console.log(`🔧 Processing ${toolCalls.length} tool calls in ${language}`)

      const results: ToolCallResult[] = []

      for (const toolCall of toolCalls) {
        try {
          let result: ToolCallResult

          switch (toolCall.function.name) {
            case 'check_emergency_multilingual':
              result = await this.toolCallHandlers.handleEmergencyCheck(customerId, toolCall, language)
              break

            case 'book_appointment_with_sms':
              result = await this.toolCallHandlers.handleAppointmentBooking(customerId, toolCall, language)
              break

            case 'send_sms_notification':
              result = await this.toolCallHandlers.handleSMSNotification(customerId, toolCall, language)
              break

            default:
              result = {
                success: false,
                error: `Unknown tool call: ${toolCall.function.name}`
              }
          }

          results.push(result)
          console.log(`✅ Tool call ${toolCall.function.name}: ${result.success ? 'success' : 'failed'}`)

        } catch (error) {
          console.error(`Error processing tool call ${toolCall.function.name}:`, error)
          results.push({
            success: false,
            error: String(error)
          })
        }
      }

      return results

    } catch (error) {
      console.error('Error handling tool calls:', error)
      throw error
    }
  }

  // =====================================================
  // Event Handlers
  // =====================================================

  /**
   * Handle language detection event
   */
  async handleLanguageDetection(
    customerId: string,
    detectedLanguage: string,
    callId: string
  ): Promise<any> {
    try {
      console.log(`🌍 Language detected: ${detectedLanguage} for call ${callId}`)

      await this.languageContext.updateConversationLanguage(
        customerId,
        callId,
        detectedLanguage as 'en' | 'es'
      )

      return {
        status: 'language_updated',
        language: detectedLanguage
      }

    } catch (error) {
      console.error('Error handling language detection:', error)
      throw error
    }
  }

  /**
   * Handle call started event
   */
  async handleCallStarted(
    customerId: string,
    webhookData: VapiWebhookData,
    language: 'en' | 'es'
  ): Promise<any> {
    try {
      console.log(`📞 Call started for customer ${customerId} in ${language}`)

      // Log call start
      await this.logCallEvent(customerId, 'call_started', {
        callId: webhookData.call?.id,
        language,
        timestamp: new Date().toISOString()
      })

      return {
        status: 'call_started',
        callId: webhookData.call?.id,
        language
      }

    } catch (error) {
      console.error('Error handling call started:', error)
      throw error
    }
  }

  /**
   * Handle call ended event
   */
  async handleCallEnded(
    customerId: string,
    webhookData: VapiWebhookData,
    language: 'en' | 'es'
  ): Promise<any> {
    try {
      console.log(`📞 Call ended for customer ${customerId} in ${language}`)

      // Log call end
      await this.logCallEvent(customerId, 'call_ended', {
        callId: webhookData.call?.id,
        duration: webhookData.call?.duration,
        language,
        timestamp: new Date().toISOString()
      })

      return {
        status: 'call_ended',
        callId: webhookData.call?.id,
        duration: webhookData.call?.duration,
        language
      }

    } catch (error) {
      console.error('Error handling call ended:', error)
      throw error
    }
  }

  /**
   * Handle transcript updated event
   */
  async handleTranscriptUpdated(
    customerId: string,
    webhookData: VapiWebhookData,
    language: 'en' | 'es'
  ): Promise<any> {
    try {
      console.log(`📝 Transcript updated for customer ${customerId} in ${language}`)

      // Check for emergency keywords in transcript
      if (webhookData.transcript) {
        const emergencyDetector = await createEmergencyDetectorFromTemplate(
          'hvac', // This would be determined from customer config
          language
        )

        const callData: CallData = {
          transcript: webhookData.transcript,
          customerName: webhookData.customer?.name || 'Unknown',
          customerPhone: webhookData.customer?.phone || '',
          issueDescription: webhookData.transcript,
          timestamp: new Date().toISOString()
        }

        const context: CallContext = {
          organizationId: customerId, // This would be resolved from customer
          businessName: 'ServiceAI Business',
          businessPhone: '+1234567890',
          emergencyContactPhone: '+1234567890',
          industryCode: 'hvac',
          timezone: 'America/New_York'
        }

        const emergencyResult = await emergencyDetector.calculateUrgencyScore(callData, context)
        
        if (emergencyResult.requiresImmediateAttention) {
          console.log('🚨 Emergency detected in transcript update')
        }
      }

      return {
        status: 'transcript_updated',
        transcript: webhookData.transcript,
        language
      }

    } catch (error) {
      console.error('Error handling transcript updated:', error)
      throw error
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Verify webhook signature (mock implementation)
   */
  private async verifyWebhookSignature(webhookData: VapiWebhookData): Promise<boolean> {
    // This would implement actual Vapi webhook signature verification
    // For now, we'll always return true
    return true
  }

  /**
   * Log webhook event
   */
  private async logWebhookEvent(
    customerId: string,
    webhookData: VapiWebhookData,
    result: any,
    language: 'en' | 'es'
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('webhook_events')
        .insert({
          organization_id: customerId, // This would be resolved from customer
          event_type: webhookData.type,
          detected_language: language,
          webhook_data: webhookData,
          response_data: result,
          processed_at: new Date().toISOString()
        })

      console.log(`📝 Logged webhook event: ${webhookData.type}`)

    } catch (error) {
      console.error('Error logging webhook event:', error)
    }
  }

  /**
   * Log call event
   */
  private async logCallEvent(
    customerId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('call_logs')
        .insert({
          organization_id: customerId,
          vapi_call_id: data.callId,
          phone_number: data.phoneNumber || '',
          start_time: data.timestamp,
          status: eventType === 'call_started' ? 'in_progress' : 'completed',
          detected_language: data.language,
          duration_seconds: data.duration
        })

      console.log(`📝 Logged call event: ${eventType}`)

    } catch (error) {
      console.error('Error logging call event:', error)
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create multilingual webhook handler
 */
export function createMultilingualWebhookHandler(): MultilingualWebhookHandler {
  return new MultilingualWebhookHandler()
}
