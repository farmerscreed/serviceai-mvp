'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  user_email: string
  user_name: string | null
  joined_at: string
  is_active: boolean
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

export default function TeamManagementPage() {
  const { user } = useAuth()
  const { currentOrganization, refreshOrganizations } = useOrganization()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canManageTeam = currentOrganization && ['owner', 'admin'].includes(currentOrganization.user_role)

  useEffect(() => {
    if (currentOrganization) {
      loadTeamData()
    }
  }, [currentOrganization])

  const loadTeamData = async () => {
    if (!currentOrganization) return

    try {
      // Load members with user profile data
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          is_active
        `)
        .eq('organization_id', currentOrganization.organization_id)
        .order('role', { ascending: false })

      if (membersError) throw membersError

      // Get user profiles for all members
      const userIds = membersData?.map(m => m.user_id) || []
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds)

      // Get user emails from auth.users (requires service role, so we'll use a simpler approach)
      // For now, we'll use the user_id as a placeholder
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
      
      const enrichedMembers = (membersData || []).map((member: any) => {
        const profile = profilesMap.get(member.user_id)
        return {
          ...member,
          user_name: profile?.full_name || null,
          user_email: member.user_id // Placeholder - in production, get from auth
        }
      })

      setMembers(enrichedMembers as Member[])

      // Load invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', currentOrganization.organization_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitationsError) throw invitationsError

      setInvitations(invitationsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/organizations/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization?.organization_id,
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('member')
      await loadTeamData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return

    try {
      const response = await fetch('/api/organizations/invitations/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: invitationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke invitation')
      }

      setSuccess('Invitation revoked successfully')
      await loadTeamData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch('/api/organizations/members/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization?.organization_id,
          member_id: memberId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      setSuccess('Member removed successfully')
      await loadTeamData()
      await refreshOrganizations()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!user || !currentOrganization) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage members and invitations for {currentOrganization.organization_name}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Invite Member Form */}
        {canManageTeam && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        )}

        {/* Current Members */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Team Members ({members.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-4 text-center text-gray-500">Loading...</div>
            ) : members.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">No members found</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {(member.user_name || member.user_email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user_name || member.user_email}
                        {member.user_id === user.id && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                      member.role === 'owner' 
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                    {canManageTeam && member.user_id !== user.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {canManageTeam && invitations.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Pending Invitations ({invitations.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 capitalize">
                      {invitation.role}
                    </span>
                    <button
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

