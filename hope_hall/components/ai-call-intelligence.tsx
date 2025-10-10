"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, TrendingDown, MessageSquare, AlertTriangle, 
  CheckCircle, Clock, PhoneCall, Users, Target
} from "lucide-react"
import { useCallAnalytics } from "@/hooks/use-call-analytics"

export function AICallIntelligence() {
  const { summary, loading, error } = useCallAnalytics()

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">AI Call Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">AI Call Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>Error loading analytics: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">AI Call Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No call analytics available for AI analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          AI Call Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 mb-2">
              <PhoneCall className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-400">Total Calls</span>
            </div>
            <div className="text-2xl font-bold text-white">{summary.totalCalls}</div>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Avg Sentiment</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.averageSentiment.toFixed(1)}/10
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={summary.averageSentiment * 10} className="flex-1 h-2" />
            </div>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400">Avg Priority</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary.averagePriorityScore.toFixed(0)}/100
            </div>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-slate-400">Follow-ups</span>
            </div>
            <div className="text-2xl font-bold text-white">{summary.followUpRequiredCount}</div>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Sentiment Breakdown</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">Positive</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{summary.positiveSentimentCount}</span>
                  <span className="text-xs text-slate-400">
                    ({summary.totalCalls > 0 ? Math.round((summary.positiveSentimentCount / summary.totalCalls) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">Neutral</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{summary.neutralSentimentCount}</span>
                  <span className="text-xs text-slate-400">
                    ({summary.totalCalls > 0 ? Math.round((summary.neutralSentimentCount / summary.totalCalls) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-slate-300">Negative</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{summary.negativeSentimentCount}</span>
                  <span className="text-xs text-slate-400">
                    ({summary.totalCalls > 0 ? Math.round((summary.negativeSentimentCount / summary.totalCalls) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Objections */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Top Objections</h4>
            <div className="space-y-2">
              {summary.topObjections.length > 0 ? (
                summary.topObjections.map((objection, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate">{objection.objection}</span>
                    <Badge variant="secondary" className="text-xs">
                      {objection.count}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No objections recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Caller Intent & Urgency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Caller Intent</h4>
            <div className="space-y-2">
              {summary.callerIntentBreakdown.length > 0 ? (
                summary.callerIntentBreakdown.map((intent, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate">{intent.intent}</span>
                    <Badge variant="outline" className="text-xs">
                      {intent.count}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No intent data available</p>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-4">Urgency Indicators</h4>
            <div className="space-y-2">
              {summary.urgencyLevels.length > 0 ? (
                summary.urgencyLevels.map((urgency, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate">{urgency.level}</span>
                    <Badge variant="outline" className="text-xs">
                      {urgency.count}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No urgency data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Items */}
        {(summary.followUpRequiredCount > 0 || summary.emailMissingCount > 0) && (
          <div className="p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
            <h4 className="text-sm font-medium text-orange-300 mb-3">Action Items</h4>
            <div className="space-y-2">
              {summary.followUpRequiredCount > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-200">
                    {summary.followUpRequiredCount} high-priority leads need follow-up
                  </span>
                </div>
              )}
              {summary.emailMissingCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-200">
                    {summary.emailMissingCount} leads missing contact information
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
