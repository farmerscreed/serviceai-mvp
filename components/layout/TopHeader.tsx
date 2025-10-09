'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { useOrganization } from '@/lib/organizations/organization-context'
import { Bell, User, ChevronDown, LogOut, Settings, Building2, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/ui/NotificationSystem'

interface TopHeaderProps {
  title?: string
  breadcrumbs?: { name: string; href?: string }[]
  onMobileMenuToggle?: () => void
}

export default function TopHeader({ title, breadcrumbs, onMobileMenuToggle }: TopHeaderProps) {
  const { user, signOut } = useAuth()
  const { currentOrganization, organizations, switchOrganization } = useOrganization()
  const router = useRouter()
  
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const handleSwitchOrg = async (orgId: string) => {
    await switchOrganization(orgId)
    setShowOrgSwitcher(false)
    router.push('/dashboard')
  }

  const currentOrgId = currentOrganization?.organization_id

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Mobile Menu Button + Title/Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          {/* Title or Breadcrumbs */}
          <div className="flex items-center gap-4">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {crumb.href ? (
                    <button
                      onClick={() => router.push(crumb.href!)}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {crumb.name}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  )}
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-gray-400">/</span>
                  )}
                </div>
              ))}
            </nav>
          ) : title ? (
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{title}</h1>
          ) : null}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Organization Switcher (if multiple orgs) - Hidden on mobile */}
          {organizations.length > 1 && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 hidden lg:inline">
                  {currentOrganization?.organization_name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showOrgSwitcher && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowOrgSwitcher(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Switch Organization
                    </div>
                    {organizations.map((org) => (
                      <button
                        key={org.organization_id}
                        onClick={() => handleSwitchOrg(org.organization_id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors',
                          org.organization_id === currentOrgId && 'bg-blue-50'
                        )}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {org.organization_name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{org.organization_name}</div>
                          <div className="text-xs text-gray-500">{org.user_role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/profile')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/settings')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-200 my-2" />
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

