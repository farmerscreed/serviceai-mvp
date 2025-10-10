"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Phone, User, Calendar, CreditCard, Clock, MessageSquare, 
  TrendingUp, MapPin, ExternalLink, Play, Headphones 
} from "lucide-react"
import { useCallLogs } from "@/hooks/use-call-logs"
import { useTours } from "@/hooks/use-tours"
import { useBookings } from "@/hooks/use-bookings"
import { formatDistanceToNow, format } from "date-fns"
import { supabase, getOrganizationId } from "@/lib/supabase"

interface LeadCallJourneyProps {
  leadId: string
  leadPhone?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadCallJourney({ leadId, leadPhone, open, onOpenChange }: LeadCallJourneyProps) {
  const [callLog, setCallLog] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const organizationId = getOrganizationId()

  useEffect(() => {
    if (!open || !leadId) return

    const fetchJourneyData = async () => {
      setLoading(true)
      try {
        // Get the organization ID
        const orgId = await organizationId
        
        // Fetch call log for this lead using API route
        if (leadPhone) {
          try {
            const params = new URLSearchParams({
              organization_id: orgId,
              caller_phone: leadPhone,
              limit: '1'
            })
            
            const response = await fetch(`/api/call-logs?${params.toString()}`)
            if (response.ok) {
              const result = await response.json()
              // Get the first (most recent) call log for this phone number
              setCallLog(result.data?.[0] || null)
            } else {
              console.warn('Failed to fetch call logs:', response.status)
              setCallLog(null)
            }
          } catch (error) {
            console.error('Error fetching call log:', error)
            setCallLog(null)
          }
        }

        // Fetch tours for this lead
        const { data: toursData } = await supabase
          .from('tours')
          .select('*')
          .eq('organization_id', orgId)
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
        
        setTours(toursData || [])

        // Fetch bookings for this lead
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('organization_id', orgId)
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
        
        setBookings(bookingsData || [])

      } catch (error) {
        console.error('Error fetching journey data:', error)
        // Don't throw the error to prevent app crashes
      } finally {
        setLoading(false)
      }
    }

    fetchJourneyData()
  }, [open, leadId, leadPhone, organizationId])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return "text-green-400"
    if (score >= 0.4) return "text-yellow-400"
    return "text-red-400"
  }

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return "Positive"
    if (score >= 0.4) return "Neutral"
    return "Negative"
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return "bg-green-600"
      case 'scheduled':
      case 'pending':
        return "bg-yellow-600"
      case 'cancelled':
      case 'failed':
        return "bg-red-600"
      default:
        return "bg-slate-600"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Lead Journey Timeline</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-24 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-24 bg-slate-800 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Call Details */}
            {callLog && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span>Initial Phone Call</span>
                    <Badge variant="outline" className="ml-auto">
                      {format(new Date(callLog.created_at), 'MMM d, yyyy h:mm a')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        Duration: {formatDuration(callLog.call_duration || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span className={`text-sm ${getSentimentColor(callLog.sentiment_score || 0)}`}>
                        Sentiment: {getSentimentLabel(callLog.sentiment_score || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        Language: {callLog.language_detected || 'English'}
                      </span>
                    </div>
                  </div>

                  {callLog.function_calls && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">AI Actions Taken:</h4>
                      <div className="flex flex-wrap gap-2">
                        {callLog.function_calls.split(', ').map((func: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {func.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(callLog.ai_summary || callLog.transcription) && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">
                        {callLog.ai_summary ? 'AI Call Summary:' : 'Call Transcription:'}
                      </h4>
                      <div className="bg-slate-900 p-3 rounded border border-slate-700">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {(() => {
                            const content = callLog.ai_summary || callLog.transcription || '';
                            return content.length > 300 
                              ? `${content.substring(0, 300)}...`
                              : content;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show full transcription only if we showed AI summary above */}
                  {callLog.ai_summary && callLog.transcription && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Full Call Transcription:</h4>
                      <div className="bg-slate-900 p-3 rounded border border-slate-700">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {callLog.transcription.length > 300 
                            ? `${callLog.transcription.substring(0, 300)}...`
                            : callLog.transcription
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {callLog.call_recording && (
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-700">
                      <div className="flex items-center space-x-2">
                        <Headphones className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">Call recording available</span>
                      </div>
                      <Button variant="outline" size="sm" className="border-slate-600">
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lead Creation */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Lead Created</h3>
                <p className="text-sm text-slate-400">
                  {callLog ? 'Automatically generated from phone call' : 'Lead entered into system'}
                </p>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Tours */}
            {tours.length > 0 && (
              <>
                <div>
                  <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Venue Tours ({tours.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {tours.map((tour) => (
                      <Card key={tour.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(tour.tour_status)}>
                                {tour.tour_status}
                              </Badge>
                              <span className="text-sm text-slate-300">
                                {format(new Date(tour.tour_date + 'T00:00:00'), 'MMM d, yyyy')} at {tour.tour_time}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(tour.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {tour.tour_notes && (
                            <p className="text-sm text-slate-400">{tour.tour_notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator className="bg-slate-700" />
              </>
            )}

            {/* Bookings */}
            {bookings.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Bookings ({bookings.length})</span>
                </h3>
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="bg-slate-800 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(booking.booking_status)}>
                              {booking.booking_status}
                            </Badge>
                            <span className="text-sm text-slate-300">
                              {format(new Date(booking.event_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-400">
                              ${booking.total_amount?.toLocaleString() || 'TBD'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {booking.guest_count} guests
                            </div>
                          </div>
                        </div>
                        {booking.special_requests && (
                          <p className="text-sm text-slate-400">{booking.special_requests}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Journey Summary */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Journey Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {callLog ? '1' : '0'}
                    </div>
                    <div className="text-sm text-slate-400">Phone Calls</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {tours.length}
                    </div>
                    <div className="text-sm text-slate-400">Tours Scheduled</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {bookings.length}
                    </div>
                    <div className="text-sm text-slate-400">Bookings Made</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 
