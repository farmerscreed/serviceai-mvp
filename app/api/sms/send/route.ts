// SMS Send API - Task 3.1
// Send SMS messages to customers

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { TwilioSMSService } from '@/lib/sms/twilio-sms-service'
import { z } from 'zod'

// Request validation schema
const SendSMSRequestSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  templateKey: z.string().min(1, 'Template key is required'),
  language: z.enum(['en', 'es']).default('en'),
  data: z.record(z.any()).optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
  customerId: z.string().uuid('Invalid customer ID').optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('📱 SMS Send API called')

    // Parse and validate request
    const body = await request.json()
    const validatedData = SendSMSRequestSchema.parse(body)

    // Get organization context
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify organization access
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', validatedData.organizationId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      )
    }

    // Create SMS service
    const smsService = new TwilioSMSService()

    // Prepare SMS data
    const smsData = {
      organization_id: validatedData.organizationId,
      customer_id: validatedData.customerId,
      ...validatedData.data
    }

    // Send SMS
    const result = await smsService.sendMultilingualSms(
      validatedData.phoneNumber,
      validatedData.templateKey,
      validatedData.language,
      smsData
    )

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to send SMS',
          details: result.error 
        },
        { status: 500 }
      )
    }

    console.log(`✅ SMS sent successfully: ${result.message_id}`)

    return NextResponse.json({
      success: true,
      messageId: result.message_id,
      language: result.language_used,
      content: result.content
    })

  } catch (error) {
    console.error('SMS Send API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
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
