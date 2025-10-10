import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the user's organization and its usage data
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      minutes_used_this_cycle,
      credit_minutes,
      subscription_plans (
        included_minutes
      )
    `)
    .eq('owner_id', user.id) // Assuming owner_id links user to organization
    .single()

  if (orgError || !org) {
    console.error('Error fetching organization usage:', orgError?.message)
    return NextResponse.json({ error: 'Organization not found or usage data unavailable' }, { status: 404 })
  }

  const monthlyMinutesAllocation = org.subscription_plans?.included_minutes || 0
  const minutesUsed = org.minutes_used_this_cycle || 0
  const creditMinutes = org.credit_minutes || 0

  return NextResponse.json({
    organizationId: org.id,
    organizationName: org.name,
    monthlyMinutesAllocation,
    minutesUsedThisCycle: minutesUsed,
    creditMinutes,
    remainingMinutes: (monthlyMinutesAllocation + creditMinutes) - minutesUsed,
  })
}
