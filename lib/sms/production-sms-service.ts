// Production SMS Service - Multi-Provider with Fallback
// Based on ChurchOS SMS system patterns for ServiceAI

import { createServiceRoleClient } from '@/lib/supabase/server'

export type SMSProvider = 'twilio' | 'vonage'

export interface SMSRecipient {
  phone: string
  name?: string
  organizationId?: string
}

export interface SMSOptions {
  to: SMSRecipient | SMSRecipient[]
  message: string
  from?: string
  provider?: SMSProvider
  templateKey?: string
  language?: 'en' | 'es'
  metadata?: Record<string, any>
}

export interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
  provider: SMSProvider
  cost?: number
  language?: string
  content?: string
}

export interface SMSProviderConfig {
  name: SMSProvider
  apiKey: string
  apiSecret?: string
  phoneNumber: string
  priority: number
  enabled: boolean
}

export class ProductionSMSService {
  private providers: SMSProviderConfig[] = []
  private supabase = createServiceRoleClient()

  constructor() {
    this.initializeProviders()
  }

  // =====================================================
  // Provider Management
  // =====================================================

  /**
   * Initialize SMS providers from environment and database
   */
  private async initializeProviders(): Promise<void> {
    // Load from environment variables (global fallback)
    const twilioConfig: SMSProviderConfig = {
      name: 'twilio',
      apiKey: process.env.TWILIO_ACCOUNT_SID || '',
      apiSecret: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      priority: 1,
      enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
    }

    const vonageConfig: SMSProviderConfig = {
      name: 'vonage',
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      phoneNumber: process.env.VONAGE_PHONE_NUMBER || '',
      priority: 2,
      enabled: !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET)
    }

    this.providers = [twilioConfig, vonageConfig].filter(p => p.enabled)
    this.providers.sort((a, b) => a.priority - b.priority)

    console.log(`📱 Initialized ${this.providers.length} SMS providers:`, 
      this.providers.map(p => p.name).join(', '))
  }

  /**
   * Get organization-specific SMS providers
   * This method loads SMS settings from the organization's database record
   */
  private async getOrganizationProviders(organizationId: string): Promise<SMSProviderConfig[]> {
    try {
      const { data: org, error } = await this.supabase
        .from('organizations')
        .select('twilio_account_sid, twilio_auth_token, twilio_phone_numbers, sms_enabled')
        .eq('id', organizationId)
        .single()

      if (error || !org || !org.sms_enabled) {
        // Fall back to environment-based providers
        return this.providers
      }

      const providers: SMSProviderConfig[] = []

      // Add organization-specific Twilio if configured
      if (org.twilio_account_sid && org.twilio_auth_token && org.twilio_phone_numbers?.[0]) {
        providers.push({
          name: 'twilio',
          apiKey: org.twilio_account_sid,
          apiSecret: org.twilio_auth_token,
          phoneNumber: org.twilio_phone_numbers[0],
          priority: 1,
          enabled: true
        })
      }

      // If organization has no providers, fall back to environment providers
      if (providers.length === 0) {
        return this.providers
      }

      return providers

    } catch (error) {
      console.error('Error loading organization SMS providers:', error)
      // Fall back to environment-based providers
      return this.providers
    }
  }

  // =====================================================
  // Core SMS Sending
  // =====================================================

  /**
   * Send SMS with automatic provider fallback
   */
  async sendSMS(options: SMSOptions, preferredProvider?: SMSProvider): Promise<SMSResponse> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to]
    let lastError: any = null

    // Get organization-specific providers if organizationId is provided
    const organizationId = recipients[0]?.organizationId || options.metadata?.organization_id
    const providersToUse = organizationId 
      ? await this.getOrganizationProviders(organizationId)
      : this.providers

    // Try providers in priority order
    const providersToTry = preferredProvider 
      ? [providersToUse.find(p => p.name === preferredProvider), ...providersToUse.filter(p => p.name !== preferredProvider)]
      : providersToUse

    for (const provider of providersToTry) {
      if (!provider) continue
      
      try {
        console.log(`📱 Attempting to send SMS via ${provider.name}${organizationId ? ` (org-specific)` : ``}`)
        
        const result = await this.sendViaProvider(provider, recipients, options)
        
        if (result.success) {
          // Log successful SMS
          await this.logSMSCommunication(recipients, options, result, provider.name)
          
          console.log(`✅ SMS sent successfully via ${provider.name}`)
          return result
        } else {
          throw new Error(result.error || 'Provider failed')
        }
      } catch (error) {
        lastError = error
        console.warn(`❌ Failed to send SMS via ${provider.name}:`, error.message)
      }
    }

    // All providers failed
    const errorResponse: SMSResponse = {
      success: false,
      error: lastError instanceof Error ? lastError.message : 'All SMS providers failed',
      provider: providersToUse[providersToUse.length - 1]?.name || 'twilio'
    }

    // Log failed SMS
    await this.logSMSCommunication(recipients, options, errorResponse, 'failed')

    return errorResponse
  }

  /**
   * Send SMS via specific provider
   */
  private async sendViaProvider(
    provider: SMSProviderConfig, 
    recipients: SMSRecipient[], 
    options: SMSOptions
  ): Promise<SMSResponse> {
    switch (provider.name) {
      case 'twilio':
        return await this.sendViaTwilio(provider, recipients, options)
      case 'vonage':
        return await this.sendViaVonage(provider, recipients, options)
      default:
        throw new Error(`Unknown provider: ${provider.name}`)
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(
    provider: SMSProviderConfig,
    recipients: SMSRecipient[],
    options: SMSOptions
  ): Promise<SMSResponse> {
    const results: SMSResponse[] = []

    for (const recipient of recipients) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${provider.apiKey}/Messages.json`
        const body = new URLSearchParams({
          To: this.formatPhoneNumber(recipient.phone),
          From: options.from || provider.phoneNumber,
          Body: options.message
        })

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${provider.apiKey}:${provider.apiSecret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        })

        if (response.ok) {
          const data = await response.json()
          results.push({
            success: true,
            messageId: data.sid,
            provider: 'twilio',
            cost: 0.0075, // Standard Twilio SMS cost
            language: options.language,
            content: options.message
          })
        } else {
          const errorText = await response.text()
          throw new Error(`Twilio API error: ${errorText}`)
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          provider: 'twilio'
        })
      }
    }

    // Return first result (for single recipient) or aggregate results
    if (results.length === 1) {
      return results[0]
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return {
      success: successCount > 0,
      messageId: results.find(r => r.success)?.messageId,
      error: failedCount > 0 ? `${failedCount} recipients failed` : undefined,
      provider: 'twilio',
      cost: results.reduce((sum, r) => sum + (r.cost || 0), 0)
    }
  }

  /**
   * Send SMS via Vonage
   */
  private async sendViaVonage(
    provider: SMSProviderConfig,
    recipients: SMSRecipient[],
    options: SMSOptions
  ): Promise<SMSResponse> {
    const results: SMSResponse[] = []

    for (const recipient of recipients) {
      try {
        const vonageUrl = 'https://rest.nexmo.com/sms/json'
        const body = new URLSearchParams({
          api_key: provider.apiKey,
          api_secret: provider.apiSecret!,
          to: this.formatPhoneNumber(recipient.phone),
          from: options.from || provider.phoneNumber,
          text: options.message
        })

        const response = await fetch(vonageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        })

        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages[0] && data.messages[0].status === '0') {
            results.push({
              success: true,
              messageId: data.messages[0]['message-id'],
              provider: 'vonage',
              cost: 0.005, // Standard Vonage SMS cost
              language: options.language,
              content: options.message
            })
          } else {
            throw new Error(`Vonage API error: ${data.messages?.[0]?.['error-text'] || 'Unknown error'}`)
          }
        } else {
          const errorText = await response.text()
          throw new Error(`Vonage API error: ${errorText}`)
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          provider: 'vonage'
        })
      }
    }

    // Return first result (for single recipient) or aggregate results
    if (results.length === 1) {
      return results[0]
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return {
      success: successCount > 0,
      messageId: results.find(r => r.success)?.messageId,
      error: failedCount > 0 ? `${failedCount} recipients failed` : undefined,
      provider: 'vonage',
      cost: results.reduce((sum, r) => sum + (r.cost || 0), 0)
    }
  }

  // =====================================================
  // Template-Based SMS
  // =====================================================

  /**
   * Send SMS using template
   */
  async sendTemplateSMS(
    templateKey: string,
    recipients: SMSRecipient[],
    data: Record<string, any>,
    language: 'en' | 'es' = 'en'
  ): Promise<SMSResponse> {
    try {
      // Get template from database
      const { data: template, error } = await this.supabase
        .from('sms_templates')
        .select('*')
        .eq('key', templateKey)
        .eq('language', language)
        .single()

      if (error || !template) {
        // Fallback to English if language not found
        if (language !== 'en') {
          return await this.sendTemplateSMS(templateKey, recipients, data, 'en')
        }
        throw new Error(`Template ${templateKey} not found`)
      }

      // Format template with data
      let message = template.content
      for (const [key, value] of Object.entries(data)) {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      }

      // Send SMS
      return await this.sendSMS({
        to: recipients,
        message,
        templateKey,
        language,
        metadata: { template_id: template.id, ...data }
      })

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      }
    }
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    
    if (cleaned.length > 10) {
      return `+${cleaned}`
    }
    
    return phone
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 15
  }

  /**
   * Log SMS communication to database
   */
  private async logSMSCommunication(
    recipients: SMSRecipient[],
    options: SMSOptions,
    result: SMSResponse,
    provider: string
  ): Promise<void> {
    try {
      for (const recipient of recipients) {
        await this.supabase
          .from('sms_communications')
          .insert({
            organization_id: recipient.organizationId || options.metadata?.organization_id,
            phone_number: recipient.phone,
            message_content: options.message,
            message_type: options.templateKey || 'manual',
            language_code: options.language || 'en',
            direction: 'outbound',
            status: result.success ? 'sent' : 'failed',
            external_message_id: result.messageId,
            template_key: options.templateKey,
            variables: options.metadata || {},
            error_message: result.error,
            provider: provider,
            cost: result.cost
          })
      }
    } catch (error) {
      console.error('Error logging SMS communication:', error)
    }
  }

  // =====================================================
  // Emergency SMS
  // =====================================================

  /**
   * Send emergency SMS to all emergency contacts
   */
  async sendEmergencySMS(
    organizationId: string,
    message: string,
    language: 'en' | 'es' = 'en'
  ): Promise<SMSResponse[]> {
    try {
      // Get emergency contacts
      const { data: contacts, error } = await this.supabase
        .from('emergency_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('sms_enabled', true)
        .eq('is_active', true)

      if (error || !contacts || contacts.length === 0) {
        throw new Error('No emergency contacts found')
      }

      const recipients: SMSRecipient[] = contacts.map(contact => ({
        phone: contact.phone,
        name: contact.name,
        organizationId
      }))

      // Send to all emergency contacts
      const results: SMSResponse[] = []
      for (const recipient of recipients) {
        const result = await this.sendSMS({
          to: recipient,
          message,
          language,
          metadata: { emergency: true, contact_id: recipient.name }
        })
        results.push(result)
      }

      return results

    } catch (error) {
      console.error('Error sending emergency SMS:', error)
      return [{
        success: false,
        error: error.message,
        provider: 'twilio'
      }]
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create production SMS service instance
 */
export function createProductionSMSService(): ProductionSMSService {
  return new ProductionSMSService()
}

// Export singleton instance
export const productionSMSService = new ProductionSMSService()
