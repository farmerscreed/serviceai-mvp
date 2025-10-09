"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Search, Phone, Mail, Eye, Edit, Calendar, Trash2, Download, 
  Filter, MoreHorizontal, Plus, FileText, MessageSquare, 
  PhoneCall, TrendingUp, Clock, Headphones, ChevronLeft, ChevronRight
} from "lucide-react"
import { useLeads } from "@/hooks/use-leads"
import { useCallLogs } from "@/hooks/use-call-logs"
import { CallSummary } from "@/components/call-summary"
import { LeadCallJourney } from "@/components/lead-call-journey"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { supabase, Lead, getCurrentUserOrganizationId } from "@/lib/supabase"
import { toast } from "sonner"
import { AIInsightsBadge } from "@/components/ai-insights-badge"
import Link from "next/link"
import { useOrganizationId } from '@/hooks/use-organization-id'

interface LeadFilters {
  search: string
  categories: string[]
  sources: string[]
  languages: string[]
  scoreRange: [number, number]
  dateRange: { from?: Date; to?: Date }
}

interface LeadsTableProps {
  filters?: LeadFilters
}

export function LeadsTable({ filters }: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<any>(null)
  const [showCallSummary, setShowCallSummary] = useState(false)
  const [selectedCallLog, setSelectedCallLog] = useState<any>(null)
  const [showJourneyDialog, setShowJourneyDialog] = useState(false)
  const [selectedJourneyLead, setSelectedJourneyLead] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const { leads, loading, error, refetch } = useLeads()
  const { callLogs } = useCallLogs()
  const { organizationId, loading: orgLoading } = useOrganizationId()

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Helper function to find call log for a lead
  const getCallLogForLead = (lead: any) => {
    if (!lead?.phone || !callLogs || callLogs.length === 0) return null
    const foundCall = callLogs.find(call => call?.caller_phone === lead.phone)
    return foundCall || null
  }

  // Get ALL call logs for a lead (multiple calls)
  const getAllCallLogsForLead = (lead: any) => {
    if (!lead?.phone || !callLogs || callLogs.length === 0) return []
    return callLogs
      .filter(call => call && (call.caller_phone === lead.phone || call.lead_id === lead.id))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }

  // Get call count for a lead
  const getCallCountForLead = (lead: any) => {
    return getAllCallLogsForLead(lead).length
  }

  // Helper function to check if lead came from phone call
  const isPhoneSourcedLead = (lead: any) => {
    return lead.lead_source === 'VAPI Phone Call'
  }

  // Helper function to get call indicator badge
  const getCallIndicatorBadge = (lead: any) => {
    if (!isPhoneSourcedLead(lead)) return null
    const callCount = getCallCountForLead(lead)
    
    if (callCount === 0) return null
    
    return (
      <Badge 
        variant="outline" 
        className="text-xs border-blue-500 text-blue-400 bg-blue-500/10 flex items-center space-x-1 mr-1"
      >
        <PhoneCall className="w-3 h-3" />
        <span>{callCount === 1 ? 'Call' : `${callCount} Calls`}</span>
      </Badge>
    )
  }

  // Handle viewing call details
  const handleViewCall = async (lead: any) => {
    const allCalls = getAllCallLogsForLead(lead)
    if (allCalls.length > 0 && allCalls[0]) {
      // Show the most recent call first
      setSelectedCallLog(allCalls[0])
      setSelectedJourneyLead(lead) // Set the lead for multiple calls context
      setShowCallSummary(true)
    } else {
      toast.error('No call log found for this lead')
    }
  }

  // Handle viewing full journey
  const handleViewJourney = (lead: any) => {
    setSelectedJourneyLead(lead)
    setShowJourneyDialog(true)
  }

  const handleScheduleTour = (lead: any) => {
    // Navigate to tours page with pre-filled lead information
    const tourData = {
      customer_name: lead.lead_name,
      customer_email: lead.email,
      customer_phone: lead.phone,
      event_type: lead.event_type,
      guest_count: lead.guest_count,
      lead_id: lead.id
    }
    
    // Store tour data in localStorage for the tours page to use
    localStorage.setItem('scheduleTourData', JSON.stringify(tourData))
    
    // Navigate to tours page
    window.location.href = '/dashboard/tours?action=schedule'
  }

  const handleConvertToBooking = (lead: any) => {
    // Navigate to bookings page with pre-filled lead information
    const bookingData = {
      customer_name: lead.lead_name,
      customer_email: lead.email,
      customer_phone: lead.phone,
      event_type: lead.event_type,
      guest_count: lead.guest_count,
      lead_id: lead.id
    }
    
    // Store booking data in localStorage for the bookings page to use
    localStorage.setItem('convertToBookingData', JSON.stringify(bookingData))
    
    // Navigate to bookings page
    window.location.href = '/dashboard/bookings?action=convert'
  }

  // Filter leads based on search term and filters
  const filteredLeads = useMemo(() => {
    let filtered = leads

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lead_source?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters if provided
    if (filters) {
      // Category filter
      if (filters.categories.length > 0) {
        filtered = filtered.filter(lead =>
          filters.categories.includes(lead.lead_category || '')
        )
      }

      // Source filter
      if (filters.sources.length > 0) {
        filtered = filtered.filter(lead => 
          filters.sources.includes(lead.lead_source || '')
        )
      }

      // Language filter
      if (filters.languages.length > 0) {
        filtered = filtered.filter(lead => 
          filters.languages.includes(lead.language || 'English')
        )
      }

      // Score range filter
      if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) {
        filtered = filtered.filter(lead =>
          (lead.lead_score || 0) >= filters.scoreRange[0] &&
          (lead.lead_score || 0) <= filters.scoreRange[1]
        )
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        filtered = filtered.filter(lead => {
          const leadDate = new Date(lead.created_at || new Date())
          const fromDate = filters.dateRange.from
          const toDate = filters.dateRange.to
          
          if (fromDate && leadDate < fromDate) return false
          if (toDate && leadDate > toDate) return false
          return true
        })
      }
    }

    return filtered
  }, [leads, searchTerm, filters])

  // Pagination calculations
  const totalLeads = filteredLeads.length
  const totalPages = Math.ceil(totalLeads / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredLeads.length])

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1)
  }

  // Handle page navigation
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  // Handle lead deletion
  const handleDeleteLead = async (leadId: string) => {
    try {
      console.log('Starting deletion process for lead:', leadId)
      
      // First, delete any tours linked to this lead (to avoid FK 409 conflict)
      const { error: tourDelError } = await supabase
        .from('tours')
        .delete()
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)

      if (tourDelError) {
        console.error('Error deleting linked tours:', tourDelError)
        toast.error(`Failed to delete linked tours: ${tourDelError.message}`)
        return
      }

      console.log('Successfully deleted linked tours')

      // Delete bookings tied to lead
      const { error: bookingsDelError } = await supabase
        .from('bookings')
        .delete()
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)

      if (bookingsDelError) {
        console.error('Error deleting linked bookings:', bookingsDelError)
        toast.error(`Failed to delete linked bookings: ${bookingsDelError.message}`)
        return
      }

      console.log('Successfully deleted linked bookings')

      // Delete call logs tied to lead (if any FK exists)
      const { error: callLogsDelError } = await supabase
        .from('call_logs')
        .delete()
        .eq('lead_id', leadId)
        .eq('organization_id', organizationId)

      if (callLogsDelError) {
        console.error('Error deleting call logs:', callLogsDelError)
        // Don't fail the entire operation for call logs, just log it
      }

      console.log('Attempting to delete lead:', leadId)
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error deleting lead:', error)
        toast.error(`Failed to delete lead: ${error.message}`)
        return
      }

      console.log('Successfully deleted lead')
      toast.success('Lead and linked data deleted successfully')
      refetch()
      setShowDeleteDialog(false)
      setLeadToDelete(null)
    } catch (error: any) {
      console.error('Unexpected error deleting lead:', error)
      const errorMessage = error?.message || error?.details || 'Unknown error occurred'
      toast.error(`Failed to delete lead: ${errorMessage}`)
    }
  }

  // Handle lead editing
  const handleEditLead = async () => {
    if (!editingLead) return

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          lead_name: editingLead.lead_name,
          email: editingLead.email,
          phone: editingLead.phone,
          event_type: editingLead.event_type,
          guest_count: editingLead.guest_count,
          special_requirements: editingLead.special_requirements,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLead.id)
        .eq('organization_id', organizationId)

      if (error) throw error

      toast.success('Lead updated successfully')
      refetch()
      setShowEditDialog(false)
      setEditingLead(null)
    } catch (error: any) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return

    try {
      console.log('Starting bulk deletion for leads:', selectedLeads)
      
      // Delete tours for each selected lead first
      const { error: tourDelError } = await supabase
        .from('tours')
        .delete()
        .in('lead_id', selectedLeads)
        .eq('organization_id', organizationId)

      if (tourDelError) {
        console.error('Error deleting linked tours (bulk):', tourDelError)
        toast.error(`Failed to delete linked tours: ${tourDelError.message}`)
        return
      }

      console.log('Successfully deleted linked tours (bulk)')

      // Delete bookings for each selected lead
      const { error: bookingsBulkError } = await supabase
        .from('bookings')
        .delete()
        .in('lead_id', selectedLeads)
        .eq('organization_id', organizationId)

      if (bookingsBulkError) {
        console.error('Error deleting linked bookings (bulk):', bookingsBulkError)
        toast.error(`Failed to delete linked bookings: ${bookingsBulkError.message}`)
        return
      }

      console.log('Successfully deleted linked bookings (bulk)')

      // Delete call logs for each selected lead
      const { error: callLogsBulkError } = await supabase
        .from('call_logs')
        .delete()
        .in('lead_id', selectedLeads)
        .eq('organization_id', organizationId)

      if (callLogsBulkError) {
        console.error('Error deleting call logs (bulk):', callLogsBulkError)
        // Don't fail the entire operation for call logs, just log it
      }

      console.log('Attempting to delete leads:', selectedLeads)
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error deleting leads:', error)
        toast.error(`Failed to delete leads: ${error.message}`)
        return
      }

      console.log('Successfully deleted leads')
      toast.success(`${selectedLeads.length} leads and linked data deleted successfully`)
      refetch()
      setSelectedLeads([])
    } catch (error: any) {
      console.error('Unexpected error deleting leads:', error)
      const errorMessage = error?.message || error?.details || 'Unknown error occurred'
      toast.error(`Failed to delete leads: ${errorMessage}`)
    }
  }

  // Handle export
  const handleExport = () => {
    const csvContent = [
      // Header
      ['Name', 'Email', 'Phone', 'Event Type', 'Guest Count', 'Score', 'Category', 'Source', 'Created At'].join(','),
      // Data rows
      ...filteredLeads.map(lead => [
        lead.lead_name || '',
        lead.email || '',
        lead.phone || '',
        lead.event_type || '',
        lead.guest_count || '',
        lead.lead_score || '',
        lead.lead_category || '',
        lead.lead_source || '',
        new Date(lead.created_at || new Date()).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Leads exported successfully')
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(paginatedLeads.map(lead => lead.id || '').filter(id => id !== ''))
    }
  }

  // Handle individual selection
  const handleSelectLead = (leadId: string) => {
    if (!leadId) return
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  // Color helpers
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-400"
    if (score >= 60) return "text-yellow-400"
    return "text-red-400"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HOT': return "bg-red-600 text-white"
      case 'WARM': return "bg-yellow-600 text-white"
      case 'COOL': return "bg-blue-600 text-white"
      default: return "bg-gray-600 text-white"
    }
  }

  const getLanguageFlag = (language: string) => {
    return language === 'Spanish' ? '🇪🇸' : '🇺🇸'
  }

  // Mobile card view
  const MobileLeadCard = ({ lead }: { lead: any }) => {
    const callLog = getCallLogForLead(lead)
    const hasCall = isPhoneSourcedLead(lead) && callLog
    
    return (
    <Card className="bg-gradient-to-b from-slate-800 to-slate-900/80 border-slate-700 rounded-xl shadow-lg mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={selectedLeads.includes(lead.id || '')}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedLeads([...selectedLeads, lead.id || ''])
                } else {
                  setSelectedLeads(selectedLeads.filter(id => id !== (lead.id || '')))
                }
              }}
              className="border-white data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
            />
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-slate-700 text-white border-0">
                {lead.lead_name
                  ? lead.lead_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
                <div className="font-semibold text-white text-base flex items-center space-x-2">
                  <span>{lead.lead_name || "Unknown"}</span>
                  {getCallIndicatorBadge(lead)}
                </div>
                <div className="flex items-center space-x-2 mt-1">
              <Badge className={`text-xs ${getCategoryColor(lead.lead_category || '')}`}>
                {lead.lead_category || 'Unknown'}
              </Badge>
                  {hasCall && callLog && (
                    <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{Math.floor((callLog.call_duration || 0) / 60)}m</span>
                    </Badge>
                  )}
                </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuItem onClick={() => { setSelectedLead(lead); setShowViewDialog(true) }} className="text-slate-300 hover:bg-slate-700">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
                {hasCall && (
                  <DropdownMenuItem onClick={() => handleViewCall(lead)} className="text-slate-300 hover:bg-slate-700">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    View Call
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleViewJourney(lead)} className="text-slate-300 hover:bg-slate-700">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Journey
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditingLead({...lead}); setShowEditDialog(true) }} className="text-slate-300 hover:bg-slate-700">
                <Edit className="mr-2 h-4 w-4" />
                Edit Lead
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Tour
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-600" />
              <DropdownMenuItem 
                className="text-red-400 hover:bg-red-900/20"
                onClick={() => { setLeadToDelete(lead.id || ''); setShowDeleteDialog(true) }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2 text-sm">
          {lead.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-3 w-3 text-slate-400" />
              <span className="text-blue-400">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-3 w-3 text-slate-400" />
              <span className="text-slate-300">{lead.phone}</span>
            </div>
          )}
          {lead.event_type && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {lead.event_type}
              </Badge>
              {lead.guest_count && (
                <span className="text-xs text-slate-400">{lead.guest_count} guests</span>
              )}
            </div>
          )}
          
          {/* AI Insights for Mobile */}
          <div className="mt-2">
            <AIInsightsBadge lead={lead} />
          </div>
        </div>

          {/* Call Summary Preview */}
          {hasCall && callLog && (callLog.ai_summary || callLog.transcription) && (() => {
            const summaryText = (callLog.ai_summary ?? callLog.transcription) || ""
            const preview = summaryText.length > 100 ? `${summaryText.substring(0, 100)}...` : summaryText
            return (
              <div className="mt-3 p-2 bg-slate-900 rounded border border-slate-700">
                <div className="flex items-center space-x-2 mb-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">Call Summary</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {preview}
                </p>
              </div>
            )
          })()}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center space-x-2">
            <div className={`font-medium text-sm ${getScoreColor(lead.lead_score)}`}>{lead.lead_score}</div>
            <Progress value={lead.lead_score} className="h-2 w-16" />
          </div>
          <div className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(lead.created_at || new Date()), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
  }

  if (loading) {
  return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-32 bg-slate-800" />
            <Skeleton className="h-6 w-16 bg-slate-800" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-slate-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            <p>Error loading leads: {error}</p>
                <Button 
              onClick={refetch} 
              variant="outline" 
              className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Try Again
                </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-white">Leads</CardTitle>
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                {totalLeads}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 w-full"
                />
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
              <Button 
                  onClick={handleExport}
                variant="outline" 
                size="sm" 
                  className="border-slate-700 text-slate-900 bg-white hover:bg-slate-100 flex-1 sm:flex-none"
              >
                  <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
                {selectedLeads.length > 0 && (
                  <Button 
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm" 
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedLeads.length})
                  </Button>
                )}
            </div>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pagination Controls - Top */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">Show</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-400">
                per page
              </span>
            </div>
            <div className="text-sm text-slate-400">
              Showing {startIndex + 1}-{Math.min(endIndex, totalLeads)} of {totalLeads} leads
            </div>
          </div>

          {paginatedLeads.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leads found matching your criteria</p>
            </div>
          ) : isMobile ? (
            <div className="p-4">
              {paginatedLeads.map((lead) => (
                <MobileLeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          ) : (
            <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-slate-600"
                      />
                    </TableHead>
                    <TableHead className="text-slate-300">Lead Information</TableHead>
                    <TableHead className="text-slate-300 hidden md:table-cell">Event Details</TableHead>
                    <TableHead className="text-slate-300 w-[80px]">Score</TableHead>
                    <TableHead className="text-slate-300 w-[120px] hidden lg:table-cell">AI Insights</TableHead>
                    <TableHead className="text-slate-300 w-[100px] hidden lg:table-cell">Category</TableHead>
                    <TableHead className="text-slate-300 w-[100px] hidden xl:table-cell">Created</TableHead>
                    <TableHead className="text-slate-300 text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id || '')}
                          onCheckedChange={() => handleSelectLead(lead.id || '')}
                          className="border-slate-600"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.lead_name}`} />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
                              {lead.lead_name?.split(' ').map((n: string) => n[0]).join('') || 'NA'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Link href={`/dashboard/leads/${lead.id}`} className="font-medium text-white truncate hover:underline">
                                {lead.lead_name || 'Unknown'}
                              </Link>
                              <span className="text-xs text-slate-400 flex-shrink-0">
                                {getLanguageFlag(lead.language || 'English')}
                              </span>
                              {getCallIndicatorBadge(lead)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1 text-xs text-slate-400">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{lead.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-slate-400">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{lead.phone || 'N/A'}</span>
                              </div>
                            </div>
                            {/* Show category on mobile */}
                            <div className="mt-1 lg:hidden">
                              <Badge className={`text-xs ${getCategoryColor(lead.lead_category || '')}`}>
                                {lead.lead_category || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <p className="text-white font-medium truncate">{lead.event_type || 'N/A'}</p>
                          <p className="text-xs text-slate-400">
                            {lead.guest_count ? `${lead.guest_count} guests` : 'No count'}
                          </p>
                          {lead.event_date && (
                            <p className="text-xs text-slate-400">
                              {new Date(lead.event_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[80px]">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 flex-shrink-0 hidden sm:block">
                            <Progress 
                              value={lead.lead_score || 0} 
                              className="h-2 bg-slate-700"
                            />
                          </div>
                          <span className={`text-sm font-medium flex-shrink-0 ${getScoreColor(lead.lead_score || 0)}`}>
                            {lead.lead_score || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px] hidden lg:table-cell">
                        <AIInsightsBadge lead={lead} />
                      </TableCell>
                      <TableCell className="w-[100px] hidden lg:table-cell">
                        <div className="space-y-1">
                          <Badge className={`text-xs ${getCategoryColor(lead.lead_category || '')}`}>
                            {lead.lead_category || 'Unknown'}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {isPhoneSourcedLead(lead) && <PhoneCall className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                            <span className="text-xs text-slate-400 truncate">
                              {lead.lead_source || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px] hidden xl:table-cell">
                        <div className="text-xs text-slate-400">
                          <div className="truncate">{formatDistanceToNow(new Date(lead.created_at || new Date()))} ago</div>
                          <div className="text-xs">{new Date(lead.created_at || new Date()).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right w-[120px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedLead(lead)
                                setShowViewDialog(true)
                              }}
                              className="text-slate-300 hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingLead({...lead})
                                setShowEditDialog(true)
                              }}
                              className="text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleScheduleTour(lead)}
                              className="text-green-400 hover:bg-slate-700"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule Tour
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleConvertToBooking(lead)}
                              className="text-yellow-400 hover:bg-slate-700"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Convert to Booking
                            </DropdownMenuItem>
                            {isPhoneSourcedLead(lead) && (
                              <>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem 
                                  onClick={() => handleViewCall(lead)}
                                  className="text-blue-400 hover:bg-slate-700"
                                >
                                  <Headphones className="w-4 h-4 mr-2" />
                                  View Call
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleViewJourney(lead)}
                                  className="text-purple-400 hover:bg-slate-700"
                                >
                                  <TrendingUp className="w-4 h-4 mr-2" />
                                  View Journey
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              onClick={() => {
                                setLeadToDelete(lead.id || '')
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-400 hover:bg-slate-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}

          {/* Pagination Controls - Bottom */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-6 pt-4 border-t border-slate-800">
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
                        </div>
              <div className="flex items-center space-x-2">
                          <Button 
                  variant="outline"
                            size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="border-slate-700 text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50"
                          >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                          </Button>
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                          <Button 
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm" 
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 ${
                          currentPage === pageNum 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                          </Button>
                    )
                  })}
                </div>
                          <Button 
                  variant="outline"
                            size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="border-slate-700 text-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Lead Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              View complete information for this lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Name</label>
                  <p className="text-white">{selectedLead.lead_name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <p className="text-white">{selectedLead.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Phone</label>
                  <p className="text-white">{selectedLead.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Event Type</label>
                  <p className="text-white">{selectedLead.event_type || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Lead Score</label>
                  <p className={`font-medium ${getScoreColor(selectedLead.lead_score)}`}>
                    {selectedLead.lead_score}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <Badge className={`${getCategoryColor(selectedLead.lead_category || '')}`}>
                    {selectedLead.lead_category || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Source</label>
                  <p className="text-white">{selectedLead.lead_source || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Guest Count</label>
                  <p className="text-white">{selectedLead.guest_count || "N/A"}</p>
                </div>
              </div>
              {selectedLead.special_requirements && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-300">Special Requirements</label>
                  <p className="text-white">{selectedLead.special_requirements}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update lead information
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Name</Label>
                  <Input
                    value={editingLead.lead_name || ""}
                    onChange={(e) => setEditingLead({...editingLead, lead_name: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Email</Label>
                  <Input
                    value={editingLead.email || ""}
                    onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Phone</Label>
                  <Input
                    value={editingLead.phone || ""}
                    onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Event Type</Label>
                  <Input
                    value={editingLead.event_type || ""}
                    onChange={(e) => setEditingLead({...editingLead, event_type: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Guest Count</Label>
                  <Input
                    type="number"
                    value={editingLead.guest_count || ""}
                    onChange={(e) => setEditingLead({...editingLead, guest_count: parseInt(e.target.value) || 0})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium text-slate-300">Special Requirements</Label>
                <Textarea
                  value={editingLead.special_requirements || ""}
                  onChange={(e) => setEditingLead({...editingLead, special_requirements: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLead} className="bg-yellow-600 hover:bg-yellow-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this lead? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => leadToDelete && handleDeleteLead(leadToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Summary Dialog */}
      {selectedCallLog && selectedJourneyLead && (
        <CallSummary 
          callLog={selectedCallLog}
          allCallLogs={getAllCallLogsForLead(selectedJourneyLead)}
          open={showCallSummary}
          onClose={() => {
            setShowCallSummary(false)
            setSelectedCallLog(null)
          }}
        />
      )}

      {/* Lead Journey Timeline Dialog */}
      {selectedJourneyLead && (
        <LeadCallJourney
          leadId={selectedJourneyLead.id}
          leadPhone={selectedJourneyLead.phone}
          open={showJourneyDialog}
          onOpenChange={(open) => {
            setShowJourneyDialog(open)
            if (!open) setSelectedJourneyLead(null)
          }}
        />
      )}
    </>
  )
}

// Final check to ensure file is saved correctly.

