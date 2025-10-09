"use client"

import { useState, useEffect } from 'react'
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  Eye,
  Phone,
  Calendar,
  DollarSign
} from 'lucide-react'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, userProfile, signOut } = useAuth()
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'call' as const,
      title: 'New lead call',
      message: 'Sarah Johnson called about wedding venue',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: 2,
      type: 'booking' as const,
      title: 'Booking confirmed',
      message: 'Martinez Anniversary - $2,500',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'tour' as const,
      title: 'Tour scheduled',
      message: 'Thompson Wedding - Tomorrow 2PM',
      time: '3 hours ago',
      unread: false
    }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const getNotificationIcon = (type: 'call' | 'booking' | 'tour') => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4 text-green-400" />
      case 'booking':
        return <DollarSign className="h-4 w-4 text-blue-400" />
      case 'tour':
        return <Calendar className="h-4 w-4 text-purple-400" />
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Mobile menu button and search */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden text-slate-300 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search leads, tours, bookings..."
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right side - Status, notifications, and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative text-slate-300 hover:text-white">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700">
              <div className="p-3 border-b border-slate-700">
                <h3 className="font-medium text-white">Notifications</h3>
                <p className="text-sm text-slate-400">You have {unreadCount} unread notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-3 hover:bg-slate-700">
                    <div className="flex items-start space-x-3 w-full">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-slate-600" />
                  <DropdownMenuItem 
                    className="text-center text-sm text-blue-400 hover:text-blue-300"
                    onClick={markAllAsRead}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-slate-300 hover:text-white">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline text-sm">
                  {userProfile?.full_name || user?.email || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <div className="p-3 border-b border-slate-700">
                <p className="text-sm font-medium text-white">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-400">
                  {user?.email}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {userProfile?.role || 'Member'}
                </p>
              </div>
              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-600" />
              <DropdownMenuItem 
                onClick={signOut}
                className="text-red-400 hover:text-red-300 hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
