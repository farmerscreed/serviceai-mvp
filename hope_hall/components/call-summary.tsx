"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  Phone, Clock, MessageSquare, User, Calendar, 
  Search, ThumbsUp, ThumbsDown, Zap, Copy, ExternalLink, MapPin
} from "lucide-react"
import { CallLog } from "@/hooks/use-call-logs"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "sonner"

interface CallSummaryProps {
  callLog: CallLog
  allCallLogs?: CallLog[] // Optional: all calls for this lead
  open: boolean
  onClose: () => void
}

export function CallSummary({ callLog, allCallLogs, open, onClose }: CallSummaryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCallIndex, setSelectedCallIndex] = useState(0)
  
  // Early return if no callLog is provided
  if (!callLog) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-slate-400">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No call data available</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  // Use all calls if provided, otherwise just the single call
  const callsToShow = allCallLogs || [callLog]
  const currentCall = callsToShow[selectedCallIndex] || callLog
  
  // Additional safety check for currentCall
  if (!currentCall) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-slate-400">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Call data is not available</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSentimentColor = (score?: number) => {
    if (!score) return "bg-gray-500"
    if (score > 0.6) return "bg-green-500"
    if (score > 0.3) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getSentimentLabel = (score?: number) => {
    if (!score) return "Unknown"
    if (score > 0.6) return "Positive"
    if (score > 0.3) return "Neutral"
    return "Negative"
  }

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-400 bg-opacity-30 px-1 rounded">
          {part}
        </span>
      ) : part
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const functionCallsList = currentCall.function_calls 
    ? currentCall.function_calls.split(', ').filter(Boolean)
    : []

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="bg-slate-900 border-slate-800 text-white w-full h-full sm:h-auto sm:max-w-4xl max-h-screen sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Call Details - {currentCall.caller_phone || 'Unknown Number'}</span>
              {callsToShow.length > 1 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCallIndex + 1} of {callsToShow.length}
                </Badge>
              )}
            </div>
            {callsToShow.length > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCallIndex(Math.max(0, selectedCallIndex - 1))}
                  disabled={selectedCallIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCallIndex(Math.min(callsToShow.length - 1, selectedCallIndex + 1))}
                  disabled={selectedCallIndex === callsToShow.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
      {/* Call Info */}
      <div className="text-sm text-slate-400 mb-4">
        {format(new Date(currentCall.created_at), 'PPP p')} • {formatDistanceToNow(new Date(currentCall.created_at))} ago
      </div>

      {/* Call Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Duration</p>
                <p className="font-semibold text-white">
                  {formatDuration(currentCall.call_duration || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-sm text-slate-400">Language</p>
                <p className="font-semibold text-white">
                  {currentCall.language_detected || 'English'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getSentimentColor(currentCall.sentiment_score)}`} />
              <div>
                <p className="text-sm text-slate-400">Sentiment</p>
                <p className="font-semibold text-white">
                  {getSentimentLabel(currentCall.sentiment_score)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Lead Quality</p>
                <p className="font-semibold text-white">
                  {currentCall.lead_id ? 'High' : 'Low'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Call Summary */}
      {(currentCall.ai_summary || currentCall.transcription) && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>AI Call Summary</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentCall.ai_summary || currentCall.transcription || '')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {currentCall.ai_summary || currentCall.transcription || 'No summary available'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Function Calls */}
      {functionCallsList.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>AI Functions Executed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {functionCallsList.map((func, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-600 text-white">
                  {func}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tour Schedule */}
      {currentCall.tour_scheduled && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Tour Scheduled</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Tour was scheduled during this call</p>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      {currentCall.transcription && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Call Transcription</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentCall.transcription || '')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search transcription..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Transcription Text */}
            <ScrollArea className="h-64 w-full rounded border border-slate-600 bg-slate-900 p-4">
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {highlightText(currentCall.transcription || '', searchTerm)}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Lead Connection */}
      {currentCall.lead_id && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Generated Lead</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300">Lead created from this call</p>
                <p className="text-sm text-slate-400">Lead ID: {currentCall.lead_id}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-600"
                onClick={() => {
                  window.open(`/dashboard/leads?leadId=${currentCall.lead_id}`, '_blank')
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Lead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call Recording */}
      {false && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Call Recording</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-slate-300">Audio recording available</p>
              <Button variant="outline" size="sm" className="border-slate-600">
                <ExternalLink className="w-4 h-4 mr-2" />
                Play Recording
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
