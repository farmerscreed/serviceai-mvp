"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Globe, Calendar, Target } from "lucide-react"
import { usePerformanceData } from "@/hooks/use-performance-data"
import { Skeleton } from "@/components/ui/skeleton"

export function PerformanceGrid() {
  const { data, loading, error } = usePerformanceData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
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
            <p className="text-red-400">Error loading performance data: {error.message}</p>
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
            <p className="text-slate-400">No performance data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Lead Source Performance */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Lead Source Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-300">Source</TableHead>
                <TableHead className="text-slate-300">Leads</TableHead>
                <TableHead className="text-slate-300">Conv %</TableHead>
                <TableHead className="text-slate-300">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.leadSourcePerformance.map((source) => (
                <TableRow key={source.source} className="border-slate-800">
                  <TableCell className="text-white font-medium">{source.source}</TableCell>
                  <TableCell className="text-slate-300">{source.leads}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={source.conversion} className="h-2 w-12" />
                      <span className="text-slate-300 text-sm">{source.conversion}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-green-400 font-medium">${source.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Language Performance */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Language Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.languagePerformance.map((lang) => (
            <div key={lang.language} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{lang.language === "Spanish" ? "🇪🇸" : "🇺🇸"}</span>
                  <span className="text-white font-medium">{lang.language}</span>
                </div>
                <Badge variant="secondary">{lang.leads} leads</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Conversion</div>
                  <div className="text-white font-medium">{lang.conversion}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Avg Score</div>
                  <div className="text-white font-medium">{lang.avgScore}</div>
                </div>
                <div>
                  <div className="text-slate-400">Revenue</div>
                  <div className="text-green-400 font-medium">${lang.revenue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Event Type Analysis */}
      <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Event Type Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.eventTypeAnalysis.map((event) => (
              <div key={event.type} className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{event.type}</span>
                  {event.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : event.trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Bookings</span>
                    <span className="text-white font-medium">{event.bookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Avg Value</span>
                    <span className="text-white font-medium">${event.avgValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Conversion</span>
                    <span className="text-white font-medium">{event.conversion}%</span>
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
