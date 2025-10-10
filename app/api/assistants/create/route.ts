import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServerVapiService } from '@/lib/vapi/multilingual-vapi-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      organizationId,
      assistantName,
      industryCode,
      language,
      businessName,
      businessPhone
    } = body

    // Validate required fields
    if (!organizationId || !industryCode) {
      return NextResponse.json({
        error: 'Missing required fields: organizationId and industryCode are required'
      }, { status: 400 })
    }

    // Verify user is part of the organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({
        error: 'Forbidden: You are not a member of this organization'
      }, { status: 403 })
    }

    // Prepare business data for assistant creation (using snake_case as expected by VAPI service)
    const businessData = {
      business_name: businessName || assistantName || 'Business',
      business_phone: businessPhone || '',
      business_address: '', // TODO: Add address field to onboarding
      business_email: '', // TODO: Add email field to onboarding
      primary_language: language || 'en',
      supported_languages: [language || 'en'],
      timezone: 'America/New_York', // TODO: Get from organization settings
      emergency_contact_phone: '', // TODO: Add emergency contact to onboarding
      emergency_contact_email: '', // TODO: Add emergency email to onboarding
      sms_enabled: true
    }

    // Create multilingual assistant using the VAPI service
    const vapiService = createServerVapiService()
    const assistant = await vapiService.createMultilingualAssistant(
      organizationId,
      industryCode,
      businessData,
      language || 'en'
    )

    return NextResponse.json({
      success: true,
      assistant
    })
  } catch (error: any) {
    console.error('Assistant creation error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
