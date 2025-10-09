"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Calendar, Star, Users, Clock, Mail, MessageSquare, UserPlus, CreditCard } from "lucide-react"
import { useActivity } from "@/hooks/use-activity"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

export function ActivityFeed() {
  const { activities, loading, error } = useActivity()

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
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
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">Failed to load activity</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-400 hover:underline text-sm"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
        return UserPlus
      case 'tour_scheduled':
        return Calendar
      case 'booking_created':
        return CreditCard
      case 'phone_call':
      case 'vapi_call':
        return Phone
      case 'lead_scored':
      case 'lead_updated':
        return Star
      case 'follow_up':
        return Users
      case 'email_sent':
        return Mail
      case 'system_log':
        return MessageSquare
      default:
        return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lead_created':
        return 'green'
      case 'tour_scheduled':
        return 'blue'
      case 'booking_created':
        return 'purple'
      case 'phone_call':
      case 'vapi_call':
        return 'green'
      case 'lead_scored':
      case 'lead_updated':
        return 'yellow'
      case 'follow_up':
        return 'orange'
      case 'email_sent':
        return 'indigo'
      case 'system_log':
        return 'gray'
      default:
        return 'orange'
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No recent activity</p>
              <p className="text-slate-500 text-sm mt-2">
                Activity will appear here as you receive leads, schedule tours, and create bookings.
              </p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              const color = getActivityColor(activity.type)
              
              return (
                <div key={activity.id || index} className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      color === "green"
                        ? "bg-green-600/20 text-green-400"
                        : color === "blue"
                          ? "bg-blue-600/20 text-blue-400"
                          : color === "yellow"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : color === "purple"
                              ? "bg-purple-600/20 text-purple-400"
                              : color === "indigo"
                                ? "bg-indigo-600/20 text-indigo-400"
                                : color === "gray"
                                  ? "bg-gray-600/20 text-gray-400"
                                  : "bg-orange-600/20 text-orange-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      {activity.message}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                      {activity.metadata?.lead_source && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.metadata.lead_source}
                        </Badge>
                      )}
                      {activity.metadata?.lead_category && (
                        <Badge 
                          variant={
                            activity.metadata.lead_category === 'HOT' ? 'destructive' : 
                            activity.metadata.lead_category === 'WARM' ? 'default' : 
                            'secondary'
                          } 
                          className="text-xs"
                        >
                          {activity.metadata.lead_category}
                        </Badge>
                      )}
                      {activity.status && (
                        <Badge 
                          variant={activity.status === 'success' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
