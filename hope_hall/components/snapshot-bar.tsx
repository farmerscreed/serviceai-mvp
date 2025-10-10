"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Clock, Calendar, TrendingUp } from "lucide-react"
import { useMetrics } from "@/hooks/use-metrics"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export function SnapshotBar() {
  const { metrics, loading } = useMetrics()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate additional metrics from the existing data
  const totalRevenue = metrics.totalRevenueYTD // Use YTD revenue from the hook
  const pendingDeposits = metrics.pendingDeposits // Use pending deposits from the hook
  const upcomingEvents = metrics.upcomingEvents // Use upcoming events from the hook
  const avgBookingValue = metrics.avgBookingValue // Use average booking value from the hook

  const items = [
    {
      title: "Total Revenue (YTD)",
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: `${metrics.totalLeads} confirmed events`,
      href: "/dashboard/analytics",
      icon: DollarSign,
      trend: "+12% vs last quarter"
    },
    {
      title: "Pending Deposits",
      value: `$${pendingDeposits.toLocaleString()}`,
      subtitle: pendingDeposits > 0 ? "Deposits pending" : "All deposits received",
      href: "/dashboard/bookings",
      icon: Clock,
      trend: null
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.toString(),
      subtitle: "Next 90 days",
      href: "/dashboard/tours",
      icon: Calendar,
      trend: "Events scheduled"
    },
    {
      title: "Avg Booking Value",
      value: `$${avgBookingValue.toFixed(2)}`,
      subtitle: "Revenue per event",
      href: "/dashboard/analytics",
      icon: TrendingUp,
      trend: "+8% vs last quarter"
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <Link key={idx} href={item.href} className="no-underline">
          <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <p className="text-xs text-slate-400 mt-1">{item.subtitle}</p>
              {item.trend && (
                <p className="text-xs text-green-500 mt-1">{item.trend}</p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
} 
