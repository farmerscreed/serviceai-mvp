"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useState, useEffect } from 'react'
import { supabase, getOrganizationId } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface LeadSourceData {
  name: string
  value: number
  color: string
}

interface RevenueData {
  month: string
  revenue: number
}

export function ChartsSection() {
  const [leadSourceData, setLeadSourceData] = useState<LeadSourceData[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const organizationId = getOrganizationId()

  useEffect(() => {
    const fetchChartData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch lead sources from database (last 90 days to show more data)
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('lead_source, created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days

        if (leadsError) throw leadsError

        // Process lead sources data
        const sourceCount: { [key: string]: number } = {}
        leads?.forEach(lead => {
          const source = lead.lead_source || 'Unknown'
          sourceCount[source] = (sourceCount[source] || 0) + 1
        })

        const colors = ['#D4AF37', '#1E3A8A', '#7C3AED', '#059669', '#DC2626', '#F59E0B']
        const processedLeadSources: LeadSourceData[] = Object.entries(sourceCount).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }))

        setLeadSourceData(processedLeadSources)

        // Fetch revenue data from bookings (last 6 months for better trend visibility)
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('commission_amount, created_at, event_status')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months

        if (bookingsError) throw bookingsError

        // Process revenue data by month
        const monthlyRevenue: { [key: string]: number } = {}
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        bookings?.forEach(booking => {
          if (booking.event_status === 'Confirmed' || booking.event_status === 'Paid') {
            const date = new Date(booking.created_at)
            const monthKey = months[date.getMonth()]
            const revenue = booking.commission_amount || 0
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + revenue
          }
        })

        // Get last 6 months
        const currentDate = new Date()
        const revenueDataArray: RevenueData[] = []
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
          const monthKey = months[date.getMonth()]
          revenueDataArray.push({
            month: monthKey,
            revenue: monthlyRevenue[monthKey] || 0
          })
        }

        setRevenueData(revenueDataArray)

      } catch (err) {
        console.error('Error fetching chart data:', err)
        setError('Failed to load chart data')
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [user, organizationId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Lead Sources (Last 90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Lead Sources (Last 90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lead Sources Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Lead Sources (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {leadSourceData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-slate-400">No lead data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 || revenueData.every(d => d.revenue === 0) ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-slate-400">No revenue data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: "#D4AF37", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
