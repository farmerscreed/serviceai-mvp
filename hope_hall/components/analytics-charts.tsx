"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts"
import { useAnalyticsCharts } from "@/hooks/use-analytics-charts"
import { Skeleton } from "@/components/ui/skeleton"

export function AnalyticsCharts() {
  const { data, loading, error } = useAnalyticsCharts();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <p className="text-red-400">Error loading charts data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <p className="text-slate-400">No charts data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Seasonal Trends */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Seasonal Booking Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.seasonalTrends}>
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
              />
              <Area type="monotone" dataKey="weddings" stackId="1" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.6} />
              <Area type="monotone" dataKey="corporate" stackId="1" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.6} />
              <Area
                type="monotone"
                dataKey="quinceaneras"
                stackId="1"
                stroke="#7C3AED"
                fill="#7C3AED"
                fillOpacity={0.6}
              />
              <Area type="monotone" dataKey="other" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.teamPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F9FAFB",
                }}
              />
              <Bar dataKey="leads" fill="#D4AF37" name="Leads" />
              <Bar dataKey="bookings" fill="#1E3A8A" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Competitor Analysis */}
      <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Market Positioning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.competitorAnalysis.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{item.metric}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Hope Hall</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {item.metric === "Average Pricing"
                        ? `$${item.hopehall}`
                        : item.metric === "Lead Response Time"
                          ? `${item.hopehall}min`
                          : `${item.hopehall}%`}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Competitor A</div>
                    <div className="text-lg font-bold text-slate-300">
                      {item.metric === "Average Pricing"
                        ? `$${item.competitor1}`
                        : item.metric === "Lead Response Time"
                          ? `${item.competitor1}min`
                          : `${item.competitor1}%`}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">Competitor B</div>
                    <div className="text-lg font-bold text-slate-300">
                      {item.metric === "Average Pricing"
                        ? `$${item.competitor2}`
                        : item.metric === "Lead Response Time"
                          ? `${item.competitor2}min`
                          : `${item.competitor2}%`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
