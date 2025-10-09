"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Crown,
  ChevronLeft,
  ChevronRight,
  Phone,
  X,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Call Logs", href: "/dashboard/calls", icon: Phone },
  { name: "Tours", href: "/dashboard/tours", icon: Calendar },
  { name: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface DashboardSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const handleNavigation = () => {
    // Close mobile sidebar when navigating
    if (onClose) {
      onClose()
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 transition-all duration-300",
        // Mobile: slide in/out, Desktop: always visible
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo and Close Button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <span className="text-lg font-bold text-white">Hope Hall</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex text-slate-400 hover:text-white"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavigation}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-yellow-600/20 to-blue-600/20 text-yellow-400 border border-yellow-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
