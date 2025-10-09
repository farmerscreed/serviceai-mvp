/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
}

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id)
  
  try {
    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        payment_status: 'succeeded',
        stripe_charge_id: paymentIntent.latest_charge as string,
        stripe_payment_method_id: paymentIntent.payment_method as string,
        processed_at: new Date().toISOString(),
        receipt_url: paymentIntent.receipt_email ? `https://dashboard.stripe.com/receipts/${paymentIntent.id}` : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return
    }

    // Get payment details for further processing
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(*)
      `)
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (paymentError || !payment) {
      console.error('Error fetching payment:', paymentError)
      return
    }

    // Trigger automated reconciliation
    await triggerReconciliation(payment.organization_id)

    // Send confirmation email (if email service is configured)
    await sendPaymentConfirmationEmail(payment)

    // Create system notification
    await createSystemNotification(payment)

    console.log('Payment processed successfully:', payment.id)
    
  } catch (error) {
    console.error('Error processing payment_intent.succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.payment_failed:', paymentIntent.id)
  
  try {
    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        payment_status: 'failed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (updateError) {
      console.error('Error updating failed payment:', updateError)
      return
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(*)
      `)
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (paymentError || !payment) {
      console.error('Error fetching failed payment:', paymentError)
      return
    }

    // Send failure notification
    await sendPaymentFailureNotification(payment)

    console.log('Payment failure processed:', payment.id)
    
  } catch (error) {
    console.error('Error processing payment_intent.payment_failed:', error)
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Processing charge.refunded:', charge.id)
  
  try {
    // Get the payment intent ID from the charge
    const paymentIntentId = charge.payment_intent as string
    
    // Find the original payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single()

    if (paymentError || !payment) {
      console.error('Error fetching payment for refund:', paymentError)
      return
    }

    // Get refund details from Stripe
    const refunds = await stripe.refunds.list({
      charge: charge.id,
      limit: 1
    })

    if (refunds.data.length === 0) {
      console.error('No refund found for charge:', charge.id)
      return
    }

    const refund = refunds.data[0]

    // Create refund record
    const { error: refundError } = await supabase
      .from('refunds')
      .insert({
        organization_id: payment.organization_id,
        booking_id: payment.booking_id,
        payment_id: payment.id,
        stripe_refund_id: refund.id,
        amount: refund.amount / 100, // Convert from cents
        currency: refund.currency.toUpperCase(),
        reason: refund.reason || 'requested_by_customer',
        refund_status: refund.status,
        description: `Refund for ${payment.description}`,
        processed_at: new Date(refund.created * 1000).toISOString()
      })

    if (refundError) {
      console.error('Error creating refund record:', refundError)
      return
    }

    // Update original payment status if fully refunded
    if (refund.amount >= charge.amount) {
      await supabase
        .from('payments')
        .update({
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id)
    }

    // Trigger reconciliation update
    await triggerReconciliation(payment.organization_id)

    console.log('Refund processed successfully:', refund.id)
    
  } catch (error) {
    console.error('Error processing charge.refunded:', error)
  }
}

async function triggerReconciliation(organizationId: string) {
  try {
    // Get current month's date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Calculate financial summary
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, payment_type, payment_status')
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (paymentsError) {
      console.error('Error fetching payments for reconciliation:', paymentsError)
      return
    }

    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select('amount, refund_status')
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    if (refundsError) {
      console.error('Error fetching refunds for reconciliation:', refundsError)
      return
    }

    // Calculate totals
    const successfulPayments = payments.filter(p => p.payment_status === 'succeeded')
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0)
    const totalDeposits = successfulPayments
      .filter(p => p.payment_type === 'deposit')
      .reduce((sum, p) => sum + p.amount, 0)
    const totalFinalPayments = successfulPayments
      .filter(p => p.payment_type === 'final_payment')
      .reduce((sum, p) => sum + p.amount, 0)
    const totalRefunds = refunds
      .filter(r => r.refund_status === 'succeeded')
      .reduce((sum, r) => sum + r.amount, 0)

    // Upsert reconciliation record
    const { error: reconciliationError } = await supabase
      .from('financial_reconciliation')
      .upsert({
        organization_id: organizationId,
        period_start: startOfMonth.toISOString().split('T')[0],
        period_end: endOfMonth.toISOString().split('T')[0],
        total_revenue: totalRevenue,
        total_deposits: totalDeposits,
        total_final_payments: totalFinalPayments,
        total_refunds: totalRefunds,
        net_revenue: totalRevenue - totalRefunds,
        reconciliation_status: 'completed',
        updated_at: new Date().toISOString()
      })

    if (reconciliationError) {
      console.error('Error updating reconciliation:', reconciliationError)
    } else {
      console.log('Reconciliation updated for organization:', organizationId)
    }
    
  } catch (error) {
    console.error('Error in triggerReconciliation:', error)
  }
}

async function sendPaymentConfirmationEmail(payment: any) {
  try {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll just log the intent
    console.log('Would send payment confirmation email:', {
      to: payment.booking.client_email,
      subject: `Payment Confirmation - ${payment.booking.event_name}`,
      amount: payment.amount,
      paymentType: payment.payment_type,
      eventDate: payment.booking.event_date
    })
    
    // TODO: Implement actual email sending
    // await emailService.send({
    //   to: payment.booking.client_email,
    //   template: 'payment-confirmation',
    //   data: { payment, booking: payment.booking }
    // })
    
  } catch (error) {
    console.error('Error sending payment confirmation email:', error)
  }
}

async function sendPaymentFailureNotification(payment: any) {
  try {
    console.log('Would send payment failure notification:', {
      to: payment.booking.client_email,
      subject: `Payment Failed - ${payment.booking.event_name}`,
      amount: payment.amount,
      paymentType: payment.payment_type
    })
    
    // TODO: Implement actual notification sending
    
  } catch (error) {
    console.error('Error sending payment failure notification:', error)
  }
}

async function createSystemNotification(payment: any) {
  try {
    // Create in-app notification for venue staff
    const { error } = await supabase
      .from('system_logs')
      .insert({
        organization_id: payment.organization_id,
        log_type: 'payment_success',
        log_level: 'info',
        message: `Payment received: $${payment.amount} ${payment.payment_type} for ${payment.booking.event_name}`,
        metadata: {
          payment_id: payment.id,
          booking_id: payment.booking_id,
          amount: payment.amount,
          payment_type: payment.payment_type
        }
      })

    if (error) {
      console.error('Error creating system notification:', error)
    }

  } catch (error) {
    console.error('Error in createSystemNotification:', error)
  }
}

// ======================================
// SUBSCRIPTION EVENT HANDLERS
// ======================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const organizationId = session.metadata?.organization_id

    if (!organizationId) {
      console.error('No organization_id in session metadata')
      return
    }

    const { error } = await supabase
      .from('organizations')
      .update({
        stripe_customer_id: session.customer as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating organization with customer ID:', error)
    } else {
      console.log(`✅ Updated organization ${organizationId} with customer ${session.customer}`)
    }
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const priceId = subscription.items.data[0]?.price.id

    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, included_minutes')
      .eq('stripe_price_id', priceId)
      .single()

    if (planError || !plan) {
      console.error('Could not find subscription plan for price ID:', priceId, planError)
      return
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_plan_id: plan.id,
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer as string)

    if (updateError) {
      console.error('Error updating organization subscription:', updateError)
      return
    }

    console.log(`✅ Updated subscription for customer ${subscription.customer}`)

    // Create new usage record for the new billing period
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single()

    if (org) {
      await supabase
        .from('organization_usage')
        .insert({
          organization_id: org.id,
          billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          billing_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          total_call_minutes: 0,
          included_minutes: plan.included_minutes,
          overage_minutes: 0,
          overage_cost: 0,
          total_calls: 0,
        })

      console.log(`✅ Created new usage period for org ${org.id}`)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdate:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer as string)

    if (error) {
      console.error('Error marking subscription as canceled:', error)
    } else {
      console.log(`✅ Marked subscription as canceled for customer ${subscription.customer}`)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single()

    if (org) {
      await supabase
        .from('usage_events')
        .insert({
          organization_id: org.id,
          event_type: 'payment_succeeded',
          metadata: {
            invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
          }
        })

      console.log(`✅ Logged payment success for org ${org.id}`)
    }
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', invoice.customer as string)

    if (error) {
      console.error('Error marking subscription as past_due:', error)
      return
    }

    console.log(`⚠️ Marked subscription as past_due for customer ${invoice.customer}`)

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', invoice.customer as string)
      .single()

    if (org) {
      await supabase
        .from('usage_events')
        .insert({
          organization_id: org.id,
          event_type: 'payment_failed',
          metadata: {
            invoice_id: invoice.id,
            amount_due: invoice.amount_due,
            attempt_count: invoice.attempt_count,
          }
        })

      console.log(`⚠️ Logged payment failure for org ${org.id}`)
    }
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error)
  }
}

async function handleTrialEndingSoon(subscription: Stripe.Subscription) {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('stripe_customer_id', subscription.customer as string)
      .single()

    if (org) {
      await supabase
        .from('usage_events')
        .insert({
          organization_id: org.id,
          event_type: 'trial_ending_soon',
          metadata: {
            trial_end: new Date(subscription.trial_end! * 1000).toISOString(),
            days_remaining: Math.ceil((subscription.trial_end! * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
          }
        })

      console.log(`📧 Trial ending soon for org ${org.id} - TODO: send notification`)
    }
  } catch (error) {
    console.error('Error in handleTrialEndingSoon:', error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      return new Response('Missing signature or webhook secret', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    console.log('Received Stripe webhook:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
        
      case 'customer.created':
        console.log('Customer created:', event.data.object.id)
        break
        
      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id)
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        console.log('Invoice payment failed:', event.data.object.id)
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('Subscription event:', event.type)
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.data.object.id)
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.trial_will_end':
        console.log('Trial ending soon:', event.data.object.id)
        await handleTrialEndingSoon(event.data.object as Stripe.Subscription)
        break

      case 'checkout.session.completed':
        console.log('Checkout session completed:', event.data.object.id)
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/*
This webhook handles the following Stripe events:

1. payment_intent.succeeded - Payment completed successfully
   - Updates payment status to 'succeeded'
   - Triggers automated reconciliation
   - Sends confirmation email
   - Creates system notification

2. payment_intent.payment_failed - Payment failed
   - Updates payment status to 'failed'
   - Sends failure notification

3. charge.refunded - Refund processed
   - Creates refund record
   - Updates payment status if fully refunded
   - Triggers reconciliation update

To set up this webhook in Stripe:
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: https://your-project.supabase.co/functions/v1/stripe-webhook
3. Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
4. Copy the webhook secret to your environment variables

Environment variables needed:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
*/ 