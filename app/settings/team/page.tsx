'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'
import {
  Users,
  Plus,
  Mail,
  Crown,
  Shield,
  User,
  Trash2,
  Edit,
  ChevronRight
} from 'lucide-react'

interface TeamMember {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'inactive'
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
  created_at: string
}

interface Invitation {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'member'
  status: 'pending' | 'accepted' | 'expired'
  invited_by: string
  created_at: string
  expires_at: string
}

export default function TeamSettingsPage() {
  const { user } = useAuth()
  const { currentOrganization } = useOrganization()
  const toast = useToast()
  const { confirm } = useConfirm()

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member'
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadTeamData()
    }
  }, [currentOrganization])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        fetch(`/api/organizations/${currentOrganization?.organization_id}/members`, { credentials: 'same-origin' }),
        fetch(`/api/organizations/${currentOrganization?.organization_id}/invitations`, { credentials: 'same-origin' })
      ])

      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        if (membersData.success) {
          setTeamMembers(membersData.members || [])
        }
      }

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json()
        if (invitationsData.success) {
          setInvitations(invitationsData.invitations || [])
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error)
      toast.error('Error loading team data')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentOrganization) {
      toast.error('No organization selected')
      return
    }

    if (!inviteForm.email.trim()) {
      toast.warning('Please enter an email address')
      return
    }

    setInviteLoading(true)
    try {
      const response = await fetch('/api/organizations/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: currentOrganization.organization_id,
          email: inviteForm.email,
          role: inviteForm.role
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Invitation sent successfully!')
        setShowInviteModal(false)
        setInviteForm({ email: '', role: 'member' })
        await loadTeamData()
      } else {
        toast.error(result.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Error sending invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    const confirmed = await confirm({
      title: 'Remove Team Member?',
      message: `Are you sure you want to remove ${memberEmail} from your team? They will lose access to this organization.`,
      confirmText: 'Yes, Remove',
      variant: 'danger',
    })

    if (!confirmed) return

    setActionLoading(memberId)
    try {
      const response = await fetch(`/api/organizations/${currentOrganization?.organization_id}/members/${memberId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Team member removed successfully')
        await loadTeamData()
      } else {
        toast.error(result.error || 'Failed to remove team member')
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      toast.error('Error removing team member')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    const confirmed = await confirm({
      title: 'Cancel Invitation?',
      message: `Are you sure you want to cancel the invitation to ${email}?`,
      confirmText: 'Yes, Cancel',
      variant: 'warning',
    })

    if (!confirmed) return

    setActionLoading(invitationId)
    try {
      const response = await fetch(`/api/organizations/${currentOrganization?.organization_id}/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Invitation cancelled successfully')
        await loadTeamData()
      } else {
        toast.error(result.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('Error cancelling invitation')
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team & Access</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Invite Team Member
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Members */}
      {!loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({teamMembers.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {teamMembers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-gray-600 mb-4">Invite your first team member to get started.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Invite Team Member
                  </button>
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                          {member.user.full_name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {member.user.full_name || 'No name set'}
                          </h3>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                          </span>
                        </div>
                        
                        {member.user_id !== user.id && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.user.email)}
                            disabled={actionLoading === member.id}
                            className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {actionLoading === member.id ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Pending Invitations ({invitations.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                          <Mail className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{invitation.email}</h3>
                          <p className="text-sm text-gray-600">
                            Invited {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(invitation.role)}`}>
                          {getRoleIcon(invitation.role)}
                          {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                        
                        <button
                          onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                          disabled={actionLoading === invitation.id}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {actionLoading === invitation.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Invite Team Member</h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'member' }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Admins can manage team members and organization settings.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
