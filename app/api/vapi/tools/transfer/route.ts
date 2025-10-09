import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolCallId, message, call, parameters } = body
    
    console.log('📞 Call transfer request received:', {
      toolCallId,
      callId: call?.id || message?.call?.id,
      reason: parameters?.reason,
      urgency: parameters?.urgency
    })
    
    // Extract organization from call metadata
    const callData = call || message?.call
    const organizationId = callData?.metadata?.organizationId
    
    if (!organizationId) {
      console.error('❌ No organization ID in call metadata')
      return NextResponse.json({
        results: [{
          toolCallId,
          result: {
            success: false,
            error: 'Organization not found in call metadata'
          }
        }]
      }, { status: 400 })
    }
    
    const supabase = await createServerClient()
    
    // Get organization's transfer settings
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('transfer_phone_number, transfer_mode, emergency_contact_phone, organization_name')
      .eq('id', organizationId)
      .single()
    
    if (orgError || !org) {
      console.error('❌ Organization not found:', orgError)
      return NextResponse.json({
        results: [{
          toolCallId,
          result: {
            success: false,
            error: 'Organization configuration not found'
          }
        }]
      }, { status: 400 })
    }
    
    if (!org.transfer_phone_number) {
      console.error('❌ No transfer number configured for organization')
      return NextResponse.json({
        results: [{
          toolCallId,
          result: {
            success: false,
            error: 'No transfer number configured. Please set up call transfer in settings.'
          }
        }]
      }, { status: 400 })
    }
    
    // Choose transfer number based on urgency
    const transferNumber = parameters.urgency === 'emergency' 
      ? (org.emergency_contact_phone || org.transfer_phone_number)
      : org.transfer_phone_number
    
    console.log(`📞 Transferring to: ${transferNumber} (urgency: ${parameters.urgency})`)
    
    // Log the transfer request
    const { error: logError } = await supabase
      .from('call_transfers')
      .insert({
        organization_id: organizationId,
        vapi_call_id: callData?.id,
        reason: parameters.reason,
        urgency: parameters.urgency,
        summary: parameters.summary,
        customer_name: parameters.customer_name,
        customer_phone: parameters.customer_phone,
        transfer_to: transferNumber,
        status: 'initiated',
        metadata: {
          issue_category: parameters.issue_category,
          transfer_mode: org.transfer_mode,
          timestamp: new Date().toISOString()
        }
      })
    
    if (logError) {
      console.error('⚠️ Failed to log transfer (non-critical):', logError)
    } else {
      console.log('✅ Transfer logged successfully')
    }
    
    // Prepare transfer message based on urgency and language
    let transferMessage = 'Let me connect you with a team member who can better assist you. Please hold for just a moment.'
    
    if (parameters.urgency === 'emergency') {
      transferMessage = 'I understand this is urgent. I\'m connecting you with our emergency contact right away. Please stay on the line.'
    } else if (parameters.urgency === 'high') {
      transferMessage = 'I\'m connecting you with a specialist who can help you with this right away.'
    }
    
    // Return transfer instruction to Vapi
    // Vapi will handle the actual call transfer
    return NextResponse.json({
      results: [{
        toolCallId,
        result: {
          success: true,
          action: 'transfer',
          transferTo: transferNumber,
          message: transferMessage,
          transferMode: org.transfer_mode || 'warm',
          metadata: {
            reason: parameters.reason,
            urgency: parameters.urgency,
            summary: parameters.summary
          }
        }
      }]
    })
    
  } catch (error: any) {
    console.error('❌ Transfer error:', error)
    return NextResponse.json({
      results: [{
        toolCallId: 'unknown',
        result: {
          success: false,
          error: error.message || 'Internal server error'
        }
      }]
    }, { status: 500 })
  }
}
