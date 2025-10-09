import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    // Fetch all members with user profiles
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        user_profiles!inner (
          full_name,
          email
        )
      `)
      .eq('organization_id', id)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json({ error: membersError.message }, { status: 400 })
    }

    // Transform the data to include email at the top level
    const transformedMembers = (members || []).map(member => {
      const profile = (member.user_profiles as any)
      return {
        id: member.id,
        user_id: member.user_id,
        email: profile?.email || 'No email',
        name: profile?.full_name || 'Unknown',
        role: member.role,
        status: 'active',
        created_at: member.created_at
      }
    })

    return NextResponse.json({
      success: true,
      members: transformedMembers
    })
  } catch (error: any) {
    console.error('Members GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

