import { createClient } from '@supabase/supabase-js'
import type { UsageEventType, UsageLimit } from './types'

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
 * Log a usage event for billing tracking
 */
export async function logUsageEvent(
  organizationId: string,
  eventType: UsageEventType,
  quantity: number = 1,
  metadata: Record<string, any> = {}
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('log_usage_event', {
        p_organization_id: organizationId,
        p_event_type: eventType,
        p_quantity: quantity,
        p_metadata: metadata,
      })

    if (error) {
      console.error('Error logging usage event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error logging usage event:', error)
    return null
  }
}

/**
 * Check if organization has not exceeded usage limit for an event type
 */
export async function checkUsageLimit(
  organizationId: string,
  eventType: UsageEventType
): Promise<UsageLimit> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('check_usage_limit', {
        p_organization_id: organizationId,
        p_event_type: eventType,
      })
      .single()

    if (error || !data) {
      console.error('Error checking usage limit:', error)
      // Return conservative default (not allowed)
      return {
        allowed: false,
        current_usage: 0,
        limit_value: 0,
        percentage: 0,
      }
    }

    return data as UsageLimit
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return {
      allowed: false,
      current_usage: 0,
      limit_value: 0,
      percentage: 0,
    }
  }
}

/**
 * Get current usage statistics for all event types
 */
export async function getCurrentUsage(organizationId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_current_usage', {
        p_organization_id: organizationId,
        p_event_type: null,
      })

    if (error) {
      console.error('Error getting current usage:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error getting current usage:', error)
    return []
  }
}

/**
 * Check and log usage in one transaction
 * Returns true if action is allowed and usage was logged
 */
export async function checkAndLogUsage(
  organizationId: string,
  eventType: UsageEventType,
  quantity: number = 1,
  metadata: Record<string, any> = {}
): Promise<{ allowed: boolean; reason?: string }> {
  // Check limit first
  const limit = await checkUsageLimit(organizationId, eventType)

  if (!limit.allowed) {
    return {
      allowed: false,
      reason: `${eventType} limit reached (${limit.current_usage}/${limit.limit_value})`,
    }
  }

  // Log usage
  const eventId = await logUsageEvent(organizationId, eventType, quantity, metadata)

  if (!eventId) {
    return {
      allowed: false,
      reason: 'Failed to log usage event',
    }
  }

  return { allowed: true }
}

