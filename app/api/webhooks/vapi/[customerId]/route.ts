// API Route: Vapi Webhook Handler
// Task 2.3: SMS-Integrated Webhook Handler

import { NextRequest, NextResponse } from 'next/server'
import { createMultilingualWebhookHandler } from '@/lib/webhooks/multilingual-webhook-handler'
import type { VapiWebhookData } from '@/lib/webhooks/multilingual-webhook-handler'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const webhookData: VapiWebhookData = await request.json()

    console.log(`🔗 Received webhook for customer ${customerId}: ${webhookData.type}`)

    // Validate customer ID
    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 })
    }

    // Validate webhook data
    if (!webhookData.type) {
      return NextResponse.json({
        success: false,
        error: 'Webhook type is required'
      }, { status: 400 })
    }

    // Create webhook handler
    const handler = createMultilingualWebhookHandler()

    // Process webhook
    const result = await handler.handleWebhook(customerId, webhookData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        result: result.result
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error processing Vapi webhook:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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
