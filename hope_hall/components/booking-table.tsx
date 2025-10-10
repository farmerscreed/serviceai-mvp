"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/lib/utils"
import { useBookings, BookingWithCalculations } from "@/hooks/use-bookings"
import { BookingEditForm } from "@/components/booking-edit-form"
import { Edit, Trash2, Calendar, Users, DollarSign, Clock, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingTableProps {
  organizationId: string
  title?: string
  showOlderBookings?: boolean
}

// FIXED: Safe date formatting function
const formatDateSafe = (dateString: string) => {
  try {
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    // Fallback: just format the string directly
    return dateString;
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
};

// Check if a date is in the past
const isDateInPast = (dateString: string) => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
      const bookingDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate < today;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Mobile Booking Card Component
const MobileBookingCard = ({ 
  booking, 
  onEdit, 
  onDelete,
  onView 
}: {
  booking: BookingWithCalculations
  onEdit: (booking: BookingWithCalculations) => void
  onDelete: (bookingId: string) => void
  onView: (bookingId: string) => void
}) => (
  <Card className="bg-slate-800 border-slate-700 mb-4">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-white truncate">{booking.event_name}</h3>
          <p className="text-sm text-slate-400 truncate">{booking.client_name}</p>
        </div>
        <Badge variant={getBookingStatusVariant(booking.event_status)} className="ml-2 flex-shrink-0">
          {booking.event_status || 'pending'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-300">
            {formatDateSafe(booking.event_date)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-300">{booking.guest_count || 0} guests</span>
        </div>
        <div className="flex items-center space-x-2 col-span-2">
          <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm font-medium text-green-400">
            {formatCurrency(booking.venue_fee || 0)}
          </span>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(booking.id!)}
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(booking)}
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-slate-600 text-red-400 hover:text-red-300">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Booking</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                Are you sure you want to delete "{booking.event_name}"? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(booking.id!)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </Card>
)

export function BookingTable({ organizationId, title = "Current Bookings", showOlderBookings = false }: BookingTableProps) {
  const { bookings, loading, error, deleteBooking } = useBookings();
  const [editingBooking, setEditingBooking] = useState<BookingWithCalculations | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Filter bookings based on showOlderBookings flag
  const filteredBookings = bookings.filter(booking => {
    if (showOlderBookings) {
      return true; // Show all bookings
    } else {
      return !isDateInPast(booking.event_date); // Only show current and future bookings
    }
  });

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleEditBooking = (booking: BookingWithCalculations) => {
    setEditingBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const handleBookingUpdated = () => {
    setIsEditDialogOpen(false);
    setEditingBooking(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-slate-400">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-red-300 font-semibold">Booking Error</h3>
              <p className="text-red-400">Error loading bookings: {error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredBookings || filteredBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          {showOlderBookings ? 'No older bookings found' : 'No current bookings found'}
        </h3>
        <p className="text-slate-400">
          {showOlderBookings 
            ? 'All bookings are current or future events.' 
            : 'Create your first booking to get started.'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        // Mobile Card View
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <MobileBookingCard
              key={booking.id}
              booking={booking}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onView={(bookingId) => router.push(`/dashboard/bookings/${bookingId}`)}
            />
          ))}
        </div>
      ) : (
        // Desktop Table View
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Event Details</TableHead>
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300 text-center">Guests</TableHead>
                <TableHead className="text-slate-300 text-right">Revenue</TableHead>
                <TableHead className="text-slate-300 text-center">Status</TableHead>
                <TableHead className="text-slate-300 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="font-medium">
                    <div className="font-medium text-white">{booking.event_name}</div>
                    <div className="text-sm text-slate-400">{booking.client_name}</div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatDateSafe(booking.event_date)}
                  </TableCell>
                  <TableCell className="text-center text-slate-300">
                    {booking.guest_count || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-400">
                    {formatCurrency(booking.venue_fee || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getBookingStatusVariant(booking.event_status)}>
                      {booking.event_status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                        className="border-slate-600 text-slate-300 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBooking(booking)}
                        className="border-slate-600 text-slate-300 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-slate-600 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Booking</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-300">
                              Are you sure you want to delete "{booking.event_name}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-slate-600 text-slate-300">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteBooking(booking.id!)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Booking</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <BookingEditForm
              booking={editingBooking}
              onBookingUpdated={handleBookingUpdated}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function getBookingStatusVariant(status: string | undefined) {
  switch (status) {
    case 'confirmed': return 'default'
    case 'completed': return 'secondary'
    case 'cancelled': return 'destructive'
    case 'pending': return 'secondary'
    default: return 'secondary'
  }
}
