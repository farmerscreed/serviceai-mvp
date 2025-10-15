'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Activity, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  Phone,
  MessageSquare,
  Calendar,
  AlertCircle,
  Smartphone,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Activity',
    href: '/activity',
    icon: Activity,
    children: [
      { name: 'All Activity', href: '/activity' },
      { name: 'Calls', href: '/activity/calls' },
      { name: 'SMS Messages', href: '/activity/sms' },
      { name: 'Appointments', href: '/activity/appointments' },
      { name: 'Emergencies', href: '/activity/emergencies' },
    ],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { name: 'Overview', href: '/settings' },
      { name: 'My Assistant', href: '/assistants' },
      { name: 'Phone & Calendar', href: '/settings/phone-calendar' },
      { name: 'SMS Settings', href: '/settings/sms' },
      { name: 'Emergency Contacts', href: '/settings/emergency' },
      { name: 'Team & Access', href: '/settings/team' },
      { name: 'Organization', href: '/settings/organization' },
    ],
  },
  {
    name: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileToggle: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const toggleExpanded = (name: string) => {
    if (collapsed) {
      onToggle() // Expand sidebar if collapsed (desktop only)
    }
    setExpandedItem(expandedItem === name ? null : name)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300',
        // Desktop behavior
        'hidden lg:block',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        // Mobile behavior - slide in from left
        'lg:translate-x-0',
        mobileOpen ? 'block translate-x-0' : 'hidden -translate-x-full',
        'w-64' // Always full width on mobile
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {/* Always show full logo on mobile */}
        <Link href="/dashboard" className={cn(
          "flex items-center gap-2",
          collapsed && "lg:hidden" // Hide on desktop when collapsed
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <span className="text-lg font-bold text-gray-900">ServiceAI</span>
        </Link>
        
        {/* Only show icon on desktop when collapsed */}
        {collapsed && (
          <div className="hidden lg:block w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const expanded = expandedItem === item.name && !collapsed

            return (
              <li key={item.name}>
                {/* Main nav item */}
                {item.children ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-blue-600' : 'text-gray-500')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronLeft 
                          className={cn(
                            'w-4 h-4 transition-transform',
                            expanded ? '-rotate-90' : ''
                          )}
                        />
                      </>
                    )}
                    {item.badge && !collapsed && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-blue-600' : 'text-gray-500')} />
                    {!collapsed && <span>{item.name}</span>}
                    {item.badge && !collapsed && (
                      <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {/* Sub-navigation */}
                {item.children && expanded && (
                  <ul className="mt-1 space-y-1 ml-4 pl-4 border-l-2 border-gray-200">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            pathname === child.href
                              ? 'text-blue-700 font-medium bg-blue-50'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          )}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse button - Desktop only */}
      <div className="hidden lg:block absolute bottom-4 left-0 right-0 px-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed ? 'rotate-180' : '')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

