// SMS Statistics API - Task 3.1
// Get SMS delivery statistics and analytics

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SMSDeliveryTracker } from '@/lib/sms/sms-delivery-tracker'
import { z } from 'zod'

// Query validation schema
const StatisticsQuerySchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h')
})

export async function GET(request: NextRequest) {
  try {
    console.log('📊 SMS Statistics API called')

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      organizationId: searchParams.get('organizationId'),
      timeRange: searchParams.get('timeRange') || '24h'
    }

    const validatedData = StatisticsQuerySchema.parse(queryData)

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

    // Get SMS statistics
    const deliveryTracker = new SMSDeliveryTracker()
    const statistics = await deliveryTracker.getDeliveryStatistics(
      validatedData.organizationId,
      validatedData.timeRange
    )

    console.log(`✅ SMS statistics retrieved for ${validatedData.organizationId}`)

    return NextResponse.json({
      success: true,
      statistics,
      timeRange: validatedData.timeRange,
      organizationId: validatedData.organizationId
    })

  } catch (error) {
    console.error('SMS Statistics API error:', error)

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
