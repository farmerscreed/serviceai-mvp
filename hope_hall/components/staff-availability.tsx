"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Trash2, Save, CheckCircle, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useOrganizationId } from "@/hooks/use-organization-id"
import { useOrganization } from "@/hooks/use-organization"
import { supabase } from "@/lib/supabase"

interface TimeSlot {
  time: string
  available: boolean
}

interface DayAvailability {
  date: string
  enabled: boolean
  timeSlots: TimeSlot[]
}

interface WeeklySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  enabled: boolean
  timeSlots: string[] // Array of time strings like ["20:30", "20:00", "20:15"]
}

interface StaffAvailabilityProps {
  onUpdate?: () => void
}

export function StaffAvailability({ onUpdate }: StaffAvailabilityProps) {
  const { organizationId, loading: authLoading } = useOrganizationId()
  const { organization, loading: orgDataLoading, updateSettings } = useOrganization()
  
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([])
  const [activeMode, setActiveMode] = useState<'specific' | 'weekly'>('weekly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<WeeklySchedule['day']>('monday')
  const [newWeeklyTime, setNewWeeklyTime] = useState("")

  // Generate 15-minute time slots from 9 AM to 9 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 21 && minute > 0) break // Stop at 9:00 PM
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({ time, available: false })
      }
    }
    return slots
  }

  // Initialize default weekly schedule
  const initializeWeeklySchedule = (): WeeklySchedule[] => {
    const days: WeeklySchedule['day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return days.map(day => ({
      day,
      enabled: false,
      timeSlots: []
    }))
  }

  // Load current availability from organization settings
  useEffect(() => {
    if (!authLoading && organizationId) {
      loadAvailability()
    }
  }, [organizationId, authLoading, organization])

  const loadAvailability = () => {
    try {
      setLoading(true)

      // Parse staff availability from settings
      let staffAvailability: DayAvailability[] = []
      if (organization?.settings?.staff_availability) {
        try {
          staffAvailability = JSON.parse(organization.settings.staff_availability)
        } catch (error) {
          console.error('Error parsing staff_availability:', error)
          staffAvailability = []
        }
      }

      // Parse tour schedule from settings
      let tourScheduleObject: { [key: string]: string[] } = {}
      if (organization?.settings?.tour_schedule) {
        try {
          // tour_schedule is already an object, no need to parse
          tourScheduleObject = organization.settings.tour_schedule
        } catch (error) {
          console.error('Error parsing tour_schedule:', error)
          tourScheduleObject = {}
        }
      }

      // Convert stored availability to component state
      const formattedAvailability: DayAvailability[] = staffAvailability.map((day: any) => ({
        date: day.date,
        enabled: day.enabled,
        timeSlots: day.timeSlots || generateTimeSlots()
      }))

      // Initialize weekly schedule with stored data or defaults
      let formattedWeeklySchedule = initializeWeeklySchedule()
      
      // Use tour_schedule as source of truth
      if (Object.keys(tourScheduleObject).length > 0) {
        formattedWeeklySchedule = formattedWeeklySchedule.map(dayItem => {
          if (tourScheduleObject[dayItem.day]) {
            return {
              ...dayItem,
              enabled: true, // If a day exists in the schedule, it's enabled
              timeSlots: tourScheduleObject[dayItem.day].sort()
            }
          }
          return dayItem
        })
      }

      setAvailability(formattedAvailability)
      setWeeklySchedule(formattedWeeklySchedule)
    } catch (error) {
      console.error('Error loading staff availability:', error)
      toast.error("Failed to load staff availability")
    } finally {
      setLoading(false)
    }
  }

  // Add a new available date
  const addAvailableDate = async () => {
    if (!newDate) {
      toast.error("Please select a date")
      return
    }

    // Check if date already exists
    if (availability.find(day => day.date === newDate)) {
      toast.error("Date already added")
      return
    }

    const newDay: DayAvailability = {
      date: newDate,
      enabled: true,
      timeSlots: generateTimeSlots()
    }

    const newAvailability = [...availability, newDay].sort((a, b) => a.date.localeCompare(b.date))
    setAvailability(newAvailability)
    setNewDate("")
    
    // Save immediately
    try {
      await updateSettings({
        staff_availability: JSON.stringify(newAvailability)
      })
      toast.success("Date added successfully")
      onUpdate?.()
    } catch (error) {
      console.error('Error adding date:', error)
      toast.error("Failed to add date")
      // Revert on error
      setAvailability(availability)
    }
  }

  // Remove a date
  const removeDate = async (dateToRemove: string) => {
    try {
      const newAvailability = availability.filter(day => day.date !== dateToRemove)
      
      // Update local state optimistically
      setAvailability(newAvailability)
      
      // Save to database
      await updateSettings({
        staff_availability: JSON.stringify(newAvailability)
      })
      
      toast.success("Date removed successfully")
      onUpdate?.()
    } catch (error) {
      console.error('Error removing date:', error)
      toast.error("Failed to remove date")
      // Revert on error - reload from settings
      loadAvailability()
    }
  }

  // Toggle time slot availability
  const toggleTimeSlot = (date: string, time: string) => {
    setAvailability(prev => prev.map(day => {
      if (day.date === date) {
        return {
          ...day,
          timeSlots: day.timeSlots.map(slot => 
            slot.time === time 
              ? { ...slot, available: !slot.available }
              : slot
          )
        }
      }
      return day
    }))
  }

  // Toggle entire day availability
  const toggleDayAvailability = (date: string) => {
    setAvailability(prev => prev.map(day => {
      if (day.date === date) {
        const newEnabled = !day.enabled
        return {
          ...day,
          enabled: newEnabled,
          timeSlots: day.timeSlots.map(slot => ({ ...slot, available: newEnabled }))
        }
      }
      return day
    }))
  }

  // Weekly schedule management functions
  const addWeeklyTimeSlot = () => {
    if (!newWeeklyTime) {
      toast.error("Please select a time")
      return
    }

    setWeeklySchedule(prev => prev.map(day => {
      if (day.day === selectedWeeklyDay) {
        // Check if time already exists
        if (day.timeSlots.includes(newWeeklyTime)) {
          toast.error("Time slot already exists for this day")
          return day
        }
        
        return {
          ...day,
          enabled: true, // Enable the day when adding a time slot
          timeSlots: [...day.timeSlots, newWeeklyTime].sort()
        }
      }
      return day
    }))
    
    setNewWeeklyTime("")
    toast.success("Time slot added successfully")
  }

  const removeWeeklyTimeSlot = async (day: WeeklySchedule['day'], timeToRemove: string) => {
    try {
      // Update local state optimistically
      const updatedSchedule = weeklySchedule.map(d => {
        if (d.day === day) {
          const newTimeSlots = d.timeSlots.filter(time => time !== timeToRemove)
          return {
            ...d,
            timeSlots: newTimeSlots,
            enabled: newTimeSlots.length > 0 // Disable day if no time slots left
          }
        }
        return d
      })
      
      setWeeklySchedule(updatedSchedule)
      
      // Convert to tour_schedule object and save
      const tourScheduleObject = updatedSchedule.reduce((acc, day) => {
        if (day.enabled && day.timeSlots.length > 0) {
          acc[day.day] = day.timeSlots
        }
        return acc
      }, {} as { [key: string]: string[] })

      await updateSettings({
        tour_schedule: tourScheduleObject
      })

      toast.success("Time slot removed successfully")
      onUpdate?.()
    } catch (error) {
      console.error('Error removing time slot:', error)
      toast.error("Failed to remove time slot")
      // Revert on error
      loadAvailability()
    }
  }

  const toggleWeeklyDay = (day: WeeklySchedule['day']) => {
    setWeeklySchedule(prev => prev.map(d => {
      if (d.day === day) {
        return { ...d, enabled: !d.enabled }
      }
      return d
    }))
  }

  // Save all changes
  const saveAvailability = async () => {
    if (!organizationId) {
      toast.error("Organization not found")
      return
    }

    setSaving(true)

    try {
      // Convert weekly schedule to tour_schedule object
      const tourScheduleObject = weeklySchedule.reduce((acc, day) => {
        if (day.enabled && day.timeSlots.length > 0) {
          acc[day.day] = day.timeSlots
        }
        return acc
      }, {} as { [key: string]: string[] })

      // Save both specific dates and weekly schedule
      await updateSettings({
        staff_availability: JSON.stringify(availability),
        tour_schedule: tourScheduleObject
      })

      toast.success("Staff availability saved successfully!")
      onUpdate?.()
    } catch (error) {
      console.error('Error saving staff availability:', error)
      toast.error("Failed to save staff availability")
    } finally {
      setSaving(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Get available slots count for a day
  const getAvailableSlots = (day: DayAvailability) => {
    return day.timeSlots.filter(slot => slot.available).length
  }

  // Format time from 24-hour to 12-hour format for display
  const formatTimeForDisplay = (timeString: string): string => {
    try {
      // Remove seconds if present (14:00:00 -> 14:00)
      const timePart = timeString.split(':').slice(0, 2).join(':')
      const [hours, minutes] = timePart.split(':').map(Number)
      
      if (hours === 0) return `12:${minutes.toString().padStart(2, '0')} AM`
      if (hours < 12) return `${hours}:${minutes.toString().padStart(2, '0')} AM`
      if (hours === 12) return `12:${minutes.toString().padStart(2, '0')} PM`
      return `${hours - 12}:${minutes.toString().padStart(2, '0')} PM`
    } catch (error) {
      console.error('Error formatting time:', error)
      return '2:00 PM' // Fallback
    }
  }

  if (authLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-slate-400">Loading staff availability...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-400">Organization not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5" />
          Staff Tour Availability
        </CardTitle>
        <CardDescription className="text-slate-400">
          Manage when staff are available to conduct venue tours. Each tour takes approximately 15 minutes. Available time slots: 9:00 AM - 9:00 PM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-slate-800 rounded-lg p-1 flex">
            <Button
              variant={activeMode === 'specific' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('specific')}
              className={activeMode === 'specific' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
            >
              Specific Dates
            </Button>
            <Button
              variant={activeMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveMode('weekly')}
              className={activeMode === 'weekly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
            >
              Weekly Schedule
            </Button>
          </div>
        </div>

        {/* Specific Dates Mode */}
        {activeMode === 'specific' && (
          <>
            {/* Add New Date */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-slate-300">Add Available Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addAvailableDate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Date
                </Button>
              </div>
            </div>

            {/* Specific Dates List */}
            <div className="space-y-4">
              {availability.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No available dates set</p>
                  <p className="text-sm">Add dates when staff can conduct tours</p>
                </div>
              ) : (
                availability.map((day) => (
                  <Card key={day.date} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-medium text-white">{formatDate(day.date)}</h3>
                            <p className="text-sm text-slate-400">
                              {getAvailableSlots(day)} available slots
                            </p>
                          </div>
                          <Badge 
                            variant={day.enabled ? "default" : "secondary"}
                            className={day.enabled ? "bg-green-600" : "bg-slate-600"}
                          >
                            {day.enabled ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleDayAvailability(day.date)}
                            className="border-slate-600 text-slate-300"
                          >
                            {day.enabled ? "Disable Day" : "Enable Day"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeDate(day.date)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Time Slots Grid */}
                      {day.enabled && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                          {day.timeSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              size="sm"
                              variant={slot.available ? "default" : "outline"}
                              onClick={() => toggleTimeSlot(day.date, slot.time)}
                              className={`h-8 text-xs ${
                                slot.available 
                                  ? "bg-green-600 hover:bg-green-700 text-white" 
                                  : "border-slate-600 text-slate-400 hover:border-slate-500"
                              }`}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* Weekly Schedule Mode */}
        {activeMode === 'weekly' && (
          <>
            {/* Add Weekly Time Slot */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-slate-300">Day of Week</Label>
                <select
                  value={selectedWeeklyDay}
                  onChange={(e) => setSelectedWeeklyDay(e.target.value as WeeklySchedule['day'])}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
              <div className="flex-1">
                <Label className="text-slate-300">Time</Label>
                <Input
                  type="time"
                  value={newWeeklyTime}
                  onChange={(e) => setNewWeeklyTime(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addWeeklyTimeSlot}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time
                </Button>
              </div>
            </div>

            {/* Weekly Schedule List */}
            <div className="space-y-4">
              {weeklySchedule.map((daySchedule) => (
                <Card key={daySchedule.day} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-white capitalize">{daySchedule.day}s</h3>
                          <p className="text-sm text-slate-400">
                            {daySchedule.timeSlots.length} time slot{daySchedule.timeSlots.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge 
                          variant={daySchedule.enabled ? "default" : "secondary"}
                          className={daySchedule.enabled ? "bg-green-600" : "bg-slate-600"}
                        >
                          {daySchedule.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleWeeklyDay(daySchedule.day)}
                          className="border-slate-600 text-slate-300"
                        >
                          {daySchedule.enabled ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>

                    {/* Time Slots Display */}
                    {daySchedule.timeSlots.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {daySchedule.timeSlots.map((time) => (
                          <div key={time} className="flex items-center gap-1 bg-slate-700 px-3 py-1 rounded-md">
                            <span className="text-white text-sm">
                              {formatTimeForDisplay(time)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeWeeklyTimeSlot(daySchedule.day, time)}
                              className="h-4 w-4 p-0 ml-2 text-slate-400 hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {daySchedule.timeSlots.length === 0 && (
                      <p className="text-slate-400 text-sm">No time slots set for this day</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 gap-2">
          <Button 
            onClick={saveAvailability}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Availability
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
