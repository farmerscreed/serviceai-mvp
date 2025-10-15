// SMS Template Test API Route
// Tests SMS templates with sample data

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { smsTemplateSystem } from '@/lib/sms/sms-template-system'

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
      templateKey, 
      language = 'en', 
      testData,
      organizationId 
    } = body

    // Validate required fields
    if (!templateKey || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Template key and Organization ID are required' },
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

    // Get sample data if not provided
    const sampleData = testData || getSampleDataForTemplate(templateKey)

    // Test template
    const result = await smsTemplateSystem.testTemplate(templateKey, language, sampleData)

    return NextResponse.json({
      success: result.success,
      formattedMessage: result.formattedMessage,
      error: result.error,
      sampleData
    })

  } catch (error) {
    console.error('SMS template test error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * Get sample data for template testing
 */
function getSampleDataForTemplate(templateKey: string): Record<string, any> {
  const sampleData: Record<string, Record<string, any>> = {
    appointment_confirmation: {
      customer_name: 'John Doe',
      service_type: 'HVAC Repair',
      date: 'October 15, 2025',
      time: '2:00 PM',
      address: '123 Main St, Anytown, ST 12345'
    },
    appointment_reminder: {
      service_type: 'Plumbing Maintenance',
      time: '10:00 AM',
      address: '456 Oak Ave, Anytown, ST 12345',
      business_phone: '(555) 123-4567'
    },
    emergency_alert: {
      customer_name: 'Jane Smith',
      issue_description: 'Gas leak detected in basement',
      address: '789 Pine St, Anytown, ST 12345',
      customer_phone: '(555) 987-6543',
      urgency_level: 'HIGH'
    },
    service_completion: {
      service_type: 'Electrical Repair',
      business_phone: '(555) 123-4567'
    },
    appointment_cancelled: {
      service_type: 'HVAC Installation',
      date: 'October 20, 2025',
      time: '9:00 AM',
      business_phone: '(555) 123-4567'
    },
    no_show_followup: {
      service_type: 'Plumbing Repair',
      business_phone: '(555) 123-4567'
    },
    welcome_message: {
      business_name: 'ServiceAI Pro',
      business_phone: '(555) 123-4567'
    }
  }

  return sampleData[templateKey] || {
    customer_name: 'Sample Customer',
    service_type: 'Sample Service',
    date: 'Sample Date',
    time: 'Sample Time',
    address: 'Sample Address',
    business_phone: '(555) 123-4567',
    business_name: 'Sample Business'
  }
}
