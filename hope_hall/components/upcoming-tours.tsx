"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Users, Phone, MapPin, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useOrganizationId } from "@/hooks/use-organization-id" // Use the hook
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export function UpcomingTours() {
  const [upcomingTours, setUpcomingTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { organizationId, loading: authLoading } = useOrganizationId() // Use the hook

  useEffect(() => {
    const fetchUpcomingTours = async () => {
      if (!organizationId || authLoading) return
      
      try {
        setLoading(true)

        // Fetch tours for the current week
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
        
        const { data: toursData } = await supabase
          .from('tours')
          .select(`
            *,
            leads (
              lead_name,
              event_type,
              guest_count,
              phone,
              language,
              lead_score
            )
          `)
          .eq('organization_id', organizationId)
          .gte('tour_date', weekStart.toISOString().split('T')[0])
          .lte('tour_date', weekEnd.toISOString().split('T')[0])
          .order('tour_date', { ascending: true })
          .order('tour_time', { ascending: true })

        if (toursData) {
          setUpcomingTours(toursData)
        }
      } catch (error) {
        console.error('Error fetching upcoming tours:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingTours()
  }, [organizationId, authLoading])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-600"
      case "scheduled":
        return "bg-blue-600"
      case "completed":
        return "bg-gray-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getLanguageFlag = (language: string) => {
    return language === "Spanish" ? "🇪🇸" : "🇺🇸"
  }

  const getDateLabel = (date: string) => {
    const tourDate = new Date(date + 'T00:00:00')
    if (isToday(tourDate)) return "Today"
    if (isTomorrow(tourDate)) return "Tomorrow"
    return format(tourDate, 'MMM d')
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Tours This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 bg-slate-800 rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Upcoming Tours This Week</CardTitle>
          <Link href="/dashboard/tours">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingTours.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tours scheduled this week</p>
            <p className="text-sm text-slate-600 mt-1">Tours will appear here when scheduled</p>
            <Link href="/dashboard/tours">
              <Button className="mt-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800">
                Schedule Tour
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingTours.map((tour) => (
              <div key={tour.id} className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback className="text-sm">
                        {(tour.client_name || tour.leads?.lead_name || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white truncate">
                          {tour.client_name || tour.leads?.lead_name || "Unknown Client"}
                        </span>
                        <span className="text-lg">{getLanguageFlag(tour.language || "English")}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {tour.event_type || "Unknown Event"}
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(tour.tour_status)}`}>
                    {tour.tour_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{getDateLabel(tour.tour_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{tour.tour_time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>{tour.guest_count || tour.leads?.guest_count || "N/A"} guests</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="truncate">
                      {tour.phone || tour.leads?.phone || "No phone"}
                    </span>
                  </div>
                </div>

                {tour.tour_notes && (
                  <div className="mt-3 p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-300">{tour.tour_notes}</p>
                  </div>
                )}
              </div>
            ))}
            
            {upcomingTours.length > 0 && (
              <div className="text-center pt-4 border-t border-slate-700">
                <Link href="/dashboard/tours">
                  <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800">
                    View All Tours
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
