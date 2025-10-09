// API Route: Create Multilingual Vapi Assistant
// Task 2.1: Multi-Language Vapi Assistant Creation

import { NextRequest, NextResponse } from 'next/server'
import { createServerVapiService } from '@/lib/vapi/multilingual-vapi-service'
import { createServerClient } from '@/lib/supabase/server'
import type { BusinessData } from '@/lib/templates/types'

interface CreateAssistantRequest {
  organizationId: string
  industryCode: string
  businessData: BusinessData
  languagePreference?: 'en' | 'es'
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body: CreateAssistantRequest
    try {
      const rawBody = await request.text()
      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'Request body is empty'
        }, { status: 400 })
      }
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 })
    }

    const { organizationId, industryCode, businessData, languagePreference = 'en' } = body

    // Validate required fields
    if (!organizationId || !industryCode || !businessData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: organizationId, industryCode, businessData'
      }, { status: 400 })
    }

    // Validate business data
    if (!businessData.business_name || !businessData.business_phone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required business data: business_name, business_phone'
      }, { status: 400 })
    }

    // Check if user has access to organization
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this organization'
      }, { status: 403 })
    }

    // Create multilingual assistant
    const vapiService = createServerVapiService()
    console.log('🚀 Creating assistant for org:', organizationId, 'industry:', industryCode, 'language:', languagePreference)
    console.log('🔑 VAPI_API_KEY present:', !!process.env.VAPI_API_KEY)
    console.log('🌐 VAPI_BASE_URL:', process.env.NEXT_PUBLIC_VAPI_BASE_URL || 'https://api.vapi.ai')
    
    const assistant = await vapiService.createMultilingualAssistant(
      organizationId,
      industryCode,
      businessData,
      languagePreference
    )

    console.log('✅ Assistant created successfully:', assistant.id)

    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        phoneNumber: assistant.phoneNumber,
        status: assistant.status,
        createdAt: assistant.createdAt,
        industryCode,
        languagePreference
      }
    })

  } catch (error) {
    console.error('❌ Error creating multilingual assistant:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create assistant',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organizationId is required'
      }, { status: 400 })
    }

    // Check authentication
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get assistants for organization
    const { data: assistants, error } = await supabase
      .from('vapi_assistants')
      .select(`
        id,
        industry_code,
        language_code,
        vapi_assistant_id,
        vapi_phone_number,
        business_data,
        voice_config,
        is_active,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      assistants: assistants || []
    })

  } catch (error) {
    console.error('Error fetching assistants:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assistants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
