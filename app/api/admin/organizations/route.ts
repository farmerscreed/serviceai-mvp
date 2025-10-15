import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user is an admin or owner
  // This assumes the user is part of at least one organization
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    return NextResponse.json({ error: 'Access Denied: Admin or Owner role required' }, { status: 403 })
  }

  // Fetch all organizations with their usage data
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      stripe_customer_id,
      subscription_status,
      subscription_tier,
      minutes_used_this_cycle,
      credit_minutes,
      subscription_plans (
        included_minutes
      )
    `)
    .order('name', { ascending: true })

  if (orgError) {
    console.error('Error fetching organizations for admin:', orgError.message)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }

  // Calculate remaining minutes for each organization
  const organizationsWithUsage = organizations.map(org => {
    const monthlyMinutesAllocation = Array.isArray(org.subscription_plans) ? (org.subscription_plans[0] as any)?.included_minutes || 0 : (org.subscription_plans as any)?.included_minutes || 0
    const minutesUsed = org.minutes_used_this_cycle || 0
    const creditMinutes = org.credit_minutes || 0

    return {
      ...org,
      monthlyMinutesAllocation,
      minutesUsedThisCycle: minutesUsed,
      creditMinutes,
      remainingMinutes: (monthlyMinutesAllocation + creditMinutes) - minutesUsed,
    }
  })

  return NextResponse.json(organizationsWithUsage)
}
