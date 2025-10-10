"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Users, Phone, MapPin, Eye, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useOrganizationId } from "@/hooks/use-organization-id" // Use the hook
import { format, isToday, isTomorrow, addDays } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface TourSidebarProps {
  onScheduleTour?: () => void
}

export function TourSidebar({ onScheduleTour }: TourSidebarProps) {
  const [upcomingTours, setUpcomingTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { organizationId, loading: authLoading } = useOrganizationId() // Use the hook

  useEffect(() => {
    const fetchTourData = async () => {
      if (!organizationId || authLoading) return
      
      try {
        setLoading(true)

        // Fetch upcoming tours (next 7 days)
        const nextWeek = addDays(new Date(), 7)
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
          .gte('tour_date', new Date().toISOString().split('T')[0])
          .lte('tour_date', nextWeek.toISOString().split('T')[0])
          .order('tour_date', { ascending: true })
          .order('tour_time', { ascending: true })
          .limit(5)

        if (toursData) {
          setUpcomingTours(toursData)
        }
      } catch (error) {
        console.error('Error fetching tour data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTourData()
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
    const tourDate = new Date(date)
    if (isToday(tourDate)) return "Today"
    if (isTomorrow(tourDate)) return "Tomorrow"
    return format(tourDate, 'MMM d')
  }

  const handleScheduleTour = () => {
    if (onScheduleTour) {
      onScheduleTour()
    } else {
      // If no callback provided, just scroll to the schedule button in the main calendar
      const scheduleButton = document.querySelector('[data-schedule-tour-button]')
      if (scheduleButton) {
        scheduleButton.scrollIntoView({ behavior: 'smooth' })
        ;(scheduleButton as HTMLElement).click()
      }
    }
  }

  const handleViewAllTours = () => {
    // Navigate to tours page if not already there, or refresh the current page
    if (window.location.pathname !== '/dashboard/tours') {
      router.push('/dashboard/tours')
    } else {
      window.location.reload()
    }
  }

  const handleTourAnalytics = () => {
    // Navigate to analytics page
    router.push('/dashboard/analytics')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Upcoming Tours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Tours */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Upcoming Tours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingTours.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming tours</p>
              <p className="text-xs text-slate-600 mt-1">Schedule tours to see them here</p>
            </div>
          ) : (
            upcomingTours.map((tour) => (
              <div key={tour.id} className="bg-slate-800 rounded-lg p-3 space-y-2 hover:bg-slate-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg?height=24&width=24" />
                      <AvatarFallback className="text-xs">
                        {(tour.client_name || tour.leads?.lead_name || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-white truncate">
                      {tour.client_name || tour.leads?.lead_name || "Unknown Client"}
                    </span>
                  </div>
                  <span className="text-lg">{getLanguageFlag(tour.language || "English")}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {tour.event_type || "Unknown"}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(tour.tour_status)}`}>
                    {tour.tour_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getDateLabel(tour.tour_date)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{tour.tour_time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{tour.guest_count || tour.leads?.guest_count || "N/A"}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">
                      {(tour.phone || tour.leads?.phone || "N/A").slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={handleScheduleTour}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Schedule New Tour
          </Button>
          <Button 
            onClick={handleViewAllTours}
            variant="outline" 
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View All Tours
          </Button>
          <Button 
            onClick={handleTourAnalytics}
            variant="outline" 
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Tour Analytics
          </Button>
        </CardContent>
      </Card>

      {/* Tour Performance */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Tours Scheduled</span>
            <span className="text-white font-medium">{upcomingTours.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Confirmed</span>
            <span className="text-green-400 font-medium">
              {upcomingTours.filter(t => t.tour_status === 'confirmed').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Pending</span>
            <span className="text-yellow-400 font-medium">
              {upcomingTours.filter(t => t.tour_status === 'scheduled').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Show Rate</span>
            <span className="text-white font-medium">
              {upcomingTours.length > 0 ? 
                Math.round((upcomingTours.filter(t => t.tour_status === 'confirmed').length / upcomingTours.length) * 100) 
                : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
