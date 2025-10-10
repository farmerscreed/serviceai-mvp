// API Route: Vapi Webhook Handler
// Task 2.3: SMS-Integrated Webhook Handler

import { NextRequest, NextResponse } from 'next/server'
import { createMultilingualWebhookHandler } from '@/lib/webhooks/multilingual-webhook-handler'
import { errorHandler, logger, ERROR_CODES, type ErrorContext } from '@/lib/utils/error-handler'
import type { VapiWebhookData } from '@/lib/webhooks/multilingual-webhook-handler'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params
  const context: ErrorContext = {
    organizationId: customerId,
    operation: 'vapi_webhook_handler'
  }

  try {
    // Get raw payload for signature verification
    const rawPayload = await request.text()
    const webhookData: VapiWebhookData = JSON.parse(rawPayload)

    logger.info(`Received webhook for customer ${customerId}: ${webhookData.type}`, context)

    // Validate customer ID
    if (!customerId) {
      const error = errorHandler.handleError(
        new Error('Customer ID is required'),
        { ...context, operation: 'validate_customer_id' }
      )
      return NextResponse.json(error, { status: error.statusCode })
    }

    // Validate webhook data
    if (!webhookData.type) {
      const error = errorHandler.handleError(
        new Error('Webhook type is required'),
        { ...context, operation: 'validate_webhook_data' }
      )
      return NextResponse.json(error, { status: error.statusCode })
    }

    // Create webhook handler
    const handler = createMultilingualWebhookHandler()

    // Process webhook with signature verification
    const result = await handler.handleWebhook(
      customerId, 
      webhookData, 
      request.headers, 
      rawPayload
    )

    if (result.success) {
      logger.info(`Webhook processed successfully for customer ${customerId}`, context)
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      logger.error(`Webhook processing failed for customer ${customerId}: ${result.error}`, new Error(result.error), context)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    const handledError = errorHandler.handleError(error, context)
    logger.error('Error processing Vapi webhook', error as Error, context)
    return NextResponse.json(handledError, { status: handledError.statusCode })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const timeRange = searchParams.get('timeRange') || '24h'

    console.log(`📊 Getting webhook events for customer ${customerId}`)

    // This would fetch webhook events from database
    // For now, return mock data
    const mockEvents = [
      {
        id: 'event_1',
        event_type: 'tool-calls',
        detected_language: 'en',
        processed_at: new Date().toISOString(),
        success: true
      },
      {
        id: 'event_2',
        event_type: 'language-detected',
        detected_language: 'es',
        processed_at: new Date().toISOString(),
        success: true
      }
    ]

    return NextResponse.json({
      success: true,
      events: mockEvents,
      total: mockEvents.length
    })

  } catch (error) {
    console.error('Error fetching webhook events:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
