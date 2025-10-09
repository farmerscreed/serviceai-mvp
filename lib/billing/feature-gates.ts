import { createClient } from '@supabase/supabase-js'
import type { SubscriptionTier } from './types'

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

/**
 * Check if organization has an active subscription
 */
export async function hasActiveSubscription(organizationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('has_active_subscription', {
        p_organization_id: organizationId,
      })

    if (error) {
      console.error('Error checking subscription:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error checking subscription:', error)
    return false
  }
}

/**
 * Get organization's billing information
 */
export async function getBillingInfo(organizationId: string): Promise<any | null> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_organization_billing_info', {
        p_organization_id: organizationId,
      })
      .single()

    if (error || !data) {
      console.error('Error getting billing info:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting billing info:', error)
    return null
  }
}

/**
 * Check if organization has access to a specific feature based on tier
 */
export async function hasFeatureAccess(
  organizationId: string,
  feature: string
): Promise<boolean> {
  const billingInfo = await getBillingInfo(organizationId)

  if (!billingInfo || !billingInfo.has_active_sub) {
    return false
  }

  // Get subscription plan limits
  const { data: limits } = await supabaseAdmin
    .rpc('get_subscription_limits', {
      p_organization_id: organizationId,
    })

  if (!limits) {
    return false
  }

  // Check feature-specific access
  // For now, all features are available to all tiers during trial/active
  // You can add tier-specific feature checks here
  return true
}

/**
 * Require active subscription - throws error if not active
 */
export async function requireActiveSubscription(organizationId: string): Promise<void> {
  const hasActive = await hasActiveSubscription(organizationId)

  if (!hasActive) {
    throw new Error('Active subscription required. Please upgrade your plan.')
  }
}

/**
 * Get subscription tier for organization
 */
export async function getSubscriptionTier(
  organizationId: string
): Promise<SubscriptionTier | null> {
  const billingInfo = await getBillingInfo(organizationId)
  return billingInfo?.subscription_tier || null
}

/**
 * Check if organization is on a specific tier or higher
 */
export async function hasTierOrHigher(
  organizationId: string,
  requiredTier: SubscriptionTier
): Promise<boolean> {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    starter: 1,
    professional: 2,
    enterprise: 3,
  }

  const currentTier = await getSubscriptionTier(organizationId)

  if (!currentTier) {
    return false
  }

  return tierHierarchy[currentTier] >= tierHierarchy[requiredTier]
}

