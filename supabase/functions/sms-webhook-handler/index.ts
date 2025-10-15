// SMS Webhook Handler - Delivery Status and Incoming Messages
// Handles Twilio and Vonage webhooks for SMS delivery status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwilioWebhookData {
  MessageSid: string
  MessageStatus: 'sent' | 'delivered' | 'failed' | 'undelivered'
  To: string
  From: string
  Body?: string
  ErrorCode?: string
  ErrorMessage?: string
}

interface VonageWebhookData {
  messageId: string
  status: 'delivered' | 'failed' | 'rejected'
  to: string
  from: string
  'error-code'?: string
  'error-code-label'?: string
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

    const url = new URL(req.url)
    const provider = url.searchParams.get('provider') || 'twilio'

    console.log(`📱 SMS Webhook received from ${provider}`)

    let webhookData: any = {}

    if (provider === 'twilio') {
      // Handle Twilio webhook
      const formData = await req.formData()
      webhookData = Object.fromEntries(formData.entries())
      
      // Validate Twilio signature (optional but recommended)
      const signature = req.headers.get('x-twilio-signature')
      if (signature) {
        // In production, validate the signature here
        console.log('Twilio signature received:', signature)
      }
    } else if (provider === 'vonage') {
      // Handle Vonage webhook
      webhookData = await req.json()
    } else {
      throw new Error('Invalid provider')
    }

    console.log('Webhook data:', webhookData)

    // Process webhook based on provider
    if (provider === 'twilio') {
      await processTwilioWebhook(supabaseClient, webhookData as TwilioWebhookData)
    } else if (provider === 'vonage') {
      await processVonageWebhook(supabaseClient, webhookData as VonageWebhookData)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('SMS webhook error:', error)
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
// Provider-Specific Handlers
// =====================================================

/**
 * Process Twilio webhook
 */
async function processTwilioWebhook(
  supabaseClient: any,
  data: TwilioWebhookData
): Promise<void> {
  console.log(`Processing Twilio webhook for message ${data.MessageSid}`)

  // Update SMS communication status
  const { error: updateError } = await supabaseClient
    .from('sms_communications')
    .update({
      status: mapTwilioStatus(data.MessageStatus),
      delivered_at: data.MessageStatus === 'delivered' ? new Date().toISOString() : null,
      error_message: data.ErrorMessage || null,
      error_code: data.ErrorCode || null,
      updated_at: new Date().toISOString()
    })
    .eq('external_message_id', data.MessageSid)

  if (updateError) {
    console.error('Error updating SMS status:', updateError)
    throw new Error(`Failed to update SMS status: ${updateError.message}`)
  }

  // If this is an incoming message, handle it
  if (data.Body && data.From && data.To) {
    await handleIncomingSMS(supabaseClient, {
      from: data.From,
      to: data.To,
      body: data.Body,
      messageId: data.MessageSid,
      provider: 'twilio'
    })
  }

  console.log(`✅ Twilio webhook processed for message ${data.MessageSid}`)
}

/**
 * Process Vonage webhook
 */
async function processVonageWebhook(
  supabaseClient: any,
  data: VonageWebhookData
): Promise<void> {
  console.log(`Processing Vonage webhook for message ${data.messageId}`)

  // Update SMS communication status
  const { error: updateError } = await supabaseClient
    .from('sms_communications')
    .update({
      status: mapVonageStatus(data.status),
      delivered_at: data.status === 'delivered' ? new Date().toISOString() : null,
      error_message: data['error-code-label'] || null,
      error_code: data['error-code'] || null,
      updated_at: new Date().toISOString()
    })
    .eq('external_message_id', data.messageId)

  if (updateError) {
    console.error('Error updating SMS status:', updateError)
    throw new Error(`Failed to update SMS status: ${updateError.message}`)
  }

  console.log(`✅ Vonage webhook processed for message ${data.messageId}`)
}

// =====================================================
// Incoming SMS Handler
// =====================================================

/**
 * Handle incoming SMS messages
 */
async function handleIncomingSMS(
  supabaseClient: any,
  data: {
    from: string
    to: string
    body: string
    messageId: string
    provider: string
  }
): Promise<void> {
  console.log(`📱 Incoming SMS from ${data.from}: ${data.body}`)

  try {
    // Log incoming SMS
    await supabaseClient
      .from('sms_communications')
      .insert({
        phone_number: data.from,
        message_content: data.body,
        message_type: 'incoming',
        language_code: 'en', // Could be detected
        direction: 'inbound',
        status: 'received',
        external_message_id: data.messageId,
        provider: data.provider,
        created_at: new Date().toISOString()
      })

    // Handle common SMS responses
    const message = data.body.toLowerCase().trim()

    if (message === 'stop' || message === 'unsubscribe') {
      await handleOptOut(supabaseClient, data.from)
    } else if (message === 'yes' || message === 'y' || message === 'si') {
      await handleConfirmation(supabaseClient, data.from)
    } else if (message.match(/^\d+$/)) {
      // Rating response (1-5 stars)
      const rating = parseInt(message)
      if (rating >= 1 && rating <= 5) {
        await handleRating(supabaseClient, data.from, rating)
      }
    } else {
      // General inquiry - could trigger AI response or forward to staff
      await handleGeneralInquiry(supabaseClient, data.from, data.body)
    }

  } catch (error) {
    console.error('Error handling incoming SMS:', error)
  }
}

/**
 * Handle opt-out requests
 */
async function handleOptOut(supabaseClient: any, phoneNumber: string): Promise<void> {
  console.log(`📱 Opt-out request from ${phoneNumber}`)

  // Update customer SMS preferences
  await supabaseClient
    .from('customers')
    .update({ sms_opt_in: false })
    .eq('phone_number', phoneNumber)

  // Send confirmation
  await sendOptOutConfirmation(supabaseClient, phoneNumber)
}

/**
 * Handle appointment confirmations
 */
async function handleConfirmation(supabaseClient: any, phoneNumber: string): Promise<void> {
  console.log(`📱 Confirmation from ${phoneNumber}`)

  // Find pending appointment
  const { data: appointment } = await supabaseClient
    .from('appointments')
    .select('*')
    .eq('customer_phone', phoneNumber)
    .eq('status', 'pending')
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .single()

  if (appointment) {
    // Confirm appointment
    await supabaseClient
      .from('appointments')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', appointment.id)

    // Send confirmation SMS
    await sendAppointmentConfirmed(supabaseClient, phoneNumber, appointment)
  }
}

/**
 * Handle rating responses
 */
async function handleRating(supabaseClient: any, phoneNumber: string, rating: number): Promise<void> {
  console.log(`📱 Rating ${rating} from ${phoneNumber}`)

  // Log rating
  await supabaseClient
    .from('customer_ratings')
    .insert({
      phone_number: phoneNumber,
      rating: rating,
      rating_type: 'sms_survey',
      created_at: new Date().toISOString()
    })

  // Send thank you message
  await sendRatingThankYou(supabaseClient, phoneNumber, rating)
}

/**
 * Handle general inquiries
 */
async function handleGeneralInquiry(supabaseClient: any, phoneNumber: string, message: string): Promise<void> {
  console.log(`📱 General inquiry from ${phoneNumber}: ${message}`)

  // Log inquiry
  await supabaseClient
    .from('customer_inquiries')
    .insert({
      phone_number: phoneNumber,
      message: message,
      inquiry_type: 'sms',
      status: 'new',
      created_at: new Date().toISOString()
    })

  // Send acknowledgment
  await sendInquiryAcknowledgment(supabaseClient, phoneNumber)
}

// =====================================================
// Response SMS Functions
// =====================================================

/**
 * Send opt-out confirmation
 */
async function sendOptOutConfirmation(supabaseClient: any, phoneNumber: string): Promise<void> {
  // This would trigger the SMS sending function
  console.log(`📱 Sending opt-out confirmation to ${phoneNumber}`)
  // Implementation would call the SMS sending function
}

/**
 * Send appointment confirmed message
 */
async function sendAppointmentConfirmed(supabaseClient: any, phoneNumber: string, appointment: any): Promise<void> {
  console.log(`📱 Sending appointment confirmed to ${phoneNumber}`)
  // Implementation would call the SMS sending function with template
}

/**
 * Send rating thank you
 */
async function sendRatingThankYou(supabaseClient: any, phoneNumber: string, rating: number): Promise<void> {
  console.log(`📱 Sending rating thank you to ${phoneNumber} for ${rating} stars`)
  // Implementation would call the SMS sending function
}

/**
 * Send inquiry acknowledgment
 */
async function sendInquiryAcknowledgment(supabaseClient: any, phoneNumber: string): Promise<void> {
  console.log(`📱 Sending inquiry acknowledgment to ${phoneNumber}`)
  // Implementation would call the SMS sending function
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Map Twilio status to our status
 */
function mapTwilioStatus(status: string): string {
  switch (status) {
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'failed':
    case 'undelivered':
      return 'failed'
    default:
      return 'sent'
  }
}

/**
 * Map Vonage status to our status
 */
function mapVonageStatus(status: string): string {
  switch (status) {
    case 'delivered':
      return 'delivered'
    case 'failed':
    case 'rejected':
      return 'failed'
    default:
      return 'sent'
  }
}
