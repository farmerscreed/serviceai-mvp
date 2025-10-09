import { createServerClient } from '@/lib/supabase/server'
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
    const { invitation_id } = body

    if (!invitation_id) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Get invitation to check permissions
    const { data: invitation, error: invitationError } = await supabase
      .from('organization_invitations')
      .select('organization_id, status')
      .eq('id', invitation_id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (must be owner or admin)
    const { data: hasPermission } = await supabase
      .rpc('user_has_role', {
        p_user_id: user.id,
        p_organization_id: invitation.organization_id,
        p_required_role: 'admin'
      })

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to revoke this invitation' },
        { status: 403 }
      )
    }

    // Can only revoke pending invitations
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only revoke pending invitations' },
        { status: 400 }
      )
    }

    // Revoke invitation
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitation_id)

    if (updateError) {
      console.error('Revoke error:', updateError)
      return NextResponse.json(
        { error: 'Failed to revoke invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully',
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

