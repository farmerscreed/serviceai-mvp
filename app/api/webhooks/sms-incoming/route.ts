// SMS Incoming Webhook - Task 3.1
// Handle incoming SMS messages from Twilio

import { NextRequest, NextResponse } from 'next/server'
import { TwoWaySMSHandler } from '@/lib/sms/two-way-sms-handler'
import { z } from 'zod'

// Twilio webhook validation schema
const TwilioWebhookSchema = z.object({
  MessageSid: z.string(),
  From: z.string(),
  To: z.string(),
  Body: z.string(),
  Timestamp: z.string(),
  MediaUrl0: z.string().optional(),
  MediaUrl1: z.string().optional(),
  MediaUrl2: z.string().optional(),
  MediaUrl3: z.string().optional(),
  MediaUrl4: z.string().optional(),
  MediaUrl5: z.string().optional(),
  MediaUrl6: z.string().optional(),
  MediaUrl7: z.string().optional(),
  MediaUrl8: z.string().optional(),
  MediaUrl9: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('📱 SMS Incoming Webhook called')

    // Parse Twilio webhook data
    const formData = await request.formData()
    const webhookData = Object.fromEntries(formData.entries())

    // Validate webhook data
    const validatedData = TwilioWebhookSchema.parse(webhookData)

    // Extract media URLs
    const mediaUrls: string[] = []
    for (let i = 0; i < 10; i++) {
      const mediaUrl = validatedData[`MediaUrl${i}` as keyof typeof validatedData] as string
      if (mediaUrl) {
        mediaUrls.push(mediaUrl)
      }
    }

    // Create incoming SMS object
    const incomingSMS = {
      messageId: validatedData.MessageSid,
      from: validatedData.From,
      to: validatedData.To,
      body: validatedData.Body,
      timestamp: validatedData.Timestamp,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
    }

    console.log(`📱 Processing SMS from ${incomingSMS.from}`)
    console.log(`   Message: ${incomingSMS.body}`)
    if (mediaUrls.length > 0) {
      console.log(`   Media URLs: ${mediaUrls.length}`)
    }

    // Handle incoming SMS
    const smsHandler = new TwoWaySMSHandler()
    const response = await smsHandler.handleIncomingSMS(incomingSMS)

    if (!response.success) {
      console.error(`❌ SMS handling failed: ${response.error}`)
      return NextResponse.json(
        { 
          error: 'SMS processing failed',
          details: response.error 
        },
        { status: 500 }
      )
    }

    console.log(`✅ SMS processed successfully: ${response.action}`)

    // Send response SMS if needed
    if (response.message) {
      try {
        // Note: In a real implementation, you would send the response SMS here
        // For now, we'll just log it
        console.log(`📤 Response SMS: ${response.message}`)
      } catch (error) {
        console.error('Error sending response SMS:', error)
      }
    }

    return NextResponse.json({
      success: true,
      action: response.action,
      message: response.message
    })

  } catch (error) {
    console.error('SMS Incoming Webhook error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid webhook data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
