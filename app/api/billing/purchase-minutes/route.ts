import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { STRIPE_CONFIG } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { organization_id, bundle_id, minutes, price } = body

  if (!organization_id || !bundle_id || !minutes || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch organization's Stripe customer ID
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', organization_id)
    .single()

  if (orgError || !org?.stripe_customer_id) {
    console.error('Error fetching organization or Stripe customer ID:', orgError?.message)
    return NextResponse.json({ error: 'Organization not found or Stripe customer ID missing' }, { status: 404 })
  }

  try {
    // Create a new Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: org.stripe_customer_id,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${minutes} Minutes Bundle`,
              description: `Purchase ${minutes} additional call minutes for ServiceAI.`,
            },
            unit_amount: price * 100, // Price in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&bundle_id=${bundle_id}&minutes=${minutes}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        organization_id: organization_id,
        bundle_id: bundle_id,
        minutes: minutes,
      },
    })

    if (session.url) {
      return NextResponse.json({ url: session.url })
    } else {
      throw new Error('Failed to create Stripe Checkout Session URL')
    }
  } catch (error: any) {
    console.error('Error creating checkout session for minute purchase:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
