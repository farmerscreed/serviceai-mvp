import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import OrganizationsTable from '@/components/admin/OrganizationsTable'
import CallLogsTable from '@/components/admin/CallLogsTable'
import SettingsForm from '@/components/admin/SettingsForm'
import DemoRequestsTable from '@/components/admin/DemoRequestsTable' // Import DemoRequestsTable

interface OrganizationUsage {
  id: string
  name: string
  stripe_customer_id: string | null
  subscription_status: string
  subscription_tier: string | null
  minutes_used_this_cycle: number
  credit_minutes: number
  monthlyMinutesAllocation: number
  remainingMinutes: number
}

interface CallLog {
  id: string
  organization_id: string
  organization_name: string
  vapi_call_id: string
  phone_number: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  status: string
  detected_language: string | null
  cost: number | null
}

interface DemoRequest {
  id: string
  name: string
  phone_number: string
  industry: string | null
  status: string
  lead_score: number
  follow_up_flag: boolean
  conversion_status: string
  requested_at: string
  call_started_at: string | null
  call_ended_at: string | null
  transcript: string | null
  recording_url: string | null
}

export default async function AdminDashboardPage() {
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
    redirect('/login') // Redirect to login if not authenticated
  }

  // Fetch user's role in their current organization
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)

  if (membershipError || !memberships || memberships.length === 0 || !['owner', 'admin'].includes(memberships[0].role)) {
    redirect('/dashboard') // Redirect if not an admin or owner
  }

  // Fetch all organizations with their usage data
  const orgsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/organizations`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  
  if (!orgsResponse.ok) {
    console.error('Failed to fetch organizations for admin dashboard:', orgsResponse.statusText)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading organizations: {orgsResponse.statusText}</p>
      </div>
    )
  }
  
  const organizations: OrganizationUsage[] = await orgsResponse.json()

  // Fetch all call logs
  const callLogsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/call-logs`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  
  if (!callLogsResponse.ok) {
    console.error('Failed to fetch call logs for admin dashboard:', callLogsResponse.statusText)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading call logs: {callLogsResponse.statusText}</p>
      </div>
    )
  }
  
  const callLogs: CallLog[] = await callLogsResponse.json()

  // Fetch system settings
  const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  
  if (!settingsResponse.ok) {
    console.error('Failed to fetch system settings for admin dashboard:', settingsResponse.statusText)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading settings: {settingsResponse.statusText}</p>
      </div>
    )
  }
  
  const settings = await settingsResponse.json()

  // Fetch all demo requests
  const demoRequestsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/demo-requests`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  
  if (!demoRequestsResponse.ok) {
    console.error('Failed to fetch demo requests for admin dashboard:', demoRequestsResponse.statusText)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading demo requests: {demoRequestsResponse.statusText}</p>
      </div>
    )
  }
  
  const demoRequests: DemoRequest[] = await demoRequestsResponse.json()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <OrganizationsTable organizations={organizations} />
            <CallLogsTable initialCallLogs={callLogs} />
            <SettingsForm initialSettings={settings} />
            <DemoRequestsTable initialDemoRequests={demoRequests} /> {/* Add DemoRequestsTable */}
          </div>
        </div>
      </main>
    </div>
  )
}
