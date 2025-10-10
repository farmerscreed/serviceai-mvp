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
    const { organization_id, price_id, success_url, cancel_url } = body

    if (!organization_id || !price_id) {
      return NextResponse.json(
        { error: 'Organization ID and price ID are required' },
        { status: 400 }
      )
    }

    // Verify user is owner or admin
    const { data: hasPermission } = await supabase
      .rpc('user_has_role' as any, {
        p_user_id: user.id,
        p_organization_id: organization_id,
        p_required_role: 'admin'
      })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get organization with Stripe customer ID
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name, stripe_subscription_id')
      .eq('id', organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // If organization already has an active subscription, return error
    if ((org as any).stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription. Use Customer Portal to manage.' },
        { status: 400 }
      )
    }

    // Create Stripe customer if doesn't exist
    let customerId = (org as any).stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: (org as any).name,
        metadata: {
          organization_id: organization_id,
          owner_id: user.id,
        },
      })
      customerId = customer.id

      // Update organization
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organization_id)
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: price_id,
        quantity: 1,
      }],
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing/pricing`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          organization_id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        organization_id,
      },
    })

    return NextResponse.json({
      success: true,
      session_id: session.id,
      session_url: session.url,
    })
  } catch (error: any) {
    console.error('Create checkout session error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

