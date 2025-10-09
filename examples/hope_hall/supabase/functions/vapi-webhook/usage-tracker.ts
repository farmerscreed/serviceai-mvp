// ============================================================================
// USAGE TRACKING MODULE FOR VENUEVOICE.AI
// ============================================================================
// This module tracks call usage for subscription billing and limits enforcement
// Integrates with organization_usage and usage_events tables

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface UsageTrackingResult {
  success: boolean
  totalMinutes: number
  overageMinutes: number
  overageCost: number
  usagePercentage: number
  limitReached: boolean
  warningLevel?: 'none' | 'approaching' | 'exceeded' | 'hard_limit'
  message?: string
}

/**
 * Track call usage and update organization_usage table
 * Called from handleCallEnd after each completed call
 */
export async function trackCallUsage(
  supabase: SupabaseClient,
  organizationId: string,
  callDurationSeconds: number,
  callId?: string
): Promise<UsageTrackingResult> {
  try {
    console.log('=== TRACKING CALL USAGE ===')
    console.log('Organization ID:', organizationId)
    console.log('Call Duration (seconds):', callDurationSeconds)

    // Convert seconds to minutes (round up to nearest minute)
    const callMinutes = Math.ceil(callDurationSeconds / 60)
    console.log('Call Minutes (rounded up):', callMinutes)

    // Get organization subscription details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        subscription_plan_id,
        subscription_status,
        current_period_start,
        current_period_end,
        subscription_plans (
          included_minutes,
          overage_rate
        )
      `)
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      console.error('Error fetching organization:', orgError)
      return {
        success: false,
        totalMinutes: 0,
        overageMinutes: 0,
        overageCost: 0,
        usagePercentage: 0,
        limitReached: false,
        message: 'Organization not found'
      }
    }

    // If no subscription plan, allow unlimited usage (for legacy orgs or grace period)
    if (!org.subscription_plan_id || !org.subscription_plans) {
      console.log('⚠️ No subscription plan found - allowing unlimited usage')
      return {
        success: true,
        totalMinutes: callMinutes,
        overageMinutes: 0,
        overageCost: 0,
        usagePercentage: 0,
        limitReached: false,
        warningLevel: 'none',
        message: 'No subscription plan - unlimited usage'
      }
    }

    const planIncludedMinutes = org.subscription_plans.included_minutes
    const planOverageRate = parseFloat(org.subscription_plans.overage_rate)

    console.log('Plan included minutes:', planIncludedMinutes)
    console.log('Plan overage rate:', planOverageRate)

    // Get or create usage record for current billing period
    const { data: existingUsage, error: fetchUsageError } = await supabase
      .from('organization_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('billing_period_start', org.current_period_start)
      .single()

    if (fetchUsageError && fetchUsageError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching usage:', fetchUsageError)
    }

    // Calculate new totals
    const previousMinutes = existingUsage?.total_call_minutes || 0
    const previousCalls = existingUsage?.total_calls || 0
    const newTotalMinutes = previousMinutes + callMinutes
    const newTotalCalls = previousCalls + 1

    // Calculate overage
    const newOverageMinutes = Math.max(0, newTotalMinutes - planIncludedMinutes)
    const newOverageCost = Math.round(newOverageMinutes * planOverageRate * 100) // Convert to cents

    // Calculate usage percentage
    const usagePercentage = (newTotalMinutes / planIncludedMinutes) * 100

    // Determine warning level
    let warningLevel: 'none' | 'approaching' | 'exceeded' | 'hard_limit' = 'none'
    let limitReached = false

    if (usagePercentage >= 200) {
      warningLevel = 'hard_limit'
      limitReached = true
    } else if (usagePercentage >= 100) {
      warningLevel = 'exceeded'
    } else if (usagePercentage >= 90) {
      warningLevel = 'approaching'
    }

    console.log('Usage calculation:', {
      previousMinutes,
      newTotalMinutes,
      newOverageMinutes,
      newOverageCost,
      usagePercentage: usagePercentage.toFixed(2) + '%',
      warningLevel
    })

    // Upsert usage record
    const usageData = {
      organization_id: organizationId,
      billing_period_start: org.current_period_start,
      billing_period_end: org.current_period_end,
      total_call_minutes: newTotalMinutes,
      included_minutes: planIncludedMinutes,
      overage_minutes: newOverageMinutes,
      overage_cost: newOverageCost,
      total_calls: newTotalCalls,
      last_updated_call_id: callId || null,
      updated_at: new Date().toISOString()
    }

    const { error: upsertError } = await supabase
      .from('organization_usage')
      .upsert(usageData, {
        onConflict: 'organization_id,billing_period_start'
      })

    if (upsertError) {
      console.error('Error upserting usage:', upsertError)
      return {
        success: false,
        totalMinutes: newTotalMinutes,
        overageMinutes: newOverageMinutes,
        overageCost: newOverageCost,
        usagePercentage,
        limitReached,
        warningLevel,
        message: 'Failed to update usage tracking'
      }
    }

    console.log('✅ Usage tracked successfully')

    // Log usage event for significant milestones
    await logUsageEvent(supabase, organizationId, callId, callMinutes, warningLevel, {
      totalMinutes: newTotalMinutes,
      includedMinutes: planIncludedMinutes,
      usagePercentage
    })

    return {
      success: true,
      totalMinutes: newTotalMinutes,
      overageMinutes: newOverageMinutes,
      overageCost: newOverageCost,
      usagePercentage,
      limitReached,
      warningLevel,
      message: generateUsageMessage(warningLevel, usagePercentage, planIncludedMinutes, newTotalMinutes)
    }

  } catch (error) {
    console.error('Error in trackCallUsage:', error)
    return {
      success: false,
      totalMinutes: 0,
      overageMinutes: 0,
      overageCost: 0,
      usagePercentage: 0,
      limitReached: false,
      message: 'Usage tracking failed: ' + error.message
    }
  }
}

/**
 * Log significant usage events for audit trail and notifications
 */
async function logUsageEvent(
  supabase: SupabaseClient,
  organizationId: string,
  callId: string | undefined,
  minutesUsed: number,
  warningLevel: string,
  metadata: any
) {
  try {
    // Only log events at certain thresholds to avoid spam
    const shouldLog =
      warningLevel === 'approaching' || // 90%
      warningLevel === 'exceeded' ||    // 100%
      warningLevel === 'hard_limit'     // 200%

    if (!shouldLog) {
      return
    }

    let eventType = 'call_completed'
    if (warningLevel === 'approaching') {
      eventType = 'overage_threshold'
    } else if (warningLevel === 'exceeded') {
      eventType = 'limit_reached'
    } else if (warningLevel === 'hard_limit') {
      eventType = 'hard_limit_reached'
    }

    const { error } = await supabase
      .from('usage_events')
      .insert({
        organization_id: organizationId,
        event_type: eventType,
        call_id: callId || null,
        minutes_used: minutesUsed,
        metadata: {
          ...metadata,
          warning_level: warningLevel,
          timestamp: new Date().toISOString()
        }
      })

    if (error) {
      console.error('Error logging usage event:', error)
    } else {
      console.log(`📊 Logged usage event: ${eventType}`)
    }

  } catch (error) {
    console.error('Error in logUsageEvent:', error)
    // Don't throw - logging failures shouldn't break usage tracking
  }
}

/**
 * Generate user-friendly message about usage status
 */
function generateUsageMessage(
  warningLevel: string,
  usagePercentage: number,
  includedMinutes: number,
  usedMinutes: number
): string {
  const remainingMinutes = Math.max(0, includedMinutes - usedMinutes)

  switch (warningLevel) {
    case 'hard_limit':
      return `⛔ Hard limit reached! You've used ${usedMinutes} minutes (${usagePercentage.toFixed(0)}% of plan). Please upgrade your plan to continue service.`

    case 'exceeded':
      return `⚠️ Plan limit exceeded! You've used ${usedMinutes}/${includedMinutes} minutes. Overage charges apply at your plan's rate.`

    case 'approaching':
      return `📊 Approaching plan limit: ${usedMinutes}/${includedMinutes} minutes used (${usagePercentage.toFixed(0)}%). Consider upgrading soon.`

    default:
      return `✅ Usage tracked: ${usedMinutes}/${includedMinutes} minutes (${usagePercentage.toFixed(0)}%). ${remainingMinutes} minutes remaining.`
  }
}

/**
 * Check if organization can receive calls (within usage limits)
 * Called at beginning of call to enforce hard limits
 */
export async function checkUsageLimits(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; usagePercentage?: number }> {
  try {
    console.log('=== CHECKING USAGE LIMITS ===')

    // Get organization subscription details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        subscription_status,
        subscription_plan_id,
        current_period_start,
        subscription_plans (
          included_minutes
        )
      `)
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      console.error('Error fetching organization for limit check:', orgError)
      // Allow calls if we can't check (fail open, not closed)
      return { allowed: true }
    }

    // Check subscription status
    if (org.subscription_status === 'canceled' || org.subscription_status === 'trial_expired') {
      return {
        allowed: false,
        reason: `Subscription ${org.subscription_status}. Please update billing to continue service.`
      }
    }

    // If no plan, allow (grace period or legacy)
    if (!org.subscription_plan_id || !org.subscription_plans) {
      return { allowed: true }
    }

    // Get current usage
    const { data: usage } = await supabase
      .from('organization_usage')
      .select('total_call_minutes, included_minutes')
      .eq('organization_id', organizationId)
      .eq('billing_period_start', org.current_period_start)
      .single()

    if (!usage) {
      // No usage record yet, allow
      return { allowed: true }
    }

    const usagePercentage = (usage.total_call_minutes / usage.included_minutes) * 100

    // Hard limit: 2x included minutes (prevent runaway costs)
    if (usage.total_call_minutes >= usage.included_minutes * 2) {
      console.log('⛔ HARD LIMIT REACHED - blocking call')
      return {
        allowed: false,
        reason: 'Usage limit reached (200% of plan). Please upgrade to continue receiving calls.',
        usagePercentage
      }
    }

    console.log('✅ Usage check passed:', {
      used: usage.total_call_minutes,
      included: usage.included_minutes,
      percentage: usagePercentage.toFixed(2) + '%'
    })

    return {
      allowed: true,
      usagePercentage
    }

  } catch (error) {
    console.error('Error in checkUsageLimits:', error)
    // Fail open - allow calls if check fails
    return { allowed: true }
  }
}

/**
 * Get current usage summary for an organization
 * Used in dashboard and webhooks
 */
export async function getUsageSummary(
  supabase: SupabaseClient,
  organizationId: string
): Promise<any> {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        subscription_status,
        current_period_start,
        current_period_end,
        subscription_plans (
          name,
          included_minutes,
          overage_rate,
          monthly_price
        )
      `)
      .eq('id', organizationId)
      .single()

    if (!org) {
      return null
    }

    const { data: usage } = await supabase
      .from('organization_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('billing_period_start', org.current_period_start)
      .single()

    return {
      organization: {
        id: org.id,
        name: org.name,
        subscription_status: org.subscription_status
      },
      billing_period: {
        start: org.current_period_start,
        end: org.current_period_end
      },
      plan: org.subscription_plans,
      usage: usage || {
        total_call_minutes: 0,
        total_calls: 0,
        overage_minutes: 0,
        overage_cost: 0
      }
    }

  } catch (error) {
    console.error('Error getting usage summary:', error)
    return null
  }
}
