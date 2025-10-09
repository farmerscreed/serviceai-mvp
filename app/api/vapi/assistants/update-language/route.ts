// API Route: Update Assistant Language
// Task 2.1: Multi-Language Vapi Assistant Creation

import { NextRequest, NextResponse } from 'next/server'
import { createServerVapiService } from '@/lib/vapi/multilingual-vapi-service'
import { createServerClient } from '@/lib/supabase/server'

interface UpdateLanguageRequest {
  assistantId: string
  newLanguage: 'en' | 'es'
}

export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateLanguageRequest = await request.json()
    const { assistantId, newLanguage } = body

    // Validate required fields
    if (!assistantId || !newLanguage) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: assistantId, newLanguage'
      }, { status: 400 })
    }

    // Validate language
    if (!['en', 'es'].includes(newLanguage)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid language. Must be "en" or "es"'
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

    // Verify user has access to assistant
    const { data: assistant } = await supabase
      .from('vapi_assistants')
      .select(`
        id,
        organization_id,
        industry_code,
        language_code,
        vapi_assistant_id
      `)
      .eq('vapi_assistant_id', assistantId)
      .single()

    if (!assistant) {
      return NextResponse.json({
        success: false,
        error: 'Assistant not found'
      }, { status: 404 })
    }

    // Check if user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', assistant.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this organization'
      }, { status: 403 })
    }

    // Update assistant language
    const vapiService = createServerVapiService()
    const updatedAssistant = await vapiService.updateAssistantLanguage(
      assistantId,
      newLanguage
    )

    return NextResponse.json({
      success: true,
      assistant: {
        id: updatedAssistant.id,
        name: updatedAssistant.name,
        status: updatedAssistant.status,
        language: newLanguage,
        updatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating assistant language:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update assistant language',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
