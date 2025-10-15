import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
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
    const { organization_id, email, role } = body

    // Validate required fields
    if (!organization_id || !email || !role) {
      return NextResponse.json(
        { error: 'Organization ID, email, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "member"' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user has permission to invite (must be owner or admin)
    const { data: hasPermission } = await supabase
      .rpc('user_has_role', {
        p_user_id: user.id,
        p_organization_id: organization_id,
        p_required_role: 'admin'
      })

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members to this organization' },
        { status: 403 }
      )
    }

    // Use service role client to check for existing user by email
    const supabaseAdmin = createServiceRoleClient()
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (userProfile) {
      // Check if this user is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', userProfile.id)
        .single()

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of the organization' },
          { status: 400 }
        )
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('organization_invitations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id,
        email,
        role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Invitation creation error:', invitationError)
      return NextResponse.json(
        { error: invitationError.message },
        { status: 400 }
      )
    }

    // TODO: Send invitation email (Task 0.2.11 - Edge Function)
    // For now, we'll just return the invitation with token
    // In production, send email with link: /invitations/accept?token={invitation.token}

    return NextResponse.json({
      success: true,
      invitation,
      message: 'Invitation created successfully',
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

