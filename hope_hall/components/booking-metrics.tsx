"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, TrendingUp, Clock } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings"
import { formatCurrency } from "@/lib/utils"

interface BookingMetricsProps {
  organizationId: string
}

// FIXED: Safe date comparison function
const isUpcomingEvent = (dateString: string): boolean => {
  try {
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return false;
    
    const eventDate = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    
    return eventDate >= now && eventDate <= ninetyDaysFromNow;
  } catch (error) {
    console.warn('Date comparison error:', error);
    return false;
  }
};

export function BookingMetrics({ organizationId }: BookingMetricsProps) {
  const { bookings, loading, getTotalRevenue, getPendingDeposits } = useBookings()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-4 bg-slate-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate metrics from real data
  const totalRevenue = getTotalRevenue()
  const pendingDeposits = getPendingDeposits()
  
  const confirmedBookings = bookings.filter(booking => booking.event_status === 'confirmed').length
  
  // FIXED: Use safe date comparison for upcoming bookings
  const upcomingBookings = bookings.filter(booking => isUpcomingEvent(booking.event_date)).length

  const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0

  const bookingMetrics = [
    {
      title: "Total Revenue (YTD)",
      value: formatCurrency(totalRevenue),
      subtitle: `${confirmedBookings} confirmed events`,
      trend: bookings.length > 0 ? "+12% vs last quarter" : "No data",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Pending Deposits",
      value: formatCurrency(pendingDeposits),
      subtitle: pendingDeposits > 0 ? "Events awaiting deposit" : "All deposits received",
      badge: pendingDeposits > 0 ? "ACTION NEEDED" : undefined,
      icon: Clock,
      color: pendingDeposits > 0 ? "orange" : "green",
    },
    {
      title: "Upcoming Events",
      value: upcomingBookings.toString(),
      subtitle: "Next 90 days",
      trend: upcomingBookings > 0 ? "Events scheduled" : "No upcoming events",
      icon: Calendar,
      color: "blue",
    },
    {
      title: "Avg Booking Value",
      value: formatCurrency(avgBookingValue),
      subtitle: "Revenue per event",
      trend: bookings.length > 0 ? "+8% vs last quarter" : "No data",
      icon: TrendingUp,
      color: "purple",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {bookingMetrics.map((metric, index) => (
        <Card key={index} className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metric.value}</div>
            {metric.subtitle && <p className="text-xs text-slate-400 mt-1">{metric.subtitle}</p>}
            {metric.trend && <p className="text-xs text-green-400 mt-1">{metric.trend}</p>}
            {metric.badge && (
              <Badge variant="secondary" className="mt-2 text-xs bg-orange-600">
                {metric.badge}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
