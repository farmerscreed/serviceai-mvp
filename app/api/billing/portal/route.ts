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
    const { organization_id, return_url } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user is owner or admin
    const { data: hasPermission } = await supabase
      .rpc('user_has_role', {
        p_user_id: user.id,
        p_organization_id: organization_id,
        p_required_role: 'admin'
      })

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get organization's Stripe customer ID
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', organization_id)
      .single()

    if (orgError || !org || !org.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
    }

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: return_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    })
  } catch (error: any) {
    console.error('Create portal session error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

