import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createRouteHandlerClient({ cookies })

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
  const organizations: OrganizationUsage[] = await orgsResponse.json()

  if (!orgsResponse.ok) {
    console.error('Failed to fetch organizations for admin dashboard:', organizations)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading organizations: {organizations.error}</p>
      </div>
    )
  }

  // Fetch all call logs
  const callLogsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/call-logs`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  const callLogs: CallLog[] = await callLogsResponse.json()

  if (!callLogsResponse.ok) {
    console.error('Failed to fetch call logs for admin dashboard:', callLogs)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading call logs: {callLogs.error}</p>
      </div>
    )
  }

  // Fetch system settings
  const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  const settings = await settingsResponse.json()

  if (!settingsResponse.ok) {
    console.error('Failed to fetch system settings for admin dashboard:', settings)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading settings: {settings.error}</p>
      </div>
    )
  }

  // Fetch all demo requests
  const demoRequestsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/demo-requests`, {
    headers: {
      Cookie: cookies().toString(), // Pass cookies for authentication
    },
    cache: 'no-store', // Ensure data is always fresh
  })
  const demoRequests: DemoRequest[] = await demoRequestsResponse.json()

  if (!demoRequestsResponse.ok) {
    console.error('Failed to fetch demo requests for admin dashboard:', demoRequests)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading demo requests: {demoRequests.error}</p>
      </div>
    )
  }

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
