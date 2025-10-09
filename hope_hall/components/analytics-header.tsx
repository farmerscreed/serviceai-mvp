"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useAnalytics } from "@/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"

const dateRanges = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
] as const;

type DateRangeValue = typeof dateRanges[number]['value'];

const formatPercentage = (value: number) => {
  if (isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
};

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "$0.00";
  return `$${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value: number) => {
  if (isNaN(value)) return "0";
  return Math.round(value).toString();
};

export function AnalyticsHeader() {
  const { analytics: data, loading, error } = useAnalytics();
  const [compareMode, setCompareMode] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>('month');

  const getTrendIcon = (change: number) => {
    if (isNaN(change)) return <Minus className="h-4 w-4 text-slate-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getTrendColor = (change: number) => {
    if (isNaN(change)) return "text-slate-400";
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-slate-400";
  };

  const metrics = data ? [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      change: `+${formatCurrency(data.totalRevenue * 0.12)}`, // Mock change
      changeRaw: data.totalRevenue * 0.12,
    },
    {
      title: "Lead Conversion Rate",
      value: formatPercentage(data.conversionRate),
      change: `+${formatPercentage(2.5)}`, // Mock change
      changeRaw: 2.5,
    },
    {
      title: "Average Lead Score",
      value: formatNumber(data.averageLeadScore),
      change: `+${formatNumber(5)}`, // Mock change
      changeRaw: 5,
    },
    {
      title: "Tour Show Rate",
      value: formatPercentage(85), // Mock data
      change: `+${formatPercentage(3)}`, // Mock change
      changeRaw: 3,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date Range
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              className={`border-slate-700 ${compareMode ? "bg-yellow-600 text-white" : "bg-white text-slate-900 hover:bg-slate-100"}`}
            >
              {compareMode ? "Comparing" : "Compare Period"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {dateRanges.map((range) => (
              <Button
                key={range.value}
                variant={dateRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range.value as DateRangeValue)}
                className={
                  dateRange === range.value
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-800"
                }
              >
                {range.label}
              </Button>
            ))}
          </div>
          {compareMode && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Recent Activity</span>
                <span className="font-semibold text-green-400">+12% this month</span>
              </div>
              <div className="text-sm text-slate-300 mt-2">
                <Badge variant="secondary" className="mr-2 mb-2">
                  New Hot Lead: Weddings by Sarah
                </Badge>
                <Badge variant="secondary" className="mr-2 mb-2">
                  Tour Completed: Corporate Innovations Inc.
                </Badge>
                <Badge variant="secondary" className="mr-2 mb-2">
                  Booking Confirmed: Annual Gala
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
        {!loading && error && <p className="text-red-500 col-span-4">Error loading analytics data.</p>}
        {!loading && !error && metrics.map((metric, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{metric.title}</CardTitle>
              {getTrendIcon(metric.changeRaw)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm font-medium ${getTrendColor(metric.changeRaw)}`}>{metric.change}</span>
                <span className="text-xs text-slate-400">vs previous period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
