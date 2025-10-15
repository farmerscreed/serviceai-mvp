// API Route: Unified Vapi Webhook Handler (Multi-Tenant)
// Handles webhooks for ALL organizations - identifies org from call data

import { NextRequest, NextResponse } from 'next/server'
import { createMultilingualWebhookHandler } from '@/lib/webhooks/multilingual-webhook-handler'
import { errorHandler, logger, type ErrorContext } from '@/lib/utils/error-handler'
import type { VapiWebhookData } from '@/lib/webhooks/multilingual-webhook-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const context: ErrorContext = {
    operation: 'vapi_webhook_handler_unified'
  }

  try {
    // Get raw payload for signature verification
    const rawPayload = await request.text()
    const webhookData: VapiWebhookData = JSON.parse(rawPayload)

    // Extract call information
    const callData = webhookData.message?.call || webhookData.call
    const phoneNumber = webhookData.message?.phoneNumber || webhookData.phoneNumber
    const assistantId = webhookData.message?.assistant?.id || webhookData.assistant?.id

    console.log(`📞 Received webhook for call: ${callData?.id}`)
    console.log(`📱 Phone number: ${phoneNumber}`)
    console.log(`🤖 Assistant ID: ${assistantId}`)

    // Lookup organization from call data
    const organizationId = await lookupOrganizationFromCallData(
      assistantId,
      phoneNumber,
      callData?.id
    )

    if (!organizationId) {
      const error = new Error(
        `Could not identify organization for call. Assistant: ${assistantId}, Phone: ${phoneNumber}`
      )
      logger.error('Organization lookup failed', error, context)
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found for this assistant'
        },
        { status: 404 }
      )
    }

    console.log(`✅ Identified organization: ${organizationId}`)

    // Update context with organization ID
    context.organizationId = organizationId
    context.callId = callData?.id

    // Validate webhook data
    const eventType = webhookData.message?.type || webhookData.type
    if (!eventType) {
      const error = errorHandler.handleError(
        new Error('Webhook type is required'),
        { ...context, operation: 'validate_webhook_data' }
      )
      return NextResponse.json(error, { status: error.statusCode })
    }

    logger.info(`Received webhook for organization ${organizationId}: ${eventType}`, context)

    // Create webhook handler
    const handler = createMultilingualWebhookHandler()

    // Process webhook with signature verification
    const result = await handler.handleWebhook(
      organizationId,
      webhookData,
      request.headers,
      rawPayload
    )

    if (result.success) {
      logger.info(`Webhook processed successfully for organization ${organizationId}`, context)
      // For tool calls, Vapi expects the results wrapped in a "results" object.
      // Format: { "results": [{ "toolCallId": "...", "result": "..." }] }
      if (eventType === 'tool-calls') {
        return NextResponse.json({ results: result.result })
      }
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      logger.error(
        `Webhook processing failed for organization ${organizationId}: ${result.error}`,
        new Error(result.error),
        context
      )
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }
  } catch (error) {
    const handledError = errorHandler.handleError(error, context)
    logger.error('Error processing Vapi webhook', error as Error, context)
    return NextResponse.json(handledError, { status: handledError.statusCode })
  }
}

/**
 * Lookup organization from Vapi call data
 * Tries multiple methods in order of preference:
 * 1. Assistant ID (most reliable)
 * 2. Phone number
 * 3. Call ID (from call_logs table if call was already logged)
 */
async function lookupOrganizationFromCallData(
  assistantId?: string,
  phoneNumber?: string,
  callId?: string
): Promise<string | null> {
  const supabase = await createServiceRoleClient()

  // Method 1: Lookup by Assistant ID (most reliable for multi-tenant)
  if (assistantId) {
    console.log(`🔍 Looking up organization by assistant ID: ${assistantId}`)
    const { data, error } = await supabase
      .from('vapi_assistants')
      .select('organization_id, vapi_assistant_id, vapi_phone_number')
      .eq('vapi_assistant_id', assistantId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error(`❌ Database error looking up by assistant ID:`, error)
    }

    if (!error && data) {
      console.log(`✅ Found organization by assistant ID: ${data.organization_id}`)
      return data.organization_id
    } else {
      console.log(`⚠️ No data found for assistant ID: ${assistantId}`)
    }
  }

  // Method 2: Lookup by Phone Number
  if (phoneNumber) {
    console.log(`🔍 Looking up organization by phone number: ${phoneNumber}`)
    const { data, error } = await supabase
      .from('vapi_assistants')
      .select('organization_id')
      .eq('vapi_phone_number', phoneNumber)
      .eq('is_active', true)
      .single()

    if (!error && data) {
      console.log(`✅ Found organization by phone number: ${data.organization_id}`)
      return data.organization_id
    }
  }

  // Method 3: Lookup by Call ID (if this is a follow-up webhook for an existing call)
  if (callId) {
    console.log(`🔍 Looking up organization by call ID: ${callId}`)
    const { data, error } = await supabase
      .from('call_logs')
      .select('organization_id')
      .eq('vapi_call_id', callId)
      .single()

    if (!error && data) {
      console.log(`✅ Found organization by call ID: ${data.organization_id}`)
      return data.organization_id
    }
  }

  console.log(`❌ Could not find organization for assistant: ${assistantId}, phone: ${phoneNumber}, call: ${callId}`)
  return null
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Vapi webhook endpoint is active - using vapi_assistants table',
    multiTenant: true,
    identificationMethods: [
      'assistant_id (from vapi_assistants.vapi_assistant_id)',
      'phone_number (from vapi_assistants.vapi_phone_number)',
      'call_id (from call_logs.vapi_call_id)'
    ],
    lastUpdated: new Date().toISOString()
  })
}
