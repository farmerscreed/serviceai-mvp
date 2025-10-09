import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const alertId = id

    // Update the emergency notification status
    const { data: updatedAlert, error } = await supabase
      .from('emergency_notifications')
      .update({
        status: 'resolved',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('organization_id', membership.organization_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!updatedAlert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    })
  } catch (error: any) {
    console.error('Error resolving emergency alert:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resolve emergency alert' },
      { status: 500 }
    )
  }
}

