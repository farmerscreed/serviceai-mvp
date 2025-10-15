// Language Context Handler - Task 2.3
// Manages language detection and customer context for webhook processing

import { createServiceRoleClient } from '@/lib/supabase/server'
import { LanguageDetector } from '@/lib/emergency/language-detector'

export interface CustomerContext {
  organizationId: string
  industryCode: string
  languagePreference: 'en' | 'es'
  businessData: any
  templateId: string
  assistantId: string
}

export interface LanguageDetectionResult {
  detectedLanguage: 'en' | 'es'
  confidence: number
  indicators: string[]
}

export class LanguageContext {
  // =====================================================
  // Language Detection
  // =====================================================

  /**
   * Detect language from webhook event data
   */
  async detectLanguageFromEvent(webhookData: any): Promise<'en' | 'es'> {
    try {
      // Check for explicit language detection
      if (webhookData.language) {
        return webhookData.language as 'en' | 'es'
      }

      // Check transcript for language indicators
      if (webhookData.transcript) {
        return LanguageDetector.detectLanguage(webhookData.transcript)
      }

      // Check tool call arguments for language
      if (webhookData.toolCalls && webhookData.toolCalls.length > 0) {
        for (const toolCall of webhookData.toolCalls) {
          if (toolCall.function.arguments.detected_language) {
            return toolCall.function.arguments.detected_language as 'en' | 'es'
          }
          if (toolCall.function.arguments.preferred_language) {
            return toolCall.function.arguments.preferred_language as 'en' | 'es'
          }
        }
      }

      // Default to English if no language detected
      return 'en'

    } catch (error) {
      console.error('Error detecting language from event:', error)
      return 'en'
    }
  }

  /**
   * Detect language with confidence score
   */
  async detectLanguageWithConfidence(webhookData: any): Promise<LanguageDetectionResult> {
    try {
      if (webhookData.transcript) {
        return LanguageDetector.detectLanguageWithConfidence(webhookData.transcript)
      }

      // Fallback to basic detection
      const detectedLanguage = await this.detectLanguageFromEvent(webhookData)
      return {
        detectedLanguage,
        confidence: 0.8,
        indicators: []
      }

    } catch (error) {
      console.error('Error detecting language with confidence:', error)
      return {
        detectedLanguage: 'en',
        confidence: 0.5,
        indicators: []
      }
    }
  }

  // =====================================================
  // Customer Context Management
  // =====================================================

  /**
   * Get customer configuration and context
   */
  async getCustomerContext(customerId: string): Promise<CustomerContext | null> {
    try {
      const supabase = createServiceRoleClient()
      
      // Get customer configuration (get first active assistant for this org)
      const { data: config, error } = await supabase
        .from('vapi_assistants')
        .select(`
          organization_id,
          template_id,
          language_code,
          business_data,
          vapi_assistant_id
        `)
        .eq('organization_id', customerId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching customer configuration:', error)
        return null
      }

      // Get template information
      const { data: template, error: templateError } = await supabase
        .from('industry_templates')
        .select('industry_code, id')
        .eq('id', config.template_id)
        .single()

      if (templateError) {
        console.error('Error fetching template:', templateError)
        return null
      }

      return {
        organizationId: config.organization_id,
        industryCode: template.industry_code,
        languagePreference: config.language_code as 'en' | 'es',
        businessData: config.business_data,
        templateId: config.template_id,
        assistantId: config.vapi_assistant_id
      }

    } catch (error) {
      console.error('Error getting customer context:', error)
      return null
    }
  }

  /**
   * Update conversation language preference
   */
  async updateConversationLanguage(
    customerId: string,
    callId: string,
    language: 'en' | 'es'
  ): Promise<void> {
    try {
      console.log(`🌍 Updating conversation language to ${language} for call ${callId}`)

      const supabase = createServiceRoleClient()
      
      // Update call log with detected language
      await supabase
        .from('call_logs')
        .update({
          detected_language: language,
          updated_at: new Date().toISOString()
        })
        .eq('vapi_call_id', callId)

      // Update customer language preference if this is a significant change
      await this.updateCustomerLanguagePreference(customerId, language)

      console.log(`✅ Conversation language updated to ${language}`)

    } catch (error) {
      console.error('Error updating conversation language:', error)
    }
  }

  /**
   * Update customer language preference
   */
  private async updateCustomerLanguagePreference(
    customerId: string,
    language: 'en' | 'es'
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      // Update customer configuration
      await supabase
        .from('vapi_assistants')
        .update({
          language_code: language,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', customerId)

      console.log(`✅ Customer language preference updated to ${language}`)

    } catch (error) {
      console.error('Error updating customer language preference:', error)
    }
  }

  // =====================================================
  // Language Switching Detection
  // =====================================================

  /**
   * Detect language switching in conversation
   */
  async detectLanguageSwitching(
    customerId: string,
    callId: string,
    transcript: string
  ): Promise<{
    hasSwitching: boolean
    segments: Array<{ text: string; language: 'en' | 'es'; confidence: number }>
  }> {
    try {
      const switchingResult = LanguageDetector.detectLanguageSwitching(transcript)
      
      if (switchingResult.hasSwitching) {
        console.log(`🔄 Language switching detected in call ${callId}`)
        
        // Log language switching event
        await this.logLanguageSwitchingEvent(customerId, callId, switchingResult.segments)
      }

      return switchingResult

    } catch (error) {
      console.error('Error detecting language switching:', error)
      return {
        hasSwitching: false,
        segments: []
      }
    }
  }

  /**
   * Log language switching event
   */
  private async logLanguageSwitchingEvent(
    customerId: string,
    callId: string,
    segments: Array<{ text: string; language: 'en' | 'es'; confidence: number }>
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      
      await supabase
        .from('webhook_events')
        .insert({
          organization_id: customerId,
          event_type: 'language_switching',
          detected_language: segments[segments.length - 1]?.language || 'en',
          webhook_data: {
            call_id: callId,
            segments: segments
          },
          processed_at: new Date().toISOString()
        })

      console.log(`📝 Logged language switching event`)

    } catch (error) {
      console.error('Error logging language switching event:', error)
    }
  }

  // =====================================================
  // Cultural Context Analysis
  // =====================================================

  /**
   * Analyze cultural context from conversation
   */
  async analyzeCulturalContext(
    transcript: string,
    language: 'en' | 'es'
  ): Promise<{
    formalityLevel: 'formal' | 'informal' | 'neutral'
    urgencyExpression: 'direct' | 'contextual' | 'polite'
    relationshipStage: 'initial' | 'building' | 'established'
  }> {
    try {
      const culturalContext = {
        formalityLevel: 'neutral' as 'formal' | 'informal' | 'neutral',
        urgencyExpression: 'polite' as 'direct' | 'contextual' | 'polite',
        relationshipStage: 'initial' as 'initial' | 'building' | 'established'
      }

      if (language === 'es') {
        // Spanish cultural analysis
        if (transcript.includes('usted') || transcript.includes('señor') || transcript.includes('señora')) {
          culturalContext.formalityLevel = 'formal'
        } else if (transcript.includes('tú') || transcript.includes('contigo')) {
          culturalContext.formalityLevel = 'informal'
        }

        if (transcript.includes('emergencia') || transcript.includes('urgente')) {
          culturalContext.urgencyExpression = 'direct'
        } else if (transcript.includes('por favor') || transcript.includes('gracias')) {
          culturalContext.urgencyExpression = 'polite'
        }
      } else {
        // English cultural analysis
        if (transcript.includes('sir') || transcript.includes('ma\'am')) {
          culturalContext.formalityLevel = 'formal'
        } else if (transcript.includes('hey') || transcript.includes('dude')) {
          culturalContext.formalityLevel = 'informal'
        }

        if (transcript.includes('emergency') || transcript.includes('urgent')) {
          culturalContext.urgencyExpression = 'direct'
        } else if (transcript.includes('please') || transcript.includes('thank you')) {
          culturalContext.urgencyExpression = 'polite'
        }
      }

      return culturalContext

    } catch (error) {
      console.error('Error analyzing cultural context:', error)
      return {
        formalityLevel: 'neutral',
        urgencyExpression: 'polite',
        relationshipStage: 'initial'
      }
    }
  }

  // =====================================================
  // Language Preference Learning
  // =====================================================

  /**
   * Learn from customer language preferences
   */
  async learnLanguagePreference(
    customerId: string,
    detectedLanguage: 'en' | 'es',
    confidence: number
  ): Promise<void> {
    try {
      // Only update if confidence is high
      if (confidence < 0.8) {
        return
      }

      const supabase = createServiceRoleClient()
      
      // Update customer language preference
      await supabase
        .from('vapi_assistants')
        .update({
          language_code: detectedLanguage,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', customerId)

      console.log(`🧠 Learned language preference: ${detectedLanguage} (confidence: ${confidence})`)

    } catch (error) {
      console.error('Error learning language preference:', error)
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create language context handler
 */
export function createLanguageContext(): LanguageContext {
  return new LanguageContext()
}
