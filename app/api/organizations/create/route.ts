import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, slug, industry_code, primary_language, timezone } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Organization name and slug are required' },
        { status: 400 }
      )
    }

    // Validate slug format locally (lowercase letters, numbers, hyphens; no leading/trailing hyphen)
    const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    if (!slugOk) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      )
    }

    // Initialize admin client for writes that must bypass RLS bootstrap
    const admin = createAdminClient()

    // Check if slug is already taken (admin avoids RLS side-effects)
    const { data: existingOrg } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'This slug is already taken. Please choose another.' },
        { status: 400 }
      )
    }

    // Create organization with admin to avoid RLS recursion during bootstrap
    const { data: organization, error: orgError } = await admin
      .from('organizations')
      .insert({
        name,
        slug,
        industry_code: industry_code || null,
        owner_id: user.id,
        primary_language: primary_language || 'en',
        timezone: timezone || 'America/New_York',
        subscription_status: 'trialing',
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      return NextResponse.json(
        { error: orgError.message },
        { status: 400 }
      )
    }

    // Add creator as owner using service role to bypass RLS recursion
    const { error: memberError } = await admin
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner',
        invited_by: user.id,
      })

    if (memberError) {
      console.error('Member creation error:', memberError)
      // Rollback: delete the organization
      await supabase
        .from('organizations')
        .delete()
        .eq('id', organization.id)

      return NextResponse.json(
        { error: 'Failed to create organization membership' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

