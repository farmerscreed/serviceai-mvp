'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'

interface Organization {
  organization_id: string
  organization_name: string
  organization_slug: string
  industry_code: string | null
  user_role: 'owner' | 'admin' | 'member'
  is_owner: boolean
  is_active: boolean
  member_count: number
  created_at: string
}

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  loading: boolean
  setCurrentOrganization: (org: Organization | null) => void
  refreshOrganizations: () => Promise<void>
  switchOrganization: (organizationId: string) => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

const CURRENT_ORG_KEY = 'serviceai_current_organization_id'

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([])
      setCurrentOrganizationState(null)
      setLoading(false)
      return
    }

    try {
      // Prefer RPC; fallback to explicit join on ambiguity errors
      // Generated Database types may lag new RPCs; using any-cast until types are updated
      const { data, error } = await (supabase as any).rpc('get_user_organizations', { p_user_id: user.id })

      let orgs = data as any[] | null
      if (error) {
        console.warn('get_user_organizations RPC failed', {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
        })
        // Fallback query if RPC fails (e.g., ambiguous column error 42702)
        const { data: fallback, error: fbErr } = await supabase
          .from('organization_members')
          .select(`
            organization_id:organizations(id),
            organization_name:organizations(name),
            organization_slug:organizations(slug),
            industry_code:organizations(industry_code),
            user_role:role,
            is_active:organizations(is_active),
            created_at:organizations(created_at)
          `)
          .eq('user_id', user.id)
        if (fbErr) throw fbErr

        // Enrich with member_count using separate count queries (organizations list is small)
        const enriched = await Promise.all(
          (fallback || []).map(async (row: any) => {
            const { count, error: countError } = await supabase
              .from('organization_members')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', row.organization_id)
              .eq('is_active', true)

            return {
              ...row,
              member_count: countError ? 0 : (count ?? 0),
              // Compute is_owner client-side based on role
              is_owner: row.user_role === 'owner',
            }
          })
        )
        orgs = enriched
      }

      console.log('✅ Organizations loaded:', orgs?.length || 0, 'organizations')
      setOrganizations(orgs || [])

      // Set current organization
      if (orgs && orgs.length > 0) {
        // Try to restore from localStorage
        const savedOrgId = localStorage.getItem(CURRENT_ORG_KEY)
        const savedOrg = orgs.find((org: Organization) => org.organization_id === savedOrgId)
        
        if (savedOrg) {
          setCurrentOrganizationState(savedOrg)
        } else {
          // Default to first organization (usually the owner's org)
          setCurrentOrganizationState(orgs[0])
          localStorage.setItem(CURRENT_ORG_KEY, orgs[0].organization_id)
        }
      } else {
        setCurrentOrganizationState(null)
        localStorage.removeItem(CURRENT_ORG_KEY)
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
      setOrganizations([])
      setCurrentOrganizationState(null)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const setCurrentOrganization = useCallback((org: Organization | null) => {
    setCurrentOrganizationState(org)
    if (org) {
      localStorage.setItem(CURRENT_ORG_KEY, org.organization_id)
    } else {
      localStorage.removeItem(CURRENT_ORG_KEY)
    }
  }, [])

  const switchOrganization = useCallback((organizationId: string) => {
    const org = organizations.find(o => o.organization_id === organizationId)
    if (org) {
      setCurrentOrganization(org)
    }
  }, [organizations, setCurrentOrganization])

  useEffect(() => {
    refreshOrganizations()
  }, [refreshOrganizations])

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        loading,
        setCurrentOrganization,
        refreshOrganizations,
        switchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

