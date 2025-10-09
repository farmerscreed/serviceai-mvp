// Database function helpers for ServiceAI Multi-Language Schema
// Task 1.2: Multi-Language Database Functions

import { createServerClient } from './server'
import { createBrowserClient } from './client'
import type { 
  OrganizationSettingsResult,
  OrganizationTemplatesResult,
  CustomerConfigDetailsResult,
  CallSummaryResult,
  SMSSummaryResult,
  AppointmentsResult
} from './database.types'

// =====================================================
// Organization Settings Functions
// =====================================================

export async function getOrganizationSettings(organizationId: string): Promise<OrganizationSettingsResult | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_organization_settings', {
    p_organization_id: organizationId
  })
  
  if (error) {
    console.error('Error getting organization settings:', error)
    return null
  }
  
  return data?.[0] || null
}

export async function getOrganizationSettingsClient(organizationId: string): Promise<OrganizationSettingsResult | null> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('get_organization_settings', {
    p_organization_id: organizationId
  })
  
  if (error) {
    console.error('Error getting organization settings:', error)
    return null
  }
  
  return data?.[0] || null
}

// =====================================================
// Industry Templates Functions
// =====================================================

export async function getOrganizationTemplates(organizationId: string): Promise<OrganizationTemplatesResult[]> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_organization_templates', {
    p_organization_id: organizationId
  })
  
  if (error) {
    console.error('Error getting organization templates:', error)
    return []
  }
  
  return data || []
}

export async function getOrganizationTemplatesClient(organizationId: string): Promise<OrganizationTemplatesResult[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('get_organization_templates', {
    p_organization_id: organizationId
  })
  
  if (error) {
    console.error('Error getting organization templates:', error)
    return []
  }
  
  return data || []
}

// =====================================================
// Customer Configuration Functions
// =====================================================

export async function getCustomerConfigDetails(customerConfigId: string): Promise<CustomerConfigDetailsResult | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_customer_config_details', {
    p_customer_config_id: customerConfigId
  })
  
  if (error) {
    console.error('Error getting customer config details:', error)
    return null
  }
  
  return data?.[0] || null
}

export async function getCustomerConfigDetailsClient(customerConfigId: string): Promise<CustomerConfigDetailsResult | null> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('get_customer_config_details', {
    p_customer_config_id: customerConfigId
  })
  
  if (error) {
    console.error('Error getting customer config details:', error)
    return null
  }
  
  return data?.[0] || null
}

// =====================================================
// Analytics Functions
// =====================================================

export async function getOrganizationCallSummary(
  organizationId: string, 
  startDate: string, 
  endDate: string
): Promise<CallSummaryResult | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_organization_call_summary', {
    p_organization_id: organizationId,
    p_start_date: startDate,
    p_end_date: endDate
  })
  
  if (error) {
    console.error('Error getting call summary:', error)
    return null
  }
  
  return data?.[0] || null
}

export async function getOrganizationSMSSummary(
  organizationId: string, 
  startDate: string, 
  endDate: string
): Promise<SMSSummaryResult | null> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_organization_sms_summary', {
    p_organization_id: organizationId,
    p_start_date: startDate,
    p_end_date: endDate
  })
  
  if (error) {
    console.error('Error getting SMS summary:', error)
    return null
  }
  
  return data?.[0] || null
}

export async function getOrganizationAppointments(
  organizationId: string, 
  startDate: string, 
  endDate: string
): Promise<AppointmentsResult[]> {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase.rpc('get_organization_appointments', {
    p_organization_id: organizationId,
    p_start_date: startDate,
    p_end_date: endDate
  })
  
  if (error) {
    console.error('Error getting appointments:', error)
    return []
  }
  
  return data || []
}

// =====================================================
// Client-side Analytics Functions
// =====================================================

export async function getOrganizationCallSummaryClient(
  organizationId: string, 
  startDate: string, 
  endDate: string
): Promise<CallSummaryResult | null> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('get_organization_call_summary', {
    p_organization_id: organizationId,
    p_start_date: startDate,
    p_end_date: endDate
  })
  
  if (error) {
    console.error('Error getting call summary:', error)
    return null
  }
  
  return data?.[0] || null
}

export async function getOrganizationSMSSummaryClient(
  organizationId: string, 
  startDate: string, 
  endDate: string
): Promise<SMSSummaryResult | null> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('get_organization_sms_summary', {
    p_organization_id: organizationId,
    p_start_date: startDate,
    p_end_date: endDate
  })
  
  if (error) {
    console.error('Error getting SMS summary:', error)
    return null
  }
  
  return data?.[0] || null
}

export async function getOrganizationAppointmentsClient(
  organizationId: string, 
  startDate: string, 
  endDate: string
): Promise<AppointmentsResult[]> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.rpc('get_organization_appointments', {
    p_organization_id: organizationId,
    p_start_date: startDate,
    p_end_date: endDate
  })
  
  if (error) {
    console.error('Error getting appointments:', error)
    return []
  }
  
  return data || []
}

// =====================================================
// Utility Functions
// =====================================================

export function formatDateForQuery(date: Date): string {
  return date.toISOString()
}

export function getDateRange(days: number = 30): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return {
    startDate: formatDateForQuery(startDate),
    endDate: formatDateForQuery(endDate)
  }
}

// =====================================================
// Type Guards
// =====================================================

export function isValidLanguageCode(code: string): code is 'en' | 'es' {
  return code === 'en' || code === 'es'
}

export function isValidIndustryCode(code: string): code is 'hvac' | 'plumbing' | 'electrical' | 'medical' | 'veterinary' | 'property' {
  return ['hvac', 'plumbing', 'electrical', 'medical', 'veterinary', 'property'].includes(code)
}

export function isValidSMSDirection(direction: string): direction is 'inbound' | 'outbound' {
  return direction === 'inbound' || direction === 'outbound'
}

export function isValidSMSStatus(status: string): status is 'pending' | 'sent' | 'delivered' | 'failed' | 'received' | 'read' {
  return ['pending', 'sent', 'delivered', 'failed', 'received', 'read'].includes(status)
}

export function isValidAppointmentStatus(status: string): status is 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' {
  return ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'].includes(status)
}
