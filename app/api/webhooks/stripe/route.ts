import { stripe, STRIPE_CONFIG } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

// Important: Disable body parsing for webhooks
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('Received Stripe webhook:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentActionRequired(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id

  if (!organizationId) {
    console.error('No organization_id in checkout session metadata')
    return
  }

  // Check if this is a minute bundle purchase
  if (session.metadata?.bundle_id) {
    await handleCheckoutSessionCompletedForMinutes(session)
    return
  }

  // Update organization with subscription info
  if (session.subscription) {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        stripe_subscription_id: subscriptionId,
        subscription_status: 'trialing',
      })
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating organization:', error)
    }
  }
}

async function handleCheckoutSessionCompletedForMinutes(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id
  const minutes = parseInt(session.metadata?.minutes as string)

  if (!organizationId || isNaN(minutes)) {
    console.error('Missing organization_id or minutes in checkout session metadata for minute purchase')
    return
  }

  // Fetch current credit_minutes
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('credit_minutes')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    console.error('Error fetching organization for minute purchase:', orgError?.message)
    return
  }

  // Update organization's credit_minutes
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ credit_minutes: (org.credit_minutes || 0) + minutes })
    .eq('id', organizationId)

  if (error) {
    console.error('Error updating credit_minutes for organization:', error)
  } else {
    console.log(`✅ Added ${minutes} credit minutes to organization ${organizationId}`)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id

  if (!organizationId) {
    console.error('No organization_id in subscription metadata')
    return
  }

  // Get the price to determine the tier
  const priceId = subscription.items.data[0]?.price.id
  let tier: string | null = null

  // Map price ID to tier slug
  if (priceId) {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('slug')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single()

    if (plan) {
      tier = plan.slug
    }
  }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: tier,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('id', organizationId)

  if (error) {
    console.error('Error updating organization subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id

  if (!organizationId) {
    console.error('No organization_id in subscription metadata')
    return
  }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      subscription_status: 'canceled',
      subscription_tier: null,
      cancel_at_period_end: false,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error marking subscription as canceled:', error)
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id

  if (!organizationId) {
    return
  }

  // TODO: Send email notification that trial is ending soon
  console.log(`Trial will end for organization ${organizationId}`)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id

  if (!customerId) {
    return
  }

  // Find organization by stripe_customer_id
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!org) {
    console.error('Organization not found for customer:', customerId)
    return
  }

  // If this is a subscription renewal, reset usage
  if (invoice.billing_reason === 'subscription_cycle') {
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ minutes_used_this_cycle: 0 })
      .eq('id', org.id)

    if (updateError) {
      console.error('Error resetting usage for organization:', updateError)
    }
  }

  // Record payment in payment_history
  const { error } = await supabaseAdmin
    .from('payment_history')
    .insert({
      organization_id: org.id,
      stripe_invoice_id: invoice.id,
      stripe_charge_id: typeof invoice.charge === 'string' ? invoice.charge : invoice.charge?.id,
      stripe_payment_intent_id: typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: invoice.status || 'paid',
      description: invoice.description || undefined,
      invoice_pdf_url: invoice.invoice_pdf || undefined,
      hosted_invoice_url: invoice.hosted_invoice_url || undefined,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : undefined,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : undefined,
      paid_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : new Date().toISOString(),
    })

  if (error) {
    console.error('Error recording payment:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id

  if (!customerId) {
    return
  }

  // Find organization
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!org) {
    return
  }

  // Update subscription status to past_due
  await supabaseAdmin
    .from('organizations')
    .update({ subscription_status: 'past_due' })
    .eq('id', org.id)

  // TODO: Send payment failed notification email
  console.log(`Payment failed for organization ${org.id}`)
}

async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id

  if (!customerId) {
    return
  }

  // TODO: Send email notification that payment action is required
  console.log(`Payment action required for customer ${customerId}`)
}

