import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        total: 0,
        inbound: 0,
        outbound: 0,
        completed: 0,
        failed: 0,
        averageDuration: 0
      })
    }

    // Mock call statistics for now
    // TODO: Implement real call logging table and fetch actual data
    const mockStats = {
      success: true,
      total: 0,
      inbound: 0,
      outbound: 0,
      completed: 0,
      failed: 0,
      averageDuration: 0,
      date: date
    }

    return NextResponse.json(mockStats)
  } catch (error: any) {
    console.error('Analytics calls error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

