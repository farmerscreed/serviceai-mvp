// SMS Communications API Route
// Retrieves SMS communication history

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const direction = searchParams.get('direction')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Build query
    let query = supabase
      .from('sms_communications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (direction) {
      query = query.eq('direction', direction)
    }

    const { data: communications, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('sms_communications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate)
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (direction) {
      countQuery = countQuery.eq('direction', direction)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      communications: communications || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0)
    })

  } catch (error) {
    console.error('SMS communications error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
