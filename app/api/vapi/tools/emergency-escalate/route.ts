import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { TwilioSMSService } from '@/lib/sms/twilio-sms-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolCallId, message, call, parameters } = body
    
    console.log('🚨 EMERGENCY ESCALATION:', {
      type: parameters?.emergency_type,
      severity: parameters?.severity,
      location: parameters?.location
    })
    
    const callData = call || message?.call
    const organizationId = callData?.metadata?.organizationId
    
    if (!organizationId) {
      return NextResponse.json({
        results: [{
          toolCallId,
          result: { success: false, error: 'Organization not found' }
        }]
      }, { status: 400 })
    }
    
    const supabase = await createServerClient()
    
    // Get on-call emergency contact
    const { data: contact, error: contactError } = await supabase
      .rpc('get_on_call_contact', {
        org_id: organizationId,
        urgency: 'emergency'
      })
    
    let emergencyPhone: string | null = null
    let contactName = 'Emergency Contact'
    
    if (contact && !contactError) {
      emergencyPhone = contact.phone
      contactName = contact.name
      console.log(`✅ Found on-call contact: ${contactName}`)
    } else {
      // Fallback to organization emergency contact
      const { data: org } = await supabase
        .from('organizations')
        .select('emergency_contact_phone, transfer_phone_number')
        .eq('id', organizationId)
        .single()
      
      emergencyPhone = org?.emergency_contact_phone || org?.transfer_phone_number
      console.log('⚠️ Using fallback emergency contact')
    }
    
    if (!emergencyPhone) {
      console.error('❌ No emergency contact configured')
      return NextResponse.json({
        results: [{
          toolCallId,
          result: {
            success: false,
            error: 'No emergency contact configured'
          }
        }]
      }, { status: 400 })
    }
    
    // Log emergency notification
    const { data: notification, error: notifError } = await supabase
      .from('emergency_notifications')
      .insert({
        organization_id: organizationId,
        contact_id: contact?.id || null,
        emergency_type: parameters.emergency_type,
        severity: parameters.severity,
        description: parameters.description,
        location: parameters.location,
        customer_name: parameters.customer_name,
        customer_phone: parameters.customer_phone,
        vapi_call_id: callData?.id,
        status: 'pending',
        metadata: {
          immediate_danger: parameters.immediate_danger,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    if (notifError) {
      console.error('⚠️ Failed to log emergency notification:', notifError)
    }
    
    // Send emergency SMS alert
    try {
      const smsService = new TwilioSMSService()
      const emergencyMessage = `🚨 EMERGENCY ALERT\n\nType: ${parameters.emergency_type.replace(/_/g, ' ').toUpperCase()}\nSeverity: ${parameters.severity}\nCustomer: ${parameters.customer_name || 'Unknown'}\nPhone: ${parameters.customer_phone}\nLocation: ${parameters.location || 'Not provided'}\n\nDescription: ${parameters.description}\n\nImmediate danger: ${parameters.immediate_danger ? 'YES' : 'NO'}\n\nCall customer immediately: ${parameters.customer_phone}`
      
      await smsService.sendSMS(
        emergencyPhone,
        emergencyMessage,
        {
          customer_id: organizationId,
          organization_id: organizationId,
          message_type: 'emergency_alert'
        }
      )
      
      console.log('✅ Emergency SMS sent to:', emergencyPhone)
      
      // Update notification status
      if (notification) {
        await supabase
          .from('emergency_notifications')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      }
      
    } catch (smsError: any) {
      console.error('❌ Failed to send emergency SMS:', smsError)
      // Continue anyway - transfer is more important
    }
    
    // Transfer call to emergency contact
    return NextResponse.json({
      results: [{
        toolCallId,
        result: {
          success: true,
          action: 'transfer',
          transferTo: emergencyPhone,
          message: `This is an emergency situation. I'm connecting you with our emergency contact ${contactName} right now. Please stay on the line.`,
          transferMode: 'warm',
          priority: 'emergency',
          metadata: {
            emergency_type: parameters.emergency_type,
            severity: parameters.severity,
            immediate_danger: parameters.immediate_danger
          }
        }
      }]
    })
    
  } catch (error: any) {
    console.error('❌ Emergency escalation error:', error)
    return NextResponse.json({
      results: [{
        toolCallId: 'unknown',
        result: {
          success: false,
          error: error.message
        }
      }]
    }, { status: 500 })
  }
}
