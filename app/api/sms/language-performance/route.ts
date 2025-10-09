// SMS Language Performance API - Task 3.1
// Compare SMS performance between English and Spanish

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SMSDeliveryTracker } from '@/lib/sms/sms-delivery-tracker'
import { z } from 'zod'

// Query validation schema
const LanguagePerformanceQuerySchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('30d')
})

export async function GET(request: NextRequest) {
  try {
    console.log('🌍 SMS Language Performance API called')

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryData = {
      organizationId: searchParams.get('organizationId'),
      timeRange: searchParams.get('timeRange') || '30d'
    }

    const validatedData = LanguagePerformanceQuerySchema.parse(queryData)

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

    // Get language performance comparison
    const deliveryTracker = new SMSDeliveryTracker()
    const languagePerformance = await deliveryTracker.getLanguagePerformance(
      validatedData.organizationId,
      validatedData.timeRange
    )

    console.log(`✅ Language performance comparison retrieved`)

    return NextResponse.json({
      success: true,
      languagePerformance,
      timeRange: validatedData.timeRange,
      organizationId: validatedData.organizationId
    })

  } catch (error) {
    console.error('SMS Language Performance API error:', error)

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
