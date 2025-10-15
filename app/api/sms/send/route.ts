// SMS Send API Route - Production Ready
// Handles SMS sending requests from frontend

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { productionSMSService } from '@/lib/sms/production-sms-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      type, 
      message, 
      templateKey, 
      templateData, 
      language = 'en',
      phoneNumber,
      customerId,
      organizationId,
      provider = 'auto'
    } = body

    // Validate required fields
    if (!type || !['individual', 'emergency', 'template'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid type is required: individual, emergency, or template' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    // Prepare SMS options
    const smsOptions = {
      to: phoneNumber ? [{ phone: phoneNumber, organizationId }] : [],
      message: message || '',
      templateKey,
      language,
      metadata: {
        organization_id: organizationId,
        user_id: user.id,
        ...templateData
      }
    }

    let result

    // Send SMS based on type
    switch (type) {
      case 'individual':
        if (!phoneNumber && !customerId) {
          return NextResponse.json(
            { success: false, error: 'Phone number or customer ID is required' },
            { status: 400 }
          )
        }

        if (templateKey) {
          // Send template SMS
          const recipients = phoneNumber 
            ? [{ phone: phoneNumber, organizationId }]
            : await getCustomerRecipients(supabase, customerId, organizationId)

          result = await productionSMSService.sendTemplateSMS(
            templateKey,
            recipients,
            templateData || {},
            language
          )
        } else {
          // Send direct SMS
          result = await productionSMSService.sendSMS(smsOptions, provider as any)
        }
        break

      case 'emergency':
        result = await productionSMSService.sendEmergencySMS(
          organizationId,
          message || 'Emergency alert from ServiceAI',
          language
        )
        break

      case 'template':
        if (!templateKey) {
          return NextResponse.json(
            { success: false, error: 'Template key is required for template SMS' },
            { status: 400 }
          )
        }

        const recipients = phoneNumber 
          ? [{ phone: phoneNumber, organizationId }]
          : await getCustomerRecipients(supabase, customerId, organizationId)

        result = await productionSMSService.sendTemplateSMS(
          templateKey,
          recipients,
          templateData || {},
          language
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid SMS type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: result.provider,
      cost: result.cost
    })

  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Get customer recipients from customer ID
 */
async function getCustomerRecipients(
  supabase: any,
  customerId: string,
  organizationId: string
): Promise<Array<{ phone: string; name?: string; organizationId: string }>> {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('phone_number, name')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !customer) {
    throw new Error('Customer not found')
  }

  if (!customer.phone_number) {
    throw new Error('Customer has no phone number')
  }

  return [{
    phone: customer.phone_number,
    name: customer.name,
    organizationId
  }]
}