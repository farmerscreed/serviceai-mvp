import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { TwilioSMSService } from '@/lib/sms/twilio-sms-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { phone, language, templateKey, testData } = body
    
    if (!phone || !language || !templateKey) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, language, templateKey' },
        { status: 400 }
      )
    }
    
    // Get user's organization for logging
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    
    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    
    // Initialize SMS service
    const smsService = new TwilioSMSService()
    
    // Prepare test data with defaults
    const defaultTestData = {
      name: testData?.name || 'John Doe',
      date: testData?.date || 'March 15, 2025',
      time: testData?.time || '2:00 PM',
      business_phone: testData?.business_phone || process.env.TWILIO_PHONE_NUMBER || '+15551234567',
      address: testData?.address || '123 Main St',
      service_type: testData?.service_type || 'HVAC Maintenance',
      business_name: testData?.business_name || 'Test Company',
      customer_name: testData?.customer_name || 'John Doe'
    }
    
    // Send test SMS
    const result = await smsService.sendMultilingualSMS(
      phone,
      templateKey,
      language as 'en' | 'es',
      {
        ...defaultTestData,
        customer_id: membership.organization_id,
        organization_id: membership.organization_id
      }
    )
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully',
        messageId: result.messageId,
        language: result.languageUsed,
        content: result.content
      })
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send SMS'
        },
        { status: 400 }
      )
    }
    
  } catch (error: any) {
    console.error('SMS test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

