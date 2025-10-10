import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for updating a demo request
const UpdateDemoRequestSchema = z.object({
  id: z.string().uuid(),
  lead_score: z.number().int().min(0).max(100).optional(),
  follow_up_flag: z.boolean().optional(),
  conversion_status: z.enum(['none', 'signed_up', 'nurturing']).optional(),
})

// Schema for triggering a manual follow-up
const ManualFollowUpSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['send_signup_link', 'send_nurture_email', 'retry_call']),
})

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
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    return NextResponse.json({ error: 'Access Denied: Admin or Owner role required' }, { status: 403 })
  }

  // Fetch all demo requests
  const { data: demoRequests, error: demoRequestsError } = await supabase
    .from('demo_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (demoRequestsError) {
    console.error('Error fetching demo requests for admin:', demoRequestsError.message)
    return NextResponse.json({ error: 'Failed to fetch demo requests' }, { status: 500 })
  }

  return NextResponse.json(demoRequests)
}

export async function PATCH(request: Request) {
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
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    return NextResponse.json({ error: 'Access Denied: Admin or Owner role required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = UpdateDemoRequestSchema.parse(body)

    const { id, ...updateFields } = validatedData

    const { error: updateError } = await supabase
      .from('demo_requests')
      .update(updateFields)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating demo request:', updateError.message)
      return NextResponse.json({ error: 'Failed to update demo request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Demo request updated successfully' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error processing PATCH request for demo requests:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    return NextResponse.json({ error: 'Access Denied: Admin or Owner role required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validatedData = ManualFollowUpSchema.parse(body)

    const { id, action } = validatedData

    // Fetch demo request details for follow-up
    const { data: demoRequest, error: fetchError } = await supabase
      .from('demo_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !demoRequest) {
      console.error('Error fetching demo request for follow-up:', fetchError?.message)
      return NextResponse.json({ error: 'Demo request not found' }, { status: 404 })
    }

    // Implement follow-up actions based on 'action'
    switch (action) {
      case 'send_signup_link':
        // TODO: Implement actual SMS/Email sending logic
        console.log(`Manually sending signup link to ${demoRequest.phone_number} for demo request ${id}`)
        // Example: await sendSMS(demoRequest.phone_number, "Here's your signup link: ...")
        break
      case 'send_nurture_email':
        // TODO: Implement actual email sending logic
        console.log(`Manually sending nurture email to ${demoRequest.name} for demo request ${id}`)
        break
      case 'retry_call':
        // TODO: Implement Vapi outbound call retry logic
        console.log(`Manually retrying call to ${demoRequest.phone_number} for demo request ${id}`)
        break
      default:
        return NextResponse.json({ error: 'Invalid follow-up action' }, { status: 400 })
    }

    // Update follow_up_flag
    const { error: updateError } = await supabase
      .from('demo_requests')
      .update({ follow_up_flag: true }) // Mark as followed up
      .eq('id', id)

    if (updateError) {
      console.error('Error updating follow_up_flag:', updateError.message)
    }

    return NextResponse.json({ success: true, message: `Follow-up action '${action}' triggered successfully` })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error processing POST request for demo requests:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
