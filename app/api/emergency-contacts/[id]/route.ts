import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
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
    
    // Get emergency contact with organization access check via RLS
    const { data: contact, error } = await (supabase as any)
      .from('emergency_contacts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !contact) {
      return NextResponse.json(
        { error: 'Emergency contact not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      contact
    })
    
  } catch (error: any) {
    console.error('Emergency contact GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    
    const body = await request.json()
    
    // Get existing contact to verify access and get organization_id
    const { data: existing, error: fetchError } = await (supabase as any)
      .from('emergency_contacts')
      .select('organization_id, is_primary')
      .eq('id', id)
      .single()
    
    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Emergency contact not found' },
        { status: 404 }
      )
    }
    
    // If this is being set as primary, unset other primary contacts
    if (body.is_primary && !existing.is_primary) {
      await (supabase as any)
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('organization_id', existing.organization_id)
    }
    
    // Update emergency contact
    const updateData: any = {}
    if (body.name) updateData.name = body.name
    if (body.phone) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.role) updateData.role = body.role
    if (body.is_primary !== undefined) updateData.is_primary = body.is_primary
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.available_days) updateData.available_days = body.available_days
    if (body.available_hours_start) updateData.available_hours_start = body.available_hours_start
    if (body.available_hours_end) updateData.available_hours_end = body.available_hours_end
    if (body.priority) updateData.priority = body.priority
    if (body.escalation_timeout) updateData.escalation_timeout = body.escalation_timeout
    if (body.sms_enabled !== undefined) updateData.sms_enabled = body.sms_enabled
    if (body.call_enabled !== undefined) updateData.call_enabled = body.call_enabled
    if (body.email_enabled !== undefined) updateData.email_enabled = body.email_enabled
    if (body.notes !== undefined) updateData.notes = body.notes
    
    const { data: updated, error: updateError } = await (supabase as any)
      .from('emergency_contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Emergency contact update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      contact: updated
    })
    
  } catch (error: any) {
    console.error('Emergency contact PATCH error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    // Delete emergency contact (RLS will handle access control)
    const { error } = await (supabase as any)
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Emergency contact deletion error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    })
    
  } catch (error: any) {
    console.error('Emergency contact DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}