import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
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
    const { organization_id, member_id } = body

    if (!organization_id || !member_id) {
      return NextResponse.json(
        { error: 'Organization ID and member ID are required' },
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
        { error: 'You do not have permission to remove members' },
        { status: 403 }
      )
    }

    // Get the member being removed
    const { data: memberToRemove } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('id', member_id)
      .eq('organization_id', organization_id)
      .single()

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cannot remove yourself
    if (memberToRemove.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself. Transfer ownership first or leave the organization.' },
        { status: 400 }
      )
    }

    // Get current user's role
    const { data: currentUserMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    // Admins cannot remove owners
    if (currentUserMember?.role === 'admin' && memberToRemove.role === 'owner') {
      return NextResponse.json(
        { error: 'Admins cannot remove owners' },
        { status: 403 }
      )
    }

    // Check if this is the last owner
    if (memberToRemove.role === 'owner') {
      const { data: ownerCount } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', organization_id)
        .eq('role', 'owner')
        .eq('is_active', true)

      if (ownerCount && ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner. Transfer ownership first.' },
          { status: 400 }
        )
      }
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', member_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

