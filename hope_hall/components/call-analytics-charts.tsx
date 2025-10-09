"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from "recharts"
import { Phone, Clock, MessageSquare, TrendingUp, Users, Zap } from "lucide-react"
import { CallLog } from "@/hooks/use-call-logs"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns"
import { useMemo } from "react"

interface CallAnalyticsChartsProps {
  callLogs: CallLog[]
}

export function CallAnalyticsCharts({ callLogs }: CallAnalyticsChartsProps) {
  
  // Process data for charts
  const chartData = useMemo(() => {
    // Daily call volume
    const dailyData = eachDayOfInterval({
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date())
    }).map(date => {
      const dayStr = format(date, 'yyyy-MM-dd')
      const calls = callLogs.filter(call => 
        format(parseISO(call.created_at), 'yyyy-MM-dd') === dayStr
      )
      
      return {
        date: format(date, 'MMM dd'),
        calls: calls.length,
        avgDuration: calls.length > 0 
          ? Math.round(calls.reduce((sum, call) => sum + (call.call_duration || 0), 0) / calls.length)
          : 0,
        leadsCreated: calls.filter(call => call.lead_id).length
      }
    })

    // Hourly distribution
    const hourlyData = Array.from({length: 24}, (_, hour) => {
      const calls = callLogs.filter(call => {
        const callHour = new Date(call.created_at).getHours()
        return callHour === hour
      })
      
      return {
        hour: hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
        calls: calls.length,
        avgDuration: calls.length > 0 
          ? Math.round(calls.reduce((sum, call) => sum + (call.call_duration || 0), 0) / calls.length)
          : 0
      }
    }).filter(data => data.calls > 0)

    // Language distribution
    const languageData = callLogs.reduce((acc, call) => {
      const lang = call.language_detected || 'English'
      acc[lang] = (acc[lang] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const languageChartData = Object.entries(languageData).map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / callLogs.length) * 100)
    }))

    // Sentiment distribution
    const sentimentData = callLogs.reduce((acc, call) => {
      let sentiment = 'Unknown'
      if (call.sentiment_score) {
        if (call.sentiment_score > 0.6) sentiment = 'Positive'
        else if (call.sentiment_score > 0.3) sentiment = 'Neutral'
        else sentiment = 'Negative'
      }
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sentimentChartData = Object.entries(sentimentData).map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage: Math.round((count / callLogs.length) * 100)
    }))

    // Function call analytics
    const functionData = callLogs.reduce((acc, call) => {
      if (call.function_calls) {
        const functions = call.function_calls.split(', ')
        functions.forEach(func => {
          acc[func] = (acc[func] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)

    const functionChartData = Object.entries(functionData)
      .map(([func, count]) => ({
        function: func.replace(/([A-Z])/g, ' $1').trim(),
        count,
        percentage: Math.round((count / callLogs.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)

    // Duration distribution
    const durationBuckets = {
      '0-30s': 0,
      '30s-1m': 0,
      '1-2m': 0,
      '2-5m': 0,
      '5m+': 0
    }

    callLogs.forEach(call => {
      const duration = call.call_duration || 0
      if (duration <= 30) durationBuckets['0-30s']++
      else if (duration <= 60) durationBuckets['30s-1m']++
      else if (duration <= 120) durationBuckets['1-2m']++
      else if (duration <= 300) durationBuckets['2-5m']++
      else durationBuckets['5m+']++
    })

    const durationChartData = Object.entries(durationBuckets).map(([range, count]) => ({
      range,
      count,
      percentage: callLogs.length > 0 ? Math.round((count / callLogs.length) * 100) : 0
    }))

    return {
      dailyData,
      hourlyData,
      languageChartData,
      sentimentChartData,
      functionChartData,
      durationChartData
    }
  }, [callLogs])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

  if (callLogs.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 col-span-full">
          <CardContent className="p-8 text-center">
            <Phone className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Call Data Available</h3>
            <p className="text-slate-400">Analytics will be displayed here once calls are received.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Call Volume */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart className="w-5 h-5" />
            <span>Daily Call Volume</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F9FAFB",
                }}
              />
              <Bar dataKey="calls" fill="#3B82F6" name="Calls" />
              <Bar dataKey="leadsCreated" fill="#10B981" name="Leads Created" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Call Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F9FAFB",
                }}
              />
              <Area type="monotone" dataKey="calls" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Language Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="60%" height={150}>
              <PieChart>
                <Pie
                  data={chartData.languageChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  dataKey="count"
                >
                  {chartData.languageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {chartData.languageChartData.map((item, index) => (
                <div key={item.language} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-300">
                    {item.language} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Call Sentiment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData.sentimentChartData.map((item, index) => (
              <div key={item.sentiment} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.sentiment === 'Positive' ? 'bg-green-500' :
                      item.sentiment === 'Neutral' ? 'bg-yellow-500' :
                      item.sentiment === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-sm text-slate-300">{item.sentiment}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.sentiment === 'Positive' ? 'bg-green-500' :
                        item.sentiment === 'Neutral' ? 'bg-yellow-500' :
                        item.sentiment === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 min-w-[40px]">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Function Usage */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>AI Functions Used</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData.functionChartData.slice(0, 5).map((item, index) => (
              <div key={item.function} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{item.function}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 min-w-[40px]">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call Duration Distribution */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Call Duration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.durationChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F9FAFB",
                }}
              />
              <Bar dataKey="count" fill="#F59E0B" name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
} 