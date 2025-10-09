// Multilingual Emergency Detector - Task 2.2
// Detects emergencies across multiple languages and triggers SMS alerts

import { TemplateService } from '@/lib/templates/template-service'
import { LanguageDetector } from './language-detector'
import { UrgencyCalculator } from './urgency-calculator'
import { EmergencySMSDispatcher } from './emergency-sms-dispatcher'
import type { IndustryTemplate } from '@/lib/templates/types'

export interface CallData {
  transcript: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  issueDescription: string
  callDuration?: number
  timestamp: string
}

export interface CallContext {
  organizationId: string
  businessName: string
  businessPhone: string
  emergencyContactPhone: string
  emergencyContactEmail?: string
  industryCode: string
  timezone: string
  weatherData?: any
}

export interface EmergencyResult {
  urgencyScore: number
  detectedLanguage: 'en' | 'es'
  emergencyKeywordsFound: string[]
  requiresImmediateAttention: boolean
  culturalContext: string
  industryModifiers: string[]
  smsAlertsSent: boolean
  timestamp: string
}

export interface SMSAlertResult {
  technicianSMS: {
    success: boolean
    messageId?: string
    error?: string
  }
  customerSMS: {
    success: boolean
    messageId?: string
    error?: string
  }
  statusUpdateScheduled: boolean
}

export class MultilingualEmergencyDetector {
  private template: IndustryTemplate
  private templateService: TemplateService
  private languageDetector: LanguageDetector
  private urgencyCalculator: UrgencyCalculator
  private smsDispatcher: EmergencySMSDispatcher

  constructor(template: IndustryTemplate) {
    this.template = template
    this.templateService = new TemplateService()
    this.languageDetector = new LanguageDetector()
    this.urgencyCalculator = new UrgencyCalculator()
    this.smsDispatcher = new EmergencySMSDispatcher()
  }

  // =====================================================
  // Core Emergency Detection
  // =====================================================

  /**
   * Calculate urgency score using multi-language template patterns
   */
  async calculateUrgencyScore(
    callData: CallData,
    context: CallContext
  ): Promise<EmergencyResult> {
    try {
      console.log(`Analyzing emergency for ${this.template.industry_code} in ${callData.transcript.substring(0, 100)}...`)

      // 1. Detect language from transcript
      const detectedLanguage = this.languageDetector.detectLanguage(callData.transcript)
      console.log(`Detected language: ${detectedLanguage}`)

      // 2. Get language-specific emergency keywords
      const emergencyKeywords = this.languageDetector.getEmergencyKeywords(this.template, detectedLanguage)
      console.log(`Emergency keywords (${detectedLanguage}):`, emergencyKeywords.slice(0, 5))

      // 3. Calculate base urgency score
      const baseScore = this.urgencyCalculator.calculateBaseScore(callData.transcript, emergencyKeywords)
      console.log(`Base urgency score: ${baseScore}`)

      // 4. Apply cultural modifiers
      const culturalScore = this.urgencyCalculator.applyCulturalModifiers(baseScore, detectedLanguage)
      console.log(`After cultural modifiers: ${culturalScore}`)

      // 5. Apply industry-specific modifiers
      const finalScore = this.urgencyCalculator.applyIndustryModifiers(
        culturalScore,
        this.template.industry_code,
        context
      )
      console.log(`Final urgency score: ${finalScore}`)

      // 6. Find emergency keywords that were detected
      const foundKeywords = emergencyKeywords.filter(keyword => 
        callData.transcript.toLowerCase().includes(keyword.toLowerCase())
      )

      // 7. Determine if immediate attention is required
      const requiresImmediateAttention = finalScore > 0.7

      // 8. Get cultural context
      const culturalContext = this.getCulturalContext(detectedLanguage, callData.transcript)

      // 9. Get industry modifiers applied
      const industryModifiers = this.getIndustryModifiers(this.template.industry_code, context)

      const result: EmergencyResult = {
        urgencyScore: Math.min(finalScore, 1.0),
        detectedLanguage,
        emergencyKeywordsFound: foundKeywords,
        requiresImmediateAttention,
        culturalContext,
        industryModifiers,
        smsAlertsSent: false,
        timestamp: new Date().toISOString()
      }

      // 10. Trigger SMS alerts if emergency
      if (requiresImmediateAttention) {
        console.log('🚨 EMERGENCY DETECTED - Triggering SMS alerts')
        const smsResult = await this.sendEmergencySMSAlerts(callData, context, detectedLanguage, finalScore)
        result.smsAlertsSent = smsResult.technicianSMS.success || smsResult.customerSMS.success
      }

      console.log(`✅ Emergency analysis complete: ${finalScore > 0.7 ? 'EMERGENCY' : 'NORMAL'} (${finalScore.toFixed(2)})`)
      return result

    } catch (error) {
      console.error('Error calculating urgency score:', error)
      throw new Error(`Emergency detection failed: ${error}`)
    }
  }

  /**
   * Send emergency SMS alerts to technicians and customers
   */
  async sendEmergencySMSAlerts(
    callData: CallData,
    context: CallContext,
    language: 'en' | 'es',
    urgency: number
  ): Promise<SMSAlertResult> {
    try {
      console.log(`Sending emergency SMS alerts for ${context.businessName} (${language})`)

      const result: SMSAlertResult = {
        technicianSMS: { success: false },
        customerSMS: { success: false },
        statusUpdateScheduled: false
      }

      // 1. Send technician alert (always in English)
      try {
        const technicianAlert = await this.smsDispatcher.sendTechnicianAlert({
          customerName: callData.customerName,
          customerPhone: callData.customerPhone,
          customerAddress: callData.customerAddress || 'Address not provided',
          issueDescription: callData.issueDescription,
          urgencyLevel: urgency > 0.8 ? 'HIGH' : 'MEDIUM',
          businessName: context.businessName,
          emergencyContactPhone: context.emergencyContactPhone
        })

        result.technicianSMS = {
          success: technicianAlert.success,
          messageId: technicianAlert.messageId,
          error: technicianAlert.error
        }

        console.log(`✅ Technician alert sent: ${technicianAlert.success}`)
      } catch (error) {
        console.error('Error sending technician alert:', error)
        result.technicianSMS.error = String(error)
      }

      // 2. Send customer confirmation (in their language)
      try {
        const customerConfirmation = await this.smsDispatcher.sendCustomerConfirmation({
          customerPhone: callData.customerPhone,
          language,
          businessName: context.businessName,
          estimatedArrival: this.getEstimatedArrivalTime(urgency),
          emergencyContactPhone: context.emergencyContactPhone,
          industryCode: this.template.industry_code
        })

        result.customerSMS = {
          success: customerConfirmation.success,
          messageId: customerConfirmation.messageId,
          error: customerConfirmation.error
        }

        console.log(`✅ Customer confirmation sent: ${customerConfirmation.success}`)
      } catch (error) {
        console.error('Error sending customer confirmation:', error)
        result.customerSMS.error = String(error)
      }

      // 3. Schedule status update SMS
      try {
        await this.smsDispatcher.scheduleStatusUpdate({
          customerPhone: callData.customerPhone,
          language,
          businessName: context.businessName,
          industryCode: this.template.industry_code
        })

        result.statusUpdateScheduled = true
        console.log(`✅ Status update SMS scheduled`)
      } catch (error) {
        console.error('Error scheduling status update:', error)
      }

      return result

    } catch (error) {
      console.error('Error sending emergency SMS alerts:', error)
      throw new Error(`SMS alert dispatch failed: ${error}`)
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Get cultural context from conversation
   */
  private getCulturalContext(language: 'en' | 'es', transcript: string): string {
    if (language === 'es') {
      // Spanish cultural indicators
      if (transcript.includes('usted') || transcript.includes('señor') || transcript.includes('señora')) {
        return 'formal_respectful'
      } else if (transcript.includes('tú') || transcript.includes('contigo')) {
        return 'informal_friendly'
      } else {
        return 'neutral_polite'
      }
    } else {
      // English cultural indicators
      if (transcript.includes('please') || transcript.includes('thank you')) {
        return 'polite_professional'
      } else if (transcript.includes('urgent') || transcript.includes('emergency')) {
        return 'direct_urgent'
      } else {
        return 'neutral_professional'
      }
    }
  }

  /**
   * Get industry-specific modifiers applied
   */
  private getIndustryModifiers(industryCode: string, context: CallContext): string[] {
    const modifiers: string[] = []

    switch (industryCode) {
      case 'hvac':
        if (context.weatherData?.temperature < 32) {
          modifiers.push('winter_heating_emergency')
        } else if (context.weatherData?.temperature > 90) {
          modifiers.push('summer_cooling_emergency')
        }
        break

      case 'plumbing':
        if (context.weatherData?.temperature < 32) {
          modifiers.push('freezing_pipe_risk')
        }
        break

      case 'electrical':
        modifiers.push('safety_hazard_priority')
        break
    }

    return modifiers
  }

  /**
   * Get estimated arrival time based on urgency
   */
  private getEstimatedArrivalTime(urgency: number): string {
    if (urgency > 0.9) {
      return '15-30 minutes'
    } else if (urgency > 0.8) {
      return '30-45 minutes'
    } else if (urgency > 0.7) {
      return '45-60 minutes'
    } else {
      return '1-2 hours'
    }
  }

  // =====================================================
  // Emergency Event Logging
  // =====================================================

  /**
   * Log emergency detection event
   */
  async logEmergencyEvent(
    organizationId: string,
    callData: CallData,
    result: EmergencyResult,
    context: CallContext
  ): Promise<void> {
    try {
      // This would integrate with the database to log emergency events
      console.log(`📝 Logging emergency event for ${organizationId}`)
      console.log(`   Urgency: ${result.urgencyScore}`)
      console.log(`   Language: ${result.detectedLanguage}`)
      console.log(`   Keywords: ${result.emergencyKeywordsFound.join(', ')}`)
      console.log(`   Immediate Attention: ${result.requiresImmediateAttention}`)
    } catch (error) {
      console.error('Error logging emergency event:', error)
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create emergency detector for industry template
 */
export function createEmergencyDetector(template: IndustryTemplate): MultilingualEmergencyDetector {
  return new MultilingualEmergencyDetector(template)
}

/**
 * Create emergency detector from template service
 */
export async function createEmergencyDetectorFromTemplate(
  industryCode: string,
  language: 'en' | 'es'
): Promise<MultilingualEmergencyDetector> {
  const templateService = new TemplateService()
  const template = await templateService.getTemplate(industryCode, language)
  
  if (!template) {
    throw new Error(`Template not found for ${industryCode} in ${language}`)
  }

  return new MultilingualEmergencyDetector(template)
}
