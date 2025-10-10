"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageSquare, AlertTriangle, Clock, CheckCircle } from "lucide-react"

interface AIInsightsBadgeProps {
  lead: any
  className?: string
}

export function AIInsightsBadge({ lead, className = "" }: AIInsightsBadgeProps) {
  // Helper function to get sentiment badge
  const getSentimentBadge = () => {
    if (!lead.sentiment_score) return null
    
    const score = lead.sentiment_score
    if (score >= 7) {
      return (
        <Badge variant="outline" className="bg-green-500/10 border-green-500 text-green-400 text-xs">
          Positive
        </Badge>
      )
    } else if (score >= 4) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500 text-yellow-400 text-xs">
          Neutral
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-red-500/10 border-red-500 text-red-400 text-xs">
          Negative
        </Badge>
      )
    }
  }

  // Helper function to get urgency badge
  const getUrgencyBadge = () => {
    if (!lead.urgency_level) return null
    
    if (lead.urgency_level === 'high') {
      return (
        <Badge variant="outline" className="bg-orange-500/10 border-orange-500 text-orange-400 text-xs">
          High Urgency
        </Badge>
      )
    }
    return null
  }

  // Helper function to get priority flag badge
  const getPriorityBadge = () => {
    if (!lead.priority_flag) return null
    
    return (
      <Badge variant="outline" className="bg-red-500/10 border-red-500 text-red-400 text-xs">
        {lead.priority_flag === 'email_missing' ? 'Missing Email' : lead.priority_flag}
      </Badge>
    )
  }

  // Helper function to get follow-up required badge
  const getFollowUpBadge = () => {
    if (!lead.follow_up_required) return null
    
    return (
      <Badge variant="outline" className="bg-blue-500/10 border-blue-500 text-blue-400 text-xs">
        Follow-up
      </Badge>
    )
  }

  // Get AI summary for tooltip
  const getAISummary = () => {
    return lead.ai_summary || "No AI analysis available"
  }

  const badges = [
    getSentimentBadge(),
    getUrgencyBadge(),
    getPriorityBadge(),
    getFollowUpBadge()
  ].filter(Boolean)

  if (badges.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex flex-wrap gap-1 ${className}`}>
            {badges.map((badge, index) => (
              <div key={index}>
                {badge}
              </div>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <div className="font-medium">AI Analysis</div>
            <div className="text-sm">{getAISummary()}</div>
            {lead.sentiment_score && (
              <div className="text-xs text-gray-400">
                Sentiment: {lead.sentiment_score}/10
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 
