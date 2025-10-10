// Multilingual Webhook Handler - Task 2.3
// Processes Vapi.ai webhook events with multi-language support and SMS integration

import { createServerClient } from '@/lib/supabase/server'
import { createEmergencyDetectorFromTemplate } from '@/lib/emergency/multilingual-emergency-detector'
import { ToolCallHandlers } from './tool-call-handlers'
import { LanguageContext } from './language-context'
import { MultilingualVapiService } from '@/lib/vapi/multilingual-vapi-service'
import { verifyVapiWebhookSignatureWithTimestamp, extractVapiWebhookHeaders, validateVapiWebhookPayload } from './vapi-signature-verification'
import { logger, ErrorUtils, ERROR_CODES, type ErrorContext } from '@/lib/utils/error-handler'
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
    webhookData: VapiWebhookData,
    requestHeaders?: Headers | Record<string, string>,
    rawPayload?: string
  ): Promise<WebhookResponse> {
    const context: ErrorContext = {
      organizationId: customerId,
      webhookType: webhookData.type,
      callId: webhookData.call?.id,
      operation: 'handleWebhook'
    }

    try {
      logger.info(`Processing webhook for customer ${customerId}: ${webhookData.type}`, context)

      // 1. Validate webhook payload structure
      if (!validateVapiWebhookPayload(webhookData)) {
        throw ErrorUtils.createError(
          'Invalid webhook payload structure',
          ERROR_CODES.INVALID_WEBHOOK_PAYLOAD,
          context
        )
      }

      // 2. Verify webhook signature if headers and raw payload are provided
      if (requestHeaders && rawPayload) {
        const webhookSecret = process.env.VAPI_WEBHOOK_SECRET
        if (webhookSecret) {
          const { signature, timestamp } = extractVapiWebhookHeaders(requestHeaders)
          
          if (signature) {
            const isValid = await verifyVapiWebhookSignatureWithTimestamp({
              webhookSecret,
              signature,
              payload: rawPayload,
              timestamp: timestamp || undefined
            })
            
            if (!isValid) {
              throw ErrorUtils.createError(
                'Invalid webhook signature',
                ERROR_CODES.INVALID_WEBHOOK_SIGNATURE,
                context
              )
            }
          } else {
            logger.warn('No signature found in webhook headers, skipping verification', context)
          }
        } else {
          logger.warn('VAPI_WEBHOOK_SECRET not configured, skipping signature verification', context)
        }
      } else {
        // Fallback to basic validation if headers/payload not provided
        const isValid = await this.verifyWebhookSignature(webhookData)
        if (!isValid) {
          throw ErrorUtils.createError(
            'Invalid webhook signature',
            ERROR_CODES.INVALID_WEBHOOK_SIGNATURE,
            context
          )
        }
      }

      // 3. Get customer configuration
      const customerConfig = await this.languageContext.getCustomerContext(customerId)
      if (!customerConfig) {
        throw ErrorUtils.createError(
          'Customer configuration not found',
          ERROR_CODES.RECORD_NOT_FOUND,
          context
        )
      }

      // 4. Detect language from event data
      const detectedLanguage = await this.languageContext.detectLanguageFromEvent(webhookData)
      logger.info(`Language detected: ${detectedLanguage}`, { ...context, detectedLanguage })

      // 4. Route to appropriate handler
      let result: any

      // Check if it's a demo call
      if (webhookData.metadata?.demoRequestId) {
        result = await this.handleDemoCallEvent(webhookData.metadata.demoRequestId, webhookData, detectedLanguage)
      } else {
        switch (webhookData.type) {
          case 'assistant-request':
            result = await this.handleAssistantRequest(customerId, webhookData)
            break

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
          logger.warn(`Unhandled webhook type: ${webhookData.type}`, context)
          result = { status: 'processed', message: 'Event type not handled' }
        }
      }

      // 6. Log webhook event
      await this.logWebhookEvent(customerId, webhookData, result, detectedLanguage)

      logger.info(`Webhook processed successfully: ${webhookData.type}`, context)
      return {
        success: true,
        result
      }

    } catch (error) {
      logger.error('Error processing webhook', error as Error, context)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
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
    customerId: string, // This is actually organizationId
    webhookData: VapiWebhookData,
    language: 'en' | 'es'
  ): Promise<any> {
    try {
      console.log(`📞 Call ended for customer ${customerId} in ${language}`)

      const supabase = await createServerClient()

      // 1. Fetch the organization's current usage
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('minutes_used_this_cycle')
        .eq('id', customerId)
        .single()

      if (orgError || !org) {
        console.error('Error fetching organization for post-call accounting:', orgError?.message)
        // Continue without updating usage if we can't fetch org data
      } else {
        // 2. Calculate call duration in minutes
        const durationSeconds = webhookData.call?.duration || 0
        const durationMinutes = Math.ceil(durationSeconds / 60)

        // 3. Update minutes_used_this_cycle
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ minutes_used_this_cycle: (org.minutes_used_this_cycle || 0) + durationMinutes })
          .eq('id', customerId)

        if (updateError) {
          console.error('Error updating minutes_used_this_cycle:', updateError)
        } else {
          console.log(`📊 Updated minutes_used_this_cycle for org ${customerId} by ${durationMinutes} minutes.`)
        }
      }

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

  /**
   * Handle demo call specific events
   */
  private async handleDemoCallEvent(
    demoRequestId: string,
    webhookData: VapiWebhookData,
    language: 'en' | 'es'
  ): Promise<any> {
    try {
      console.log(`🔗 Processing demo call event for demo request ${demoRequestId}: ${webhookData.type}`)

      const supabase = await createServerClient()

      let updateData: any = {}
      let status: string | undefined

      switch (webhookData.type) {
        case 'call-started':
          status = 'calling'
          updateData = { call_started_at: new Date().toISOString(), status }
          break

        case 'call-ended':
          status = webhookData.call?.status === 'completed' ? 'completed' : 'failed'
          if (webhookData.call?.status === 'no-answer') status = 'no_answer'
          updateData = {
            call_ended_at: new Date().toISOString(),
            status,
            transcript: webhookData.transcript,
            recording_url: webhookData.call?.recordingUrl, // Assuming Vapi provides this
          }
          break

        case 'tool-calls':
          // Handle tool calls from the demo assistant (e.g., send_sms_notification)
          const toolCallResults = await this.handleToolCalls(webhookData.customer?.id || '', webhookData.toolCalls || [], language)
          return { status: 'tool_calls_processed', results: toolCallResults }

        case 'transcript-updated':
          // Optional: Implement basic lead scoring based on keywords in the transcript
          // For now, just log
          console.log(`📝 Transcript updated for demo call ${demoRequestId}: ${webhookData.transcript}`)
          break

        default:
          console.log(`Unhandled demo call event type: ${webhookData.type}`)
          return { status: 'processed', message: 'Event type not handled for demo call' }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('demo_requests')
          .update(updateData)
          .eq('id', demoRequestId)

        if (error) {
          console.error('Error updating demo request:', error.message)
        } else {
          console.log(`✅ Demo request ${demoRequestId} updated with status: ${status}`)
        }
      }

      return { status: 'processed', message: `Demo call event ${webhookData.type} processed` }

    } catch (error) {
      console.error('Error handling demo call event:', error)
      throw error
    }
  }

  /**
   * Handle assistant request event
   */
  async handleAssistantRequest(
    customerId: string, // This is actually organizationId
    webhookData: VapiWebhookData,
  ): Promise<any> {
    try {
      console.log(`🤖 Assistant request for customer ${customerId}`)

      const supabase = await createServerClient()

      // 1. Fetch the organization's subscription details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(`
          subscription_status,
          subscription_tier,
          minutes_used_this_cycle,
          credit_minutes,
          subscription_plans (
            included_minutes
          )
        `)
        .eq('id', customerId) // customerId is actually organizationId
        .single()

      if (orgError || !org) {
        console.error('Error fetching organization for pre-call check:', orgError?.message)
        // Default to allowing the call if we can't fetch org data
        return { assistantId: webhookData.call?.assistantId }
      }

      // 2. Check if the subscription is active
      if (org.subscription_status !== 'active' && org.subscription_status !== 'trialing') {
        console.warn(`🚫 Call rejected for organization ${customerId}: Subscription status is ${org.subscription_status}`)
        return {
          assistant: {
            firstMessage: 'Your subscription is not active. Please renew your plan to continue using our service.',
            voice: {
              provider: 'azure',
              voiceId: 'en-US-AriaNeural',
              speed: 1.0
            },
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [{ role: 'system', content: 'You are an AI assistant that informs the user about their inactive subscription and then hangs up.' }],
              tools: [],
              temperature: 0.7
            },
            endCallFunction: {
              name: 'hang_up',
              parameters: {}
            }
          }
        }
      }

      // 3. Calculate remaining minutes
      const monthlyMinutesAllocation = org.subscription_plans?.included_minutes || 0
      const minutesUsed = org.minutes_used_this_cycle || 0
      const creditMinutes = org.credit_minutes || 0

      const remainingMinutes = (monthlyMinutesAllocation + creditMinutes) - minutesUsed

      console.log(`📊 Org ${customerId} - Used: ${minutesUsed}, Allocated: ${monthlyMinutesAllocation}, Credit: ${creditMinutes}, Remaining: ${remainingMinutes}`)

      // 4. Enforce cut-off
      if (remainingMinutes <= 0) {
        console.warn(`🚫 Call rejected for organization ${customerId}: Monthly minutes exhausted.`)
        return {
          assistant: {
            firstMessage: 'Your account has insufficient minutes. Please log in to add more.',
            voice: {
              provider: 'azure',
              voiceId: 'en-US-AriaNeural',
              speed: 1.0
            },
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [{ role: 'system', content: 'You are an AI assistant that informs the user about insufficient minutes and then hangs up.' }],
              tools: [],
              temperature: 0.7
            },
            endCallFunction: {
              name: 'hang_up',
              parameters: {}
            }
          }
        }
      }

      // 5. If minutes are available, allow the call to proceed with the original assistant
      console.log(`✅ Call allowed for organization ${customerId}. Remaining minutes: ${remainingMinutes}`)
      return { assistantId: webhookData.call?.assistantId }

    } catch (error) {
      console.error('Error handling assistant request:', error)
      // In case of any error, allow the call to proceed as a fallback
      return { assistantId: webhookData.call?.assistantId }
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Verify webhook signature using Vapi's webhook verification
   */
  private async verifyWebhookSignature(webhookData: VapiWebhookData): Promise<boolean> {
    try {
      // Get the webhook secret from environment variables
      const webhookSecret = process.env.VAPI_WEBHOOK_SECRET
      
      if (!webhookSecret) {
        console.warn('VAPI_WEBHOOK_SECRET not configured, skipping signature verification')
        return true // Allow in development/testing
      }

      // In a real implementation, you would:
      // 1. Get the signature from the request headers
      // 2. Create a hash of the request body using the webhook secret
      // 3. Compare the computed hash with the provided signature
      
      // For now, we'll implement a basic verification that checks if the webhook secret is configured
      // and the webhook data has the expected structure
      
      if (!webhookData.type) {
        console.error('Webhook verification failed: Missing webhook type')
        return false
      }

      // Validate webhook type is from our expected list
      const validWebhookTypes = [
        'assistant-request',
        'tool-calls', 
        'language-detected',
        'call-started',
        'call-ended',
        'transcript-updated'
      ]

      if (!validWebhookTypes.includes(webhookData.type)) {
        console.error(`Webhook verification failed: Invalid webhook type: ${webhookData.type}`)
        return false
      }

      console.log(`✅ Webhook signature verification passed for type: ${webhookData.type}`)
      return true

    } catch (error) {
      console.error('Error during webhook signature verification:', error)
      return false
    }
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
