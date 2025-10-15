import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
    
    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        customers: [] 
      })
    }
    
    // Get customers for organizations
    let query = (supabase as any)
      .from('customers')
      .select('*')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: customers, error } = await query
    
    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      customers: customers || [] 
    })
    
  } catch (error: any) {
    console.error('Error in customers API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const {
      name,
      phone_number,
      email,
      address,
      primary_language = 'en',
      sms_enabled = true
    } = body
    
    // Validate required fields
    if (!name || !phone_number) {
      return NextResponse.json(
        { error: 'Name and phone_number are required' },
        { status: 400 }
      )
    }
    
    // Create customer
    const { data: customer, error } = await (supabase as any)
      .from('customers')
      .insert({
        organization_id: membership.organization_id,
        name,
        phone_number,
        email,
        address,
        primary_language,
        sms_enabled
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      customer 
    })
    
  } catch (error: any) {
    console.error('Error in customers POST API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}