"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  MessageSquare, AlertTriangle, CheckCircle, Clock, 
  TrendingUp, TrendingDown, Target, Users
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useOrganizationId } from "@/hooks/use-organization-id" // Use the hook instead

interface LeadAnalyticsDetailProps {
  leadId: string
}

interface CallAnalytics {
  id: string
  call_id: string
  sentiment_score: number | null
  intent_classification: string | null
  objections_identified: string[] | null
  competitive_mentions: string[] | null
  urgency_indicators: string[] | null
  priority_score: number | null
  ai_insights: string[] | null
  analyzed_at: string
}

export function LeadAnalyticsDetail({ leadId }: LeadAnalyticsDetailProps) {
  const [analytics, setAnalytics] = useState<CallAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { organizationId, loading: authLoading } = useOrganizationId() // Use the hook

  useEffect(() => {
    const fetchLeadAnalytics = async () => {
      if (!leadId || !organizationId || authLoading) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('call_analytics')
          .select('*')
          .eq('lead_id', leadId)
          .eq('organization_id', organizationId)
          .order('analyzed_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setAnalytics(data || [])
      } catch (err) {
        console.error('Lead analytics fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
        setAnalytics([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeadAnalytics()
  }, [leadId, organizationId, authLoading])

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Call Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-800 animate-pulse rounded" />
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
          <CardTitle className="text-white">Call Analytics</CardTitle>
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

  if (analytics.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Call Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No call analytics available for this lead</p>
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
          Call Analytics ({analytics.length} calls)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {analytics.map((analysis, index) => (
          <div key={analysis.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-slate-300">
                Call {index + 1} - {new Date(analysis.analyzed_at).toLocaleDateString()}
              </h4>
              <div className="flex items-center space-x-2">
                {analysis.sentiment_score && (
                  <Badge 
                    variant={analysis.sentiment_score >= 7 ? "default" : analysis.sentiment_score >= 4 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    Sentiment: {analysis.sentiment_score}/10
                  </Badge>
                )}
                {analysis.priority_score && (
                  <Badge variant="outline" className="text-xs">
                    Priority: {analysis.priority_score}/100
                  </Badge>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {analysis.sentiment_score && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {analysis.sentiment_score >= 7 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : analysis.sentiment_score >= 4 ? (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-xs text-slate-400">Sentiment</span>
                  </div>
                  <div className="text-lg font-bold text-white">{analysis.sentiment_score}/10</div>
                  <Progress value={analysis.sentiment_score * 10} className="mt-1 h-1" />
                </div>
              )}

              {analysis.intent_classification && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-400">Intent</span>
                  </div>
                  <div className="text-sm font-medium text-white capitalize">
                    {analysis.intent_classification}
                  </div>
                </div>
              )}

              {analysis.priority_score && (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-slate-400">Priority</span>
                  </div>
                  <div className="text-lg font-bold text-white">{analysis.priority_score}/100</div>
                  <Progress value={analysis.priority_score} className="mt-1 h-1" />
                </div>
              )}
            </div>

            {/* AI Insights */}
            {analysis.ai_insights && analysis.ai_insights.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-300 mb-2">AI Insights</h5>
                <div className="space-y-2">
                  {analysis.ai_insights.map((insight, insightIndex) => (
                    <div key={insightIndex} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objections */}
            {analysis.objections_identified && analysis.objections_identified.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-300 mb-2">Objections Identified</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.objections_identified.map((objection, objectionIndex) => (
                    <Badge key={objectionIndex} variant="destructive" className="text-xs">
                      {objection}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Mentions */}
            {analysis.competitive_mentions && analysis.competitive_mentions.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-300 mb-2">Competitors Mentioned</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.competitive_mentions.map((competitor, competitorIndex) => (
                    <Badge key={competitorIndex} variant="outline" className="text-xs">
                      {competitor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Urgency Indicators */}
            {analysis.urgency_indicators && analysis.urgency_indicators.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-300 mb-2">Urgency Indicators</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.urgency_indicators.map((indicator, indicatorIndex) => (
                    <Badge key={indicatorIndex} variant="secondary" className="text-xs">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}


          </div>
        ))}
      </CardContent>
    </Card>
  )
} 