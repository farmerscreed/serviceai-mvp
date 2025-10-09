import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
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
    const { organization_id, name, slug, industry_code, primary_language, timezone } = body

    if (!organization_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Check if user has permission (must be owner or admin)
    const { data: hasPermission } = await supabase
      .rpc('user_has_role', {
        p_user_id: user.id,
        p_organization_id: organization_id,
        p_required_role: 'admin'
      })

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to update this organization' },
        { status: 403 }
      )
    }

    // Build update object with only provided fields
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (slug !== undefined) {
      // Validate slug if provided
      const { data: isValidSlug } = await supabase
        .rpc('validate_slug', { p_slug: slug })

      if (!isValidSlug) {
        return NextResponse.json(
          { error: 'Invalid slug format' },
          { status: 400 }
        )
      }

      // Check if slug is taken by another organization
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .neq('id', organization_id)
        .single()

      if (existingOrg) {
        return NextResponse.json(
          { error: 'This slug is already taken' },
          { status: 400 }
        )
      }

      updates.slug = slug
    }
    if (industry_code !== undefined) updates.industry_code = industry_code
    if (primary_language !== undefined) updates.primary_language = primary_language
    if (timezone !== undefined) updates.timezone = timezone

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

