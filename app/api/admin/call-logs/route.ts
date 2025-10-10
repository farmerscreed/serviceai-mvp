import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user is an admin or owner
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    return NextResponse.json({ error: 'Access Denied: Admin or Owner role required' }, { status: 403 })
  }

  // Fetch all call logs with organization name
  const { data: callLogs, error: callLogError } = await supabase
    .from('call_logs')
    .select(`
      id,
      organization_id,
      organizations ( name ),
      vapi_call_id,
      phone_number,
      start_time,
      end_time,
      duration_seconds,
      status,
      detected_language,
      cost
    `)
    .order('start_time', { ascending: false })

  if (callLogError) {
    console.error('Error fetching call logs for admin:', callLogError.message)
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 })
  }

  // Flatten the organization name
  const formattedCallLogs = callLogs.map(log => ({
    ...log,
    organization_name: log.organizations?.name || 'N/A',
  }))

  return NextResponse.json(formattedCallLogs)
}
