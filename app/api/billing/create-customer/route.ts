import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user is owner or admin of organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if organization already has a Stripe customer
    if (org.stripe_customer_id) {
      return NextResponse.json({
        customer_id: org.stripe_customer_id,
        message: 'Customer already exists'
      })
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: {
        organization_id: organization_id,
        owner_id: user.id,
        organization_slug: org.slug,
      },
    })

    // Update organization with Stripe customer ID
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_customer_id: customer.id,
        subscription_status: 'trialing',
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      })
      .eq('id', organization_id)

    if (updateError) {
      // Cleanup: Delete the Stripe customer if DB update fails
      await stripe.customers.del(customer.id)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      customer_id: customer.id,
    })
  } catch (error: any) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

