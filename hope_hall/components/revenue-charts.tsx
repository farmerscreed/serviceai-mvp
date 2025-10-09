"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

const monthlyRevenueData = [
  { month: "Jan", revenue: 18750, target: 20000 },
  { month: "Feb", revenue: 22300, target: 20000 },
  { month: "Mar", revenue: 19800, target: 20000 },
  { month: "Apr", revenue: 25600, target: 22000 },
  { month: "May", revenue: 21400, target: 22000 },
  { month: "Jun", revenue: 28900, target: 25000 },
]

const eventTypeRevenue = [
  { name: "Weddings", value: 78500, color: "#D4AF37" },
  { name: "Corporate", value: 32400, color: "#1E3A8A" },
  { name: "Quinceañeras", value: 18600, color: "#7C3AED" },
  { name: "Other Events", value: 12250, color: "#059669" },
]

const projectionData = [
  { month: "Jul", actual: 28900, projected: 30000 },
  { month: "Aug", actual: null, projected: 32000 },
  { month: "Sep", actual: null, projected: 28000 },
  { month: "Oct", actual: null, projected: 35000 },
  { month: "Nov", actual: null, projected: 38000 },
  { month: "Dec", actual: null, projected: 42000 },
]

export function RevenueCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Revenue vs Target */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Monthly Revenue vs Target</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenueData}>
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
              <Bar dataKey="revenue" fill="#D4AF37" name="Revenue" />
              <Bar dataKey="target" fill="#374151" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Event Type */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Revenue by Event Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeRevenue}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F9FAFB",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Projection */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Revenue Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
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
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#7C3AED"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }}
                name="Projected"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
