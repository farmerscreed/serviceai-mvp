'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

// Routes that should not use the AppShell (auth pages, onboarding, etc.)
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/callback',
  '/onboarding',
  '/invitations/accept',
  '/',
  '/pricing',
  '/docs',
  '/help',
  '/contact',
  '/about',
  '/blog',
  '/careers',
  '/privacy',
  '/terms',
  '/cookies',
  '/gdpr',
  '/status',
]

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Check if current route should use AppShell
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })

  // Load sidebar collapsed state from localStorage (desktop only)
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebar-collapsed') === 'true'
    setSidebarCollapsed(collapsed)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const handleToggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Don't wrap public routes with AppShell
  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleToggleMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: Fixed, Mobile: Slide-in */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleToggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={handleToggleMobileMenu}
      />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300',
          // Desktop margins
          'lg:ml-16',
          !sidebarCollapsed && 'lg:ml-64',
          // Mobile: No margin
          'ml-0'
        )}
      >
        {/* Top Header */}
        <TopHeader onMobileMenuToggle={handleToggleMobileMenu} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

