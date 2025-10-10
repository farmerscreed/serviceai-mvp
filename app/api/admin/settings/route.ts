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
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    return NextResponse.json({ error: 'Access Denied: Admin or Owner role required' }, { status: 403 })
  }

  // Fetch all system settings
  const { data: settings, error: settingsError } = await supabase
    .from('system_settings')
    .select('*')

  if (settingsError) {
    console.error('Error fetching system settings:', settingsError.message)
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 })
  }

  // Format settings into a key-value object
  const formattedSettings: { [key: string]: any } = {}
  settings.forEach(setting => {
    formattedSettings[setting.key] = setting.value.value // Assuming value is stored as { "value": "..." }
  })

  return NextResponse.json(formattedSettings)
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

  const body = await request.json()
  const { key, value } = body

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
  }

  // Update or insert the setting
  const { error: upsertError } = await supabase
    .from('system_settings')
    .upsert({ key, value: { value } }, { onConflict: 'key' }) // Store value as { "value": "..." }

  if (upsertError) {
    console.error('Error upserting system setting:', upsertError.message)
    return NextResponse.json({ error: 'Failed to update system setting' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: `Setting '${key}' updated` })
}
