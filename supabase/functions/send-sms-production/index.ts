// Production SMS Edge Function - Multi-Provider with Fallback
// Based on ChurchOS SMS system for ServiceAI

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  type: 'individual' | 'emergency' | 'template'
  organizationId: string
  message?: string
  templateKey?: string
  templateData?: Record<string, any>
  language?: 'en' | 'es'
  phoneNumber?: string
  customerId?: string
  provider?: 'twilio' | 'vonage'
}

interface SMSRecipient {
  phone: string
  name?: string
  organizationId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      type, 
      organizationId, 
      message, 
      templateKey, 
      templateData = {}, 
      language = 'en',
      phoneNumber,
      customerId,
      provider = 'twilio'
    }: SMSRequest = await req.json()

    console.log(`📱 SMS Request: ${type} for organization ${organizationId}`)

    // Validate required fields
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    if (!type || !['individual', 'emergency', 'template'].includes(type)) {
      throw new Error('Valid type is required: individual, emergency, or template')
    }

    let recipients: SMSRecipient[] = []
    let finalMessage = message || ''

    // Get recipients based on type
    switch (type) {
      case 'individual':
        if (!phoneNumber && !customerId) {
          throw new Error('Phone number or customer ID is required for individual SMS')
        }

        if (phoneNumber) {
          recipients = [{
            phone: phoneNumber,
            organizationId
          }]
        } else if (customerId) {
          // Get customer phone from database
          const { data: customer, error: customerError } = await supabaseClient
            .from('customers')
            .select('phone_number, name')
            .eq('id', customerId)
            .eq('organization_id', organizationId)
            .single()

          if (customerError || !customer) {
            throw new Error('Customer not found')
          }

          if (!customer.phone_number) {
            throw new Error('Customer has no phone number')
          }

          recipients = [{
            phone: customer.phone_number,
            name: customer.name,
            organizationId
          }]
        }
        break

      case 'emergency':
        // Get emergency contacts
        const { data: emergencyContacts, error: emergencyError } = await supabaseClient
          .from('emergency_contacts')
          .select('phone, name')
          .eq('organization_id', organizationId)
          .eq('sms_enabled', true)
          .eq('is_active', true)

        if (emergencyError) {
          throw new Error(`Failed to get emergency contacts: ${emergencyError.message}`)
        }

        if (!emergencyContacts || emergencyContacts.length === 0) {
          throw new Error('No emergency contacts found')
        }

        recipients = emergencyContacts.map(contact => ({
          phone: contact.phone,
          name: contact.name,
          organizationId
        }))
        break

      case 'template':
        if (!templateKey) {
          throw new Error('Template key is required for template SMS')
        }

        // Get template
        const { data: template, error: templateError } = await supabaseClient
          .from('sms_templates')
          .select('*')
          .eq('key', templateKey)
          .eq('language', language)
          .eq('is_active', true)
          .single()

        if (templateError || !template) {
          // Try English fallback
          const { data: fallbackTemplate, error: fallbackError } = await supabaseClient
            .from('sms_templates')
            .select('*')
            .eq('key', templateKey)
            .eq('language', 'en')
            .eq('is_active', true)
            .single()

          if (fallbackError || !fallbackTemplate) {
            throw new Error(`Template ${templateKey} not found`)
          }

          // Use fallback template
          finalMessage = formatTemplate(fallbackTemplate.content, templateData)
        } else {
          finalMessage = formatTemplate(template.content, templateData)
        }

        // For template SMS, we need to determine recipients
        if (phoneNumber) {
          recipients = [{
            phone: phoneNumber,
            organizationId
          }]
        } else if (customerId) {
          const { data: customer, error: customerError } = await supabaseClient
            .from('customers')
            .select('phone_number, name')
            .eq('id', customerId)
            .eq('organization_id', organizationId)
            .single()

          if (customerError || !customer) {
            throw new Error('Customer not found')
          }

          recipients = [{
            phone: customer.phone_number,
            name: customer.name,
            organizationId
          }]
        } else {
          throw new Error('Phone number or customer ID required for template SMS')
        }
        break

      default:
        throw new Error('Invalid SMS type')
    }

    if (recipients.length === 0) {
      throw new Error('No recipients found')
    }

    if (!finalMessage) {
      throw new Error('No message content')
    }

    // Send SMS with automatic fallback between providers
    const smsPromises = recipients.map(async (recipient) => {
      try {
        let smsResult: any = null
        let usedProvider = 'unknown'
        let errorDetails = ''

        // Try Twilio first (if configured)
        if (provider === 'twilio' || provider === 'auto') {
          try {
            const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
            const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
            const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

            if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
              const body = new URLSearchParams({
                To: formatPhoneNumber(recipient.phone),
                From: twilioPhoneNumber,
                Body: finalMessage
              })

              const response = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
              })

              if (response.ok) {
                smsResult = await response.json()
                usedProvider = 'twilio'
              } else {
                const errorText = await response.text()
                errorDetails = `Twilio failed: ${errorText}`
                throw new Error(`Twilio API error: ${errorText}`)
              }
            } else {
              errorDetails = 'Twilio configuration incomplete'
              throw new Error('Twilio configuration incomplete')
            }
          } catch (twilioError) {
            errorDetails = twilioError.message
          }
        }

        // If Twilio failed or not configured, try Vonage
        if (!smsResult && (provider === 'vonage' || provider === 'auto')) {
          try {
            const vonageApiKey = Deno.env.get('VONAGE_API_KEY')
            const vonageApiSecret = Deno.env.get('VONAGE_API_SECRET')
            const vonagePhoneNumber = Deno.env.get('VONAGE_PHONE_NUMBER')

            if (vonageApiKey && vonageApiSecret && vonagePhoneNumber) {
              const vonageUrl = 'https://rest.nexmo.com/sms/json'
              const body = new URLSearchParams({
                api_key: vonageApiKey,
                api_secret: vonageApiSecret,
                to: formatPhoneNumber(recipient.phone),
                from: vonagePhoneNumber,
                text: finalMessage
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
                  smsResult = {
                    sid: data.messages[0]['message-id'],
                    status: 'sent'
                  }
                  usedProvider = 'vonage'
                } else {
                  throw new Error(`Vonage API error: ${data.messages?.[0]?.['error-text'] || 'Unknown error'}`)
                }
              } else {
                const errorText = await response.text()
                errorDetails += ` | Vonage failed: ${errorText}`
                throw new Error(`Vonage API error: ${errorText}`)
              }
            } else {
              errorDetails += ' | Vonage configuration incomplete'
              throw new Error('Vonage configuration incomplete')
            }
          } catch (vonageError) {
            errorDetails += ` | Vonage error: ${vonageError.message}`
          }
        }

        // If both providers failed, throw comprehensive error
        if (!smsResult) {
          throw new Error(`All SMS providers failed. ${errorDetails}`)
        }

        // Log successful SMS to database
        await supabaseClient
          .from('sms_communications')
          .insert({
            organization_id: organizationId,
            phone_number: recipient.phone,
            message_content: finalMessage,
            message_type: templateKey || 'manual',
            language_code: language,
            direction: 'outbound',
            status: 'sent',
            external_message_id: smsResult?.sid || smsResult?.message_id,
            template_key: templateKey,
            variables: templateData,
            provider: usedProvider,
            cost: usedProvider === 'twilio' ? 0.0075 : 0.005
          })

        return {
          recipient: recipient.name || recipient.phone,
          phone: recipient.phone,
          status: 'sent',
          message_id: smsResult?.sid || smsResult?.message_id,
          provider: usedProvider
        }
      } catch (error) {
        // Log failed SMS to database
        await supabaseClient
          .from('sms_communications')
          .insert({
            organization_id: organizationId,
            phone_number: recipient.phone,
            message_content: finalMessage,
            message_type: templateKey || 'manual',
            language_code: language,
            direction: 'outbound',
            status: 'failed',
            error_message: error.message,
            template_key: templateKey,
            variables: templateData,
            provider: 'unknown'
          })

        return {
          recipient: recipient.name || recipient.phone,
          phone: recipient.phone,
          status: 'failed',
          error: error.message
        }
      }
    })

    const results = await Promise.all(smsPromises)
    const sentCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS ${type} completed: ${sentCount} sent, ${failedCount} failed`,
        results: results,
        totalSent: sentCount,
        totalFailed: failedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('SMS send error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// =====================================================
// Helper Functions
// =====================================================

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phone: string): string {
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
 * Format template with data
 */
function formatTemplate(template: string, data: Record<string, any>): string {
  let content = template

  // Replace variables with data
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`
    content = content.replace(new RegExp(placeholder, 'g'), String(value))
  }

  return content
}
