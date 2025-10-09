import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { GoogleCalendarService } from '@/lib/calendar/google-calendar-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // organizationId
    const error = searchParams.get('error')

    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/settings/calendar?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/calendar?error=missing_parameters', request.url)
      )
    }

    const organizationId = state

    // Verify user is authenticated
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/signin?redirect=/settings/calendar', request.url)
      )
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.redirect(
        new URL('/settings/calendar?error=access_denied', request.url)
      )
    }

    // Handle OAuth callback and store tokens
    const googleService = new GoogleCalendarService()
    await googleService.handleCallback(code, organizationId)

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings/calendar?success=true', request.url)
    )

  } catch (error: any) {
    console.error('Google Calendar callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings/calendar?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}

