export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

export type SubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'

export type BillingInterval = 'monthly' | 'yearly'

export type UsageEventType = 'call' | 'sms' | 'template_use' | 'api_call'

export interface SubscriptionPlan {
  id: string
  name: string
  slug: SubscriptionTier
  stripe_price_id_monthly: string
  stripe_price_id_yearly: string
  stripe_product_id: string
  price_monthly: number
  price_yearly: number
  currency: string
  features: string[]
  limits: {
    calls_per_month: number
    sms_per_month: number
    templates: number
    team_members: number
  }
  description: string
  is_popular: boolean
  sort_order: number
  is_active: boolean
}

export interface UsageEvent {
  id: string
  organization_id: string
  event_type: UsageEventType
  quantity: number
  metadata: Record<string, any>
  billable: boolean
  reported_to_stripe: boolean
  stripe_usage_record_id?: string
  event_time: string
  created_at: string
}

export interface UsageLimit {
  allowed: boolean
  current_usage: number
  limit_value: number
  percentage: number
}

export interface BillingInfo {
  organization_id: string
  subscription_tier: SubscriptionTier | null
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  has_active_sub: boolean
}

export interface PaymentHistory {
  id: string
  organization_id: string
  stripe_invoice_id: string
  stripe_charge_id?: string
  stripe_payment_intent_id?: string
  amount: number
  currency: string
  status: string
  description?: string
  invoice_pdf_url?: string
  hosted_invoice_url?: string
  period_start?: string
  period_end?: string
  paid_at?: string
  created_at: string
}

