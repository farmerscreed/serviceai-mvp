"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, DollarSign, MapPin } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings"
import { formatCurrency } from "@/lib/utils"
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns"

interface HallBookingThisWeekProps {
  organizationId: string
}

export function HallBookingThisWeek({ organizationId }: HallBookingThisWeekProps) {
  const { bookings, loading } = useBookings()

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Hall Bookings This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-slate-700 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get current week range
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday end

  // Filter bookings for this week
  const thisWeekBookings = bookings.filter(booking => {
    try {
      const eventDate = parseISO(booking.event_date)
      return isWithinInterval(eventDate, { start: weekStart, end: weekEnd })
    } catch (error) {
      console.warn('Error parsing event date:', error)
      return false
    }
  })

  // Group bookings by day
  const bookingsByDay = thisWeekBookings.reduce((acc, booking) => {
    try {
      const eventDate = parseISO(booking.event_date)
      const dayKey = format(eventDate, 'yyyy-MM-dd')
      if (!acc[dayKey]) {
        acc[dayKey] = []
      }
      acc[dayKey].push(booking)
      return acc
    } catch (error) {
      console.warn('Error processing booking:', error)
      return acc
    }
  }, {} as Record<string, typeof bookings>)

  // Get days of the week
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    weekDays.push(date)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-600'
      case 'pending':
        return 'bg-yellow-600'
      case 'cancelled':
        return 'bg-red-600'
      default:
        return 'bg-slate-600'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'pending':
        return 'Pending'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Unknown'
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Hall Bookings This Week</span>
          <Badge variant="secondary" className="ml-auto">
            {thisWeekBookings.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {thisWeekBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No bookings this week</h3>
            <p className="text-slate-400">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {weekDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayBookings = bookingsByDay[dayKey] || []
              const isToday = format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
              
              return (
                <div key={dayKey} className={`border-l-4 ${isToday ? 'border-blue-500' : 'border-slate-700'} pl-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${isToday ? 'text-blue-400' : 'text-white'}`}>
                        {format(day, 'EEE')}
                      </span>
                      <span className={`text-sm ${isToday ? 'text-blue-300' : 'text-slate-400'}`}>
                        {format(day, 'MMM d')}
                      </span>
                      {isToday && (
                        <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                          Today
                        </Badge>
                      )}
                    </div>
                    {dayBookings.length > 0 && (
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {dayBookings.length} event{dayBookings.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {dayBookings.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No events</p>
                  ) : (
                    <div className="space-y-2">
                      {dayBookings.map((booking) => (
                        <div key={booking.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-white">{booking.event_name || 'Unnamed Event'}</h4>
                                <Badge className={`text-xs ${getStatusColor(booking.event_status)}`}>
                                  {getStatusLabel(booking.event_status)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm">
                                {booking.guest_count && (
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-300">{booking.guest_count} guests</span>
                                  </div>
                                )}
                                
                                {booking.venue_fee && (
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-300">{formatCurrency(booking.venue_fee)}</span>
                                  </div>
                                )}
                              </div>
                              
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-slate-700">
          <Button 
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard/bookings';
              }
            }}
          >
            View All Bookings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
