import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const date = searchParams.get('date')

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
    
    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        logs: [] 
      })
    }
    
    // Get SMS logs for organizations
    let query = supabase
      .from('sms_communications')
      .select('*')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by date if provided
    if (date && date !== 'all') {
      query = query.gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
    }

    const { data: logs, error } = await query
    
    if (error) {
      console.error('Error fetching SMS logs:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true,
      logs: logs || [] 
    })
    
  } catch (error: any) {
    console.error('SMS logs error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

