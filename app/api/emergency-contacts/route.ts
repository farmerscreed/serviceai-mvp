import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - List emergency contacts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        contacts: []
      })
    }

    // Fetch emergency contacts
    const { data: contacts, error: contactsError } = await (supabase as any)
      .from('emergency_contacts')
      .select('*')
      .in('organization_id', orgIds)
      .order('priority', { ascending: true })

    if (contactsError) {
      console.error('Error fetching emergency contacts:', contactsError)
      return NextResponse.json(
        { success: false, contacts: [], error: contactsError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      contacts: contacts || []
    })
  } catch (error: any) {
    console.error('Emergency contacts GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create emergency contact
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      organizationId,
      name,
      phone,
      email,
      role,
      isPrimary,
      isActive = true,
      availableDays,
      availableHoursStart,
      availableHoursEnd,
      priority = 1,
      escalationTimeout = 30,
      smsEnabled = true,
      callEnabled = true,
      emailEnabled = false,
      notes
    } = body

    // Validate required fields
    if (!organizationId || !name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, name, phone' },
        { status: 400 }
      )
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await (supabase as any)
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('organization_id', organizationId)
    }

    // Insert emergency contact
    const { data: contact, error: insertError } = await (supabase as any)
      .from('emergency_contacts')
      .insert({
        organization_id: organizationId,
        name,
        phone,
        email,
        role,
        is_primary: isPrimary,
        is_active: isActive,
        available_days: availableDays,
        available_hours_start: availableHoursStart,
        available_hours_end: availableHoursEnd,
        priority,
        escalation_timeout: escalationTimeout,
        sms_enabled: smsEnabled,
        call_enabled: callEnabled,
        email_enabled: emailEnabled,
        notes
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating emergency contact:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      contact
    })
  } catch (error: any) {
    console.error('Emergency contacts POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
