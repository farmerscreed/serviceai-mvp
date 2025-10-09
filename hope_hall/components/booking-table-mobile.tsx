"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar, CalendarIcon, Filter, Search, Users, DollarSign, Phone, Mail } from "lucide-react"
import { BookingWithCalculations } from "@/hooks/use-bookings"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

interface BookingTableMobileProps {
  bookings: BookingWithCalculations[]
  title: string
  onStatusChange?: (bookingId: string, status: string) => void
}

// FIXED: Safe date formatting functions
const formatDateSafe = (dateString: string, formatType: 'full' | 'month-day' | 'year' = 'full') => {
  try {
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    
    const date = new Date(year, month - 1, day);
    
    switch (formatType) {
      case 'full':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: '2-digit' 
        });
      case 'month-day':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: '2-digit' 
        });
      case 'year':
        return year.toString();
      default:
        return dateString;
    }
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
};

// FIXED: Safe date comparison
const isDateInRange = (dateString: string, range: 'upcoming' | 'past' | 'today'): boolean => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return false;
    
    const eventDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    switch (range) {
      case 'upcoming':
        return eventDate > today;
      case 'past':
        return eventDate < today;
      case 'today':
        const todayString = today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
        return dateString === todayString;
      default:
        return false;
    }
  } catch (error) {
    console.warn('Date comparison error:', error);
    return false;
  }
};

export function BookingTableMobile({ bookings, title, onStatusChange }: BookingTableMobileProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || booking.event_status === statusFilter
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "upcoming" && isDateInRange(booking.event_date, 'upcoming')) ||
      (dateFilter === "past" && isDateInRange(booking.event_date, 'past')) ||
      (dateFilter === "today" && isDateInRange(booking.event_date, 'today'))

    return matchesSearch && matchesStatus && matchesDate
  })

  const getTotalRevenue = () => {
    return filteredBookings.reduce((sum, booking) => sum + (booking.venue_fee || 0), 0)
  }

  const getAverageGuests = () => {
    const validBookings = filteredBookings.filter(b => b.guest_count)
    if (validBookings.length === 0) return 0
    return Math.round(validBookings.reduce((sum, booking) => sum + (booking.guest_count || 0), 0) / validBookings.length)
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-90">Total Bookings</p>
                <p className="text-2xl font-bold">{filteredBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalRevenue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-90">Avg Guests</p>
                <p className="text-2xl font-bold">{getAverageGuests()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-normal">Filters</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{booking.event_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{booking.event_type}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={getBookingStatusVariant(booking.event_status)}>
                      {booking.event_status || 'pending'}
                    </Badge>
                    <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                      {booking.payment_status || 'pending'}
                    </Badge>
                  </div>
                </div>

                {/* Date and Guests */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span>{formatDateSafe(booking.event_date, 'full')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{booking.guest_count || 0} guests</span>
                  </div>
                </div>

                {/* Client Info */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{booking.client_name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{booking.client_phone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{booking.client_email}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Venue Fee</p>
                    <p className="font-semibold text-lg">{formatCurrency(booking.venue_fee)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Commission</p>
                    <p className="font-semibold text-green-600">{formatCurrency(booking.commission_amount || 0)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Guests</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Payment</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="font-medium">
                      <div className="font-medium">{booking.event_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.lead?.lead_name || booking.client_name}
                      </div>
                      <div className="text-xs text-gray-400">{booking.event_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatDateSafe(booking.event_date, 'month-day')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateSafe(booking.event_date, 'year')}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{booking.guest_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">{formatCurrency(booking.venue_fee)}</div>
                      <div className="text-sm text-green-600">
                        +{formatCurrency(booking.commission_amount || 0)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getBookingStatusVariant(booking.event_status)}>
                        {booking.event_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                        {booking.payment_status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                ? "Try adjusting your filters to see more results."
                : "Get started by creating your first booking."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getBookingStatusVariant(status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'confirmed':
      return 'default'
    case 'completed':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    case 'pending':
      return 'secondary'
    default:
      return 'secondary'
  }
}

function getPaymentStatusVariant(status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'paid':
      return 'default'
    case 'partial':
      return 'secondary'
    case 'failed':
      return 'destructive'
    default:
      return 'outline'
  }
}