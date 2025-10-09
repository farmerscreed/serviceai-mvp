// SMS Trends API - Task 3.1
// Get SMS delivery trends over time

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SMSDeliveryTracker } from '@/lib/sms/sms-delivery-tracker'
import { z } from 'zod'

// Query validation schema
const TrendsQuerySchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('7d')
})

export async function GET(request: NextRequest) {
  try {
    console.log('📈 SMS Trends API called')

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      organizationId: searchParams.get('organizationId'),
      timeRange: searchParams.get('timeRange') || '7d'
    }

    const validatedData = TrendsQuerySchema.parse(queryData)

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

    // Get delivery trends
    const deliveryTracker = new SMSDeliveryTracker()
    const trends = await deliveryTracker.getDeliveryTrends(
      validatedData.organizationId,
      validatedData.timeRange
    )

    console.log(`✅ SMS trends retrieved: ${trends.length} data points`)

    return NextResponse.json({
      success: true,
      trends,
      timeRange: validatedData.timeRange,
      organizationId: validatedData.organizationId
    })

  } catch (error) {
    console.error('SMS Trends API error:', error)

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
