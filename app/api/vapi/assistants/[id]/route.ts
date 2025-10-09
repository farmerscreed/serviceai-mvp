// API Route: Get Assistant Configuration
// Task 2.1: Multi-Language Vapi Assistant Creation

import { NextRequest, NextResponse } from 'next/server'
import { createServerVapiService } from '@/lib/vapi/multilingual-vapi-service'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assistantId } = await params

    if (!assistantId) {
      return NextResponse.json({
        success: false,
        error: 'Assistant ID is required'
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

    // Get assistant configuration
    const vapiService = createServerVapiService()
    const configuration = await vapiService.getAssistantConfiguration(assistantId)

    if (!configuration) {
      return NextResponse.json({
        success: false,
        error: 'Assistant configuration not found'
      }, { status: 404 })
    }

    // Verify user has access to assistant
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', configuration.organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this organization'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      configuration: {
        id: configuration.id,
        organizationId: configuration.organizationId,
        industryCode: configuration.industryCode,
        languageCode: configuration.languageCode,
        vapiAssistantId: configuration.vapiAssistantId,
        vapiPhoneNumber: configuration.vapiPhoneNumber,
        businessData: configuration.businessData,
        voiceConfig: configuration.voiceConfig,
        createdAt: configuration.createdAt,
        updatedAt: configuration.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching assistant configuration:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch assistant configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assistantId } = await params

    if (!assistantId) {
      return NextResponse.json({
        success: false,
        error: 'Assistant ID is required'
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

    // Get assistant configuration to verify access
    const vapiService = createServerVapiService()
    const configuration = await vapiService.getAssistantConfiguration(assistantId)

    if (!configuration) {
      return NextResponse.json({
        success: false,
        error: 'Assistant configuration not found'
      }, { status: 404 })
    }

    // Verify user has access to assistant
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', configuration.organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this organization'
      }, { status: 403 })
    }

    // Only owners and admins can delete assistants
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Insufficient permissions'
      }, { status: 403 })
    }

    // Delete assistant from Vapi (this would be implemented with actual Vapi client)
    // await vapiService.deleteAssistant(assistantId)

    // Mark as inactive in database
    const { error } = await supabase
      .from('vapi_assistants')
      .update({ is_active: false })
      .eq('vapi_assistant_id', assistantId)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Assistant deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting assistant:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete assistant',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
