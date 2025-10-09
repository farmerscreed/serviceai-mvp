"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Flame, Calendar, DollarSign, TrendingUp, Target, Clock, Phone, MessageSquare } from "lucide-react"
import { useMetrics } from "@/hooks/use-metrics"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export function MetricsGrid() {
  const { metrics, loading } = useMetrics()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Safety check to ensure metrics is defined
  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    )
  }

  const topMetrics = [
    {
      title: "Total Leads (30 days)",
      value: (metrics.totalLeads || 0).toString(),
      trend: `${metrics.newLeadsToday || 0} new today`,
      color: "green",
      icon: Users,
    },
    {
      title: "Hot Leads",
      value: (metrics.hotLeads || 0).toString(),
      subtitle: "Urgent follow-up needed",
      color: "red",
      badge: (metrics.hotLeads || 0) > 0 ? "ACTION REQUIRED" : undefined,
      icon: Flame,
    },
    {
      title: "Tours This Week",
      value: (metrics.toursThisWeek || 0).toString(),
      subtitle: `${metrics.toursConfirmed || 0} confirmed, ${metrics.toursPending || 0} pending`,
      color: "blue",
      icon: Calendar,
    },
    {
      title: "Monthly Revenue",
      value: `$${(metrics.monthlyRevenue || 0).toLocaleString()}`,
      subtitle: "Commission earned",
      trend: `+${metrics.revenueGrowth || 0}% vs target`,
      color: "purple",
      icon: DollarSign,
    },
  ]

  // Correct routes for each top-level metric card
  const topMetricLinks: Record<number, string> = {
    0: "/dashboard/leads",      // Total Leads (30 days)
    1: "/dashboard/leads",      // Hot Leads – same page, can filter client-side
    2: "/dashboard/tours",      // Tours This Week
    3: "/dashboard/analytics",  // Monthly Revenue / analytics overview
  }

  const performanceMetrics = [
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate || 0}%`,
      subtitle: "Tours → Bookings",
      progress: Math.min((metrics.conversionRate || 0) * 3, 100), // Scale for visual progress
      icon: TrendingUp,
    },
    {
      title: "Average Lead Score",
      value: (metrics.averageLeadScore || 0).toString(),
      subtitle: "Quality indicator",
      progress: metrics.averageLeadScore || 0,
      color: "yellow",
      icon: Target,
    },
    {
      title: "Pending Follow-ups",
      value: (metrics.pendingFollowups || 0).toString(),
      subtitle: "Due today",
      color: "orange",
      badge: (metrics.pendingFollowups || 0) > 0 ? "DUE TODAY" : undefined,
      icon: Clock,
    },
    {
      title: "Phone Calls Today",
      value: (metrics.phoneCallsToday || 0).toString(),
      subtitle: "VAPI integration active",
      color: "green",
      icon: Phone,
      status: "LIVE",
    },
  ]

  const callMetrics = [
    {
      title: "Total Calls (30 days)",
      value: (metrics.totalCallsThisMonth || 0).toString(),
      subtitle: "AI phone system",
      color: "blue",
      icon: Phone,
    },
    {
      title: "Avg Call Duration",
      value: `${metrics.averageCallDuration || 0}s`,
      subtitle: "Quality conversations",
      color: "purple",
      icon: Clock,
    },
    {
      title: "Calls with Transcripts",
      value: (metrics.callsWithTranscripts || 0).toString(),
      subtitle: `${(metrics.totalCallsThisMonth || 0) > 0 ? Math.round(((metrics.callsWithTranscripts || 0) / (metrics.totalCallsThisMonth || 1)) * 100) : 0}% success rate`,
      color: "green",
      icon: MessageSquare,
    },
    {
      title: "Call to Lead Rate",
      value: `${(metrics.totalCallsThisMonth || 0) > 0 && (metrics.totalLeads || 0) > 0 ? Math.round(((metrics.totalLeads || 0) / (metrics.totalCallsThisMonth || 1)) * 100) : 0}%`,
      subtitle: "Conversion efficiency",
      color: "yellow",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((metric, index) => (
          <Link key={index} href={topMetricLinks[index]} className="no-underline">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{metric.value}</div>
                {metric.subtitle && <p className="text-xs text-slate-400 mt-1">{metric.subtitle}</p>}
                {metric.trend && <p className="text-xs text-green-400 mt-1">{metric.trend}</p>}
                {metric.badge && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    {metric.badge}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Second Row - Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              {metric.subtitle && <p className="text-xs text-slate-400 mt-1">{metric.subtitle}</p>}
              {metric.progress && (
                <div className="mt-3">
                  <Progress value={metric.progress} className="h-2" />
                </div>
              )}
              {metric.badge && (
                <Badge variant="secondary" className="mt-2 text-xs bg-orange-600">
                  {metric.badge}
                </Badge>
              )}
              {metric.status && (
                <Badge variant="default" className="mt-2 text-xs bg-green-600">
                  {metric.status}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Third Row - Call Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {callMetrics.map((metric, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              {metric.subtitle && <p className="text-xs text-slate-400 mt-1">{metric.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
