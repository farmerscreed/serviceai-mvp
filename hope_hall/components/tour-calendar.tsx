"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Edit, 
  X, 
  Plus, 
  MapPin,
  Mail,
  Star,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Trash2
} from "lucide-react"
import { useTours } from "@/hooks/use-tours"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow, format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isTomorrow, isYesterday, addMonths, subMonths, startOfMonth, endOfMonth, addDays, subDays, isSameMonth } from "date-fns"
import { toast } from "sonner"
import { supabase, getOrganizationId } from "@/lib/supabase"
import { useOrganizationId } from "@/hooks/use-organization-id"

export function TourCalendar() {
  const { tours, loading, error, createTour, updateTour, deleteTour } = useTours()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTour, setSelectedTour] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTour, setEditingTour] = useState<any>(null)
  const [scheduleForm, setScheduleForm] = useState({
    selectedLeadId: "",
    leadName: "",
    eventType: "",
    tourDate: "",
    tourTime: "",
    notes: "",
    guestCount: "",
    phone: "",
    email: ""
  })
  const [newLeadForm, setNewLeadForm] = useState({
    leadName: "",
    eventType: "",
    guestCount: "",
    phone: "",
    email: "",
    notes: "",
    language: "English"
  })
  const [availableLeads, setAvailableLeads] = useState<any[]>([])
  const { organizationId, loading: authLoading } = useOrganizationId()

  // Check for pre-filled tour data from leads page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'schedule') {
      const tourDataString = localStorage.getItem('scheduleTourData');
      if (tourDataString) {
        try {
          const tourData = JSON.parse(tourDataString);
          setScheduleForm(prev => ({
            ...prev,
            selectedLeadId: tourData.lead_id || "",
            leadName: tourData.customer_name || "",
            eventType: tourData.event_type || "",
            guestCount: tourData.guest_count?.toString() || "",
            phone: tourData.customer_phone || "",
            email: tourData.customer_email || ""
          }));
          setIsScheduleModalOpen(true);
          
          // Clean up local storage and URL
          localStorage.removeItem('scheduleTourData');
          window.history.replaceState({}, document.title, window.location.pathname);

        } catch (e) {
          console.error("Failed to parse tour data from localStorage", e);
          localStorage.removeItem('scheduleTourData'); // Clear corrupted data
        }
      }
    }
  }, []);

  const timeSlots = [
    "00:00", "00:15", "00:30", "00:45",
    "01:00", "01:15", "01:30", "01:45",
    "02:00", "02:15", "02:30", "02:45",
    "03:00", "03:15", "03:30", "03:45",
    "04:00", "04:15", "04:30", "04:45",
    "05:00", "05:15", "05:30", "05:45",
    "06:00", "06:15", "06:30", "06:45",
    "07:00", "07:15", "07:30", "07:45",
    "08:00", "08:15", "08:30", "08:45",
    "09:00", "09:15", "09:30", "09:45",
    "10:00", "10:15", "10:30", "10:45",
    "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45",
    "14:00", "14:15", "14:30", "14:45",
    "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45",
    "17:00", "17:15", "17:30", "17:45",
    "18:00", "18:15", "18:30", "18:45",
    "19:00", "19:15", "19:30", "19:45",
    "20:00", "20:15", "20:30", "20:45",
    "21:00", "21:15", "21:30", "21:45",
    "22:00", "22:15", "22:30", "22:45",
    "23:00", "23:15", "23:30", "23:45"
  ]

  const eventTypes = [
    "Wedding", "Quinceañera", "Corporate", "Birthday", 
    "Anniversary", "Graduation", "Reunion", "Other"
  ]

  // Get week days for the current week
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }), // Monday start
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  })

  // Get days based on view mode
  const getDaysForView = () => {
    switch (viewMode) {
      case 'month':
        // Get the first day of the month and the last day of the month
        const firstDayOfMonth = startOfMonth(currentMonth);
        const lastDayOfMonth = endOfMonth(currentMonth);
        
        // Get the first day of the calendar grid (Sunday of the week containing the first day of month)
        const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // 0 = Sunday
        const lastDayOfCalendar = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 }); // 0 = Sunday
        
        // Generate all days for the calendar grid
        return eachDayOfInterval({
          start: firstDayOfCalendar,
          end: lastDayOfCalendar
        });
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentWeek, { weekStartsOn: 1 }), // Monday start
          end: endOfWeek(currentWeek, { weekStartsOn: 1 })
        })
      case 'day':
        return [selectedDate || new Date()]
      default:
        return []
    }
  }

  const viewDays = getDaysForView()

  // Navigation functions for different views
  const navigatePrevious = () => {
    switch (viewMode) {
      case 'month':
        setCurrentMonth(subMonths(currentMonth, 1))
        break
      case 'week':
        setCurrentWeek(subWeeks(currentWeek, 1))
        break
      case 'day':
        setSelectedDate(subDays(selectedDate || new Date(), 1))
        break
    }
  }

  const navigateNext = () => {
    switch (viewMode) {
      case 'month':
        setCurrentMonth(addMonths(currentMonth, 1))
        break
      case 'week':
        setCurrentWeek(addWeeks(currentWeek, 1))
        break
      case 'day':
        setSelectedDate(addDays(selectedDate || new Date(), 1))
        break
    }
  }

  const navigateToday = () => {
    const today = new Date()
    setCurrentWeek(today)
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentMonth, 'MMMM yyyy')
      case 'week':
        return `${format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
      case 'day':
        return format(selectedDate || new Date(), 'EEEE, MMMM d, yyyy')
      default:
        return ''
    }
  }

  // Fetch available leads for scheduling
  useEffect(() => {
    const fetchLeads = async () => {
      if (!organizationId || authLoading) return
      const { data } = await supabase
        .from('leads')
        .select('id, lead_name, event_type, guest_count, phone, email')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) setAvailableLeads(data)
    }
    fetchLeads()
  }, [organizationId, authLoading])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-600 hover:bg-green-700"
      case "scheduled":
        return "bg-blue-600 hover:bg-blue-700"
      case "completed":
        return "bg-gray-600 hover:bg-gray-700"
      case "cancelled":
        return "bg-red-600 hover:bg-red-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3" />
      case "scheduled":
        return <Calendar className="h-3 w-3" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "cancelled":
        return <X className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const getLanguageFlag = (language: string) => {
    return language === "Spanish" ? "🇪🇸" : "🇺🇸"
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isYesterday(date)) return "Yesterday"
    return format(date, 'MMM d')
  }

  const handleScheduleTour = async () => {
    if (!organizationId) {
      toast.error("Organization not found")
      return
    }

    try {
      const tourData = {
        organization_id: organizationId,
        lead_id: scheduleForm.selectedLeadId || undefined,
        tour_date: scheduleForm.tourDate,
        tour_time: scheduleForm.tourTime,
        tour_type: 'In-Person',
        tour_status: 'scheduled' as const,
        tour_notes: scheduleForm.notes,
        follow_up_required: false,
        proposal_requested: false,
      }

      await createTour(tourData)
      setIsScheduleModalOpen(false)
      setScheduleForm({
        selectedLeadId: "",
        leadName: "",
        eventType: "",
        tourDate: "",
        tourTime: "",
        notes: "",
        guestCount: "",
        phone: "",
        email: ""
      })
      toast.success('Tour scheduled successfully!')
    } catch (error) {
      console.error('Error scheduling tour:', error)
      toast.error('Failed to schedule tour')
    }
  }

  const handleEditTour = async () => {
    if (!editingTour) return

    try {
      const tourData = {
        tour_date: editingTour.tour_date,
        tour_time: editingTour.tour_time,
        tour_notes: editingTour.tour_notes,
        tour_status: editingTour.tour_status,
      }

      await updateTour(editingTour.id, tourData)
      setIsEditModalOpen(false)
      setEditingTour(null)
      toast.success('Tour updated successfully!')
    } catch (error) {
      console.error('Error updating tour:', error)
      toast.error('Failed to update tour')
    }
  }

  const openEditModal = (tour: any) => {
    setEditingTour({
      ...tour,
      tour_date: tour.tour_date.split('T')[0], // Format date for input
    })
    setIsEditModalOpen(true)
  }

  const handleCreateLead = async () => {
    try {
      const leadData = {
        organization_id: organizationId,
        lead_name: newLeadForm.leadName,
        event_type: newLeadForm.eventType,
        guest_count: newLeadForm.guestCount ? parseInt(newLeadForm.guestCount) : null,
        phone: newLeadForm.phone,
        email: newLeadForm.email,
        notes: newLeadForm.notes,
        language: newLeadForm.language,
        lead_source: 'Manual Entry'
      }

      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error)
        toast.error(`Failed to create lead: ${error.message}`)
        return
      }

      // Add the new lead to available leads
      setAvailableLeads(prev => [data, ...prev])
      
      // Pre-select the new lead in the tour form
      setScheduleForm(prev => ({
        ...prev,
        selectedLeadId: data.id,
        leadName: data.lead_name,
        eventType: data.event_type || "",
        guestCount: data.guest_count?.toString() || "",
        phone: data.phone || "",
        email: data.email || ""
      }))

      setIsCreateLeadModalOpen(false)
      setNewLeadForm({
        leadName: "",
        eventType: "",
        guestCount: "",
        phone: "",
        email: "",
        notes: "",
        language: "English"
      })

      toast.success('Lead created successfully!')
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error('Failed to create lead')
    }
  }

  const handleLeadSelection = (leadId: string) => {
    if (leadId === "new") {
      // Clear form for manual entry
      setScheduleForm(prev => ({
        ...prev,
        selectedLeadId: "",
        leadName: "",
        eventType: "",
        guestCount: "",
        phone: "",
        email: ""
      }))
    } else if (leadId) {
      // Pre-populate form with selected lead data
      const selectedLead = availableLeads.find(lead => lead.id === leadId)
      if (selectedLead) {
        setScheduleForm(prev => ({
          ...prev,
          selectedLeadId: leadId,
          leadName: selectedLead.lead_name,
          eventType: selectedLead.event_type || "",
          guestCount: selectedLead.guest_count?.toString() || "",
          phone: selectedLead.phone || "",
          email: selectedLead.email || ""
        }))
      }
    }
  }

  const handleUpdateTourStatus = async (tourId: string, newStatus: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled') => {
    try {
      await updateTour(tourId, { tour_status: newStatus })
      setSelectedTour(null)
    } catch (error) {
      console.error('Error updating tour:', error)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Tour Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-slate-800 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
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
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load tours</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white text-xl sm:text-2xl">Tour Calendar</CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              {getViewTitle()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-slate-700 text-slate-900 hover:bg-slate-100"
              onClick={navigatePrevious}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-slate-700 text-slate-900 hover:bg-slate-100"
              onClick={navigateToday}
            >
              Today
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-slate-700 text-slate-900 hover:bg-slate-100"
              onClick={navigateNext}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          
            <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  data-schedule-tour-button
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-sm px-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">Schedule Tour</span>
                  <span className="md:hidden">Tour</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Tour</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Schedule a venue tour for a potential client
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
                  {/* Lead Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Existing Lead (Optional)</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => setIsCreateLeadModalOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create Lead
                      </Button>
                    </div>
                    <Select 
                      value={scheduleForm.selectedLeadId}
                      onValueChange={handleLeadSelection}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Choose existing lead or enter manually below" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">✏️ Enter Manually (No Lead Link)</SelectItem>
                        {availableLeads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.lead_name} - {lead.event_type} ({lead.guest_count || 'N/A'} guests)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client Name</Label>
                      <Input 
                        className="bg-slate-800 border-slate-700" 
                        placeholder="Client name"
                        value={scheduleForm.leadName}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, leadName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select 
                        value={scheduleForm.eventType}
                        onValueChange={(value) => setScheduleForm(prev => ({ ...prev, eventType: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tour Date</Label>
                      <Input 
                        type="date" 
                        className="bg-slate-800 border-slate-700"
                        value={scheduleForm.tourDate}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, tourDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tour Time</Label>
                      <Select 
                        value={scheduleForm.tourTime}
                        onValueChange={(value) => setScheduleForm(prev => ({ ...prev, tourTime: value }))}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Guest Count</Label>
                      <Input 
                        type="number"
                        className="bg-slate-800 border-slate-700" 
                        placeholder="Expected guests"
                        value={scheduleForm.guestCount}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, guestCount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input 
                        className="bg-slate-800 border-slate-700" 
                        placeholder="Phone number"
                        value={scheduleForm.phone}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      className="bg-slate-800 border-slate-700" 
                      placeholder="Email address"
                      value={scheduleForm.email}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      className="bg-slate-800 border-slate-700" 
                      placeholder="Special requirements or notes"
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)} className="text-slate-800">Cancel</Button>
                    <Button 
                      className="bg-gradient-to-r from-yellow-600 to-yellow-700"
                      onClick={handleScheduleTour}
                      disabled={!scheduleForm.leadName || !scheduleForm.tourDate || !scheduleForm.tourTime}
                    >
                      Schedule Tour
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'month' | 'week' | 'day')}>
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="month" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Week</TabsTrigger>
              <TabsTrigger value="day" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Mobile Calendar View */}
        <div className="block lg:hidden">
          <div className="space-y-4">
            {viewDays.map((day) => {
              const dayTours = tours.filter((tour) => {
                const tourDate = new Date(tour.tour_date + 'T00:00:00')
                return isSameDay(tourDate, day)
              })
              
              return (
                <div key={day.toISOString()} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{format(day, 'EEEE')}</h3>
                      <p className={`text-sm ${isToday(day) ? 'text-yellow-400 font-medium' : 'text-slate-400'}`}>
                        {getDateLabel(day)}
                      </p>
                    </div>
                    {dayTours.length > 0 && (
                      <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                        {dayTours.length} tour{dayTours.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {dayTours.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tours scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayTours.map((tour) => (
                        <div
                          key={tour.id}
                          className="bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors"
                          onClick={() => setSelectedTour(tour)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(tour.tour_status).replace('hover:bg-', 'bg-')}`} />
                              <span className="text-sm font-medium text-white">
                                {tour.tour_time}
                              </span>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(tour.tour_status)}`}>
                              {getStatusIcon(tour.tour_status)}
                              <span className="ml-1">{tour.tour_status}</span>
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="font-medium text-white">
                              {tour.client_name || tour.leads?.lead_name || "Unknown Client"}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">{tour.event_type || "Unknown"}</span>
                              <span className="text-lg">{getLanguageFlag(tour.language || "English")}</span>
                            </div>
                            {tour.guest_count && (
                              <div className="flex items-center space-x-1 text-xs text-slate-400">
                                <Users className="h-3 w-3" />
                                <span>{tour.guest_count} guests</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden lg:block">
          {viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers for Month View */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-slate-300 mb-2">
                  {day}
                </div>
              ))}
              
              {/* Month Calendar Cells */}
              {viewDays.map((day) => {
                const dayTours = tours.filter((tour) => {
                  const tourDate = new Date(tour.tour_date + 'T00:00:00')
                  return isSameDay(tourDate, day)
                })
                
                const isCurrentMonth = isSameMonth(day, currentMonth);
                
                return (
                  <div key={day.toISOString()} className={`min-h-[100px] rounded-lg p-2 border ${isCurrentMonth ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-900/30 border-slate-700/30'}`}>
                    <div className={`text-xs mb-1 ${isToday(day) ? 'text-yellow-400 font-medium' : isCurrentMonth ? 'text-slate-300' : 'text-slate-500'}`}>
                      {format(day, 'd')}
                    </div>
                    {isCurrentMonth && (
                      <div className="space-y-1">
                        {dayTours.slice(0, 3).map((tour) => (
                          <div
                            key={tour.id}
                            className="bg-slate-800 rounded px-1 py-0.5 cursor-pointer hover:bg-slate-700 transition-colors"
                            onClick={() => setSelectedTour(tour)}
                          >
                            <div className="text-xs text-white truncate">
                              {tour.tour_time} - {tour.client_name || tour.leads?.lead_name || "Unknown"}
                            </div>
                          </div>
                        ))}
                        {dayTours.length > 3 && (
                          <div className="text-xs text-slate-400">
                            +{dayTours.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : viewMode === 'day' ? (
            <div className="space-y-4">
              {/* Day View - Single Day with Hour Slots */}
              <div className="bg-slate-800/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4">
                  {format(selectedDate || new Date(), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-2">
                  {timeSlots.map((timeSlot) => {
                    const slotTours = tours.filter((tour) => {
                      const tourDate = new Date(tour.tour_date)
                      return isSameDay(tourDate, selectedDate || new Date()) && tour.tour_time === timeSlot
                    })
                    
                    return (
                      <div key={timeSlot} className="flex items-center border-b border-slate-700/50 pb-2">
                        <div className="w-16 text-sm text-slate-400 font-mono">
                          {timeSlot}
                        </div>
                        <div className="flex-1 ml-4">
                          {slotTours.length === 0 ? (
                            <div className="text-slate-500 text-sm">Available</div>
                          ) : (
                            <div className="space-y-1">
                              {slotTours.map((tour) => (
                                <div
                                  key={tour.id}
                                  className="bg-slate-800 border border-slate-700 rounded-lg p-2 cursor-pointer hover:bg-slate-700 transition-colors"
                                  onClick={() => setSelectedTour(tour)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-white">
                                      {tour.client_name || tour.leads?.lead_name || "Unknown Client"}
                                    </div>
                                    <Badge className={`text-xs ${getStatusColor(tour.tour_status)}`}>
                                      {getStatusIcon(tour.tour_status)}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1">
                                    {tour.event_type} • {tour.guest_count || 0} guests
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {/* Day Headers for Week View */}
              {viewDays.map((day) => (
                <div key={day.toISOString()} className="text-center">
                  <div className={`text-sm font-medium mb-2 ${isToday(day) ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-xs text-slate-400 ${isToday(day) ? 'text-yellow-400' : ''}`}>
                    {getDateLabel(day)}
                  </div>
                </div>
              ))}
              
              {/* Week Calendar Cells */}
              {viewDays.map((day) => {
                              const dayTours = tours.filter((tour) => {
                const tourDate = new Date(tour.tour_date + 'T00:00:00')
                return isSameDay(tourDate, day)
              })
                
                return (
                  <div key={day.toISOString()} className="min-h-[200px] bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="space-y-2">
                      {dayTours.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No tours</p>
                        </div>
                      ) : (
                        dayTours.map((tour) => (
                          <div
                            key={tour.id}
                            className="bg-slate-800 border border-slate-700 rounded-lg p-2 cursor-pointer hover:bg-slate-700 transition-colors"
                            onClick={() => setSelectedTour(tour)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs font-medium text-white">
                                {tour.tour_time}
                              </div>
                              <Badge className={`text-xs ${getStatusColor(tour.tour_status)}`}>
                                {getStatusIcon(tour.tour_status)}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-300 truncate">
                              {tour.client_name || tour.leads?.lead_name || "Unknown"}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {tour.event_type}
                            </div>
                            {tour.guest_count && (
                              <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                                <Users className="h-3 w-3" />
                                <span>{tour.guest_count}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tour Detail Modal */}
        {selectedTour && (
          <Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tour Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback>
                      {(selectedTour.client_name || selectedTour.leads?.lead_name || "UC")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {selectedTour.client_name || selectedTour.leads?.lead_name || "Unknown Client"}
                    </div>
                    <div className="text-sm text-slate-400">{selectedTour.event_type || "Unknown"}</div>
                  </div>
                  <Badge className={`${getStatusColor(selectedTour.tour_status)}`}>
                    {getStatusIcon(selectedTour.tour_status)}
                    <span className="ml-1">{selectedTour.tour_status}</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {format(new Date(selectedTour.tour_date + 'T00:00:00'), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">{selectedTour.tour_time}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {selectedTour.guest_count || 0} guests
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-300">
                        {selectedTour.phone || selectedTour.leads?.phone || "No phone"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTour.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{selectedTour.email}</span>
                  </div>
                )}

                {selectedTour.tour_notes && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Notes</Label>
                    <p className="text-sm text-slate-400 bg-slate-800 p-3 rounded-lg">
                      {selectedTour.tour_notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:text-white"
                    onClick={() => openEditModal(selectedTour)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {selectedTour.tour_status === 'scheduled' && (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateTourStatus(selectedTour.id, 'confirmed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  )}
                  {selectedTour.tour_status === 'confirmed' && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateTourStatus(selectedTour.id, 'completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  )}
                  {selectedTour.tour_status !== 'cancelled' && (
                    <Button 
                      variant="destructive" 
                      onClick={async () => {
                        if (confirm('Delete this tour? This cannot be undone.')) {
                          try {
                            await deleteTour(selectedTour.id)
                            setSelectedTour(null)
                          } catch {}
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Lead Modal */}
        <Dialog open={isCreateLeadModalOpen} onOpenChange={setIsCreateLeadModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new potential client to your leads database
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lead Name *</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700" 
                    placeholder="Client name"
                    value={newLeadForm.leadName}
                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, leadName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select 
                    value={newLeadForm.eventType}
                    onValueChange={(value) => setNewLeadForm(prev => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guest Count</Label>
                  <Input 
                    type="number"
                    className="bg-slate-800 border-slate-700" 
                    placeholder="Expected guests"
                    value={newLeadForm.guestCount}
                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, guestCount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={newLeadForm.language}
                    onValueChange={(value) => setNewLeadForm(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">🇺🇸 English</SelectItem>
                      <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    className="bg-slate-800 border-slate-700" 
                    placeholder="Phone number"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    className="bg-slate-800 border-slate-700" 
                    placeholder="Email address"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  className="bg-slate-800 border-slate-700" 
                  placeholder="Additional notes about this lead"
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateLeadModalOpen(false)} 
                  className="text-slate-300 border-slate-600 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
                  onClick={handleCreateLead}
                  disabled={!newLeadForm.leadName}
                >
                  Create Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Tour Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Tour</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update tour details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tour Date</Label>
                  <Input 
                    type="date" 
                    className="bg-slate-800 border-slate-700"
                    value={editingTour?.tour_date || ""}
                    onChange={(e) => setEditingTour((prev: any) => ({ ...prev, tour_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tour Time</Label>
                  <Select 
                    value={editingTour?.tour_time || ""}
                    onValueChange={(value) => setEditingTour((prev: any) => ({ ...prev, tour_time: value }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tour Status</Label>
                <Select 
                  value={editingTour?.tour_status || ""}
                  onValueChange={(value) => setEditingTour((prev: any) => ({ ...prev, tour_status: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  className="bg-slate-800 border-slate-700" 
                  placeholder="Tour notes"
                  value={editingTour?.tour_notes || ""}
                  onChange={(e) => setEditingTour((prev: any) => ({ ...prev, tour_notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="text-slate-300 border-slate-600 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
                  onClick={handleEditTour}
                  disabled={!editingTour?.tour_date || !editingTour?.tour_time}
                >
                  Update Tour
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

