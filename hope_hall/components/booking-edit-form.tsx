"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useBookings } from "@/hooks/use-bookings";
import { useToast } from "@/components/ui/use-toast";
import { venueConfig } from "@/lib/venue-config";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

const MAX_CAPACITY = venueConfig?.capacity?.mainHall?.max || 300;

// Time validation helper
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const bookingEditFormSchema = z.object({
  event_name: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  client_name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  client_email: z.string().email({ message: "Invalid email address." }),
  client_phone: z.string().optional(),
  event_date: z.date({ required_error: "Event date is required." }),
  event_type: z.string().min(2, { message: "Event type is required." }),
  guest_count: z.coerce.number().int().min(1).max(MAX_CAPACITY),
  event_status: z.enum(["confirmed", "pending", "cancelled"]),
  payment_status: z.enum(["pending", "Deposit Only", "partial", "paid", "overdue", "Paid in Full"]),
  venue_fee: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0),
  commission_amount: z.coerce.number().min(0).optional(),
  start_time: z.string().regex(timeRegex, { message: "Invalid time format" }),
  end_time: z.string().regex(timeRegex, { message: "Invalid time format" }),
  special_requests: z.string().optional(),
});

type BookingEditFormValues = z.infer<typeof bookingEditFormSchema>;

interface BookingEditFormProps {
  booking: any;
  onBookingUpdated: () => void;
  onCancel: () => void;
}

export function BookingEditForm({ booking, onBookingUpdated, onCancel }: BookingEditFormProps) {
  const { updateBooking, loading } = useBookings();
  const { toast } = useToast();

  const form = useForm<BookingEditFormValues>({
    resolver: zodResolver(bookingEditFormSchema),
    defaultValues: {
      event_name: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      event_type: "Wedding",
      event_status: "pending",
      payment_status: "pending",
      guest_count: 100,
      venue_fee: 0,
      deposit_amount: 0,
      commission_amount: 0,
      start_time: "18:00",
      end_time: "23:00",
      special_requests: "",
    },
  });

  useEffect(() => {
    if (booking) {
      form.reset({
        event_name: booking.event_name || "",
        client_name: booking.client_name || "",
        client_email: booking.client_email || "",
        client_phone: booking.client_phone || "",
        event_date: new Date(booking.event_date),
        event_type: booking.event_type || "Wedding",
        event_status: booking.event_status || "pending",
        payment_status: booking.payment_status || "pending",
        guest_count: booking.guest_count || 100,
        venue_fee: booking.venue_fee || 0,
        deposit_amount: booking.deposit_amount || 0,
        commission_amount: booking.commission_amount || 0,
        start_time: booking.start_time || "18:00",
        end_time: booking.end_time || "23:00",
        special_requests: booking.special_requests || "",
      });
    }
  }, [booking, form]);

  async function onSubmit(data: BookingEditFormValues) {
    try {
      // Format date for database
      const formatDateForDB = (date: Date): string => {
        try {
          const canadianFormat = date.toLocaleDateString('en-CA');
          if (canadianFormat && canadianFormat.includes('-')) {
            return canadianFormat;
          }
        } catch (e) {
          console.warn('Canadian date format failed:', e);
        }
        
        try {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          console.error('Manual date formatting failed:', e);
          return date.toISOString().split('T')[0];
        }
      };

      await updateBooking(booking.id, {
        ...data,
        event_date: formatDateForDB(data.event_date),
      });
      toast({
        title: "Booking Updated",
        description: "The booking has been successfully updated.",
      });
      onBookingUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update booking. Please try again.",
      });
    }
  }

  // Helper function to convert 24-hour to 12-hour format for display
  const formatTimeFor12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="event_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="Sarah & Mike's Wedding" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Client Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Client Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="event_date"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Event Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="event_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Quinceañera">Quinceañera</SelectItem>
                    <SelectItem value="Corporate">Corporate Event</SelectItem>
                    <SelectItem value="Birthday">Birthday Party</SelectItem>
                    <SelectItem value="Anniversary">Anniversary</SelectItem>
                    <SelectItem value="Graduation">Graduation</SelectItem>
                    <SelectItem value="Reunion">Reunion</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guest_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Guest Count</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Start Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="time" 
                      {...field} 
                      className="pl-10"
                    />
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <div className="text-xs text-slate-400">
                  {field.value && `Display: ${formatTimeFor12Hour(field.value)}`}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">End Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="time" 
                      {...field} 
                      className="pl-10"
                    />
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </FormControl>
                <div className="text-xs text-slate-400">
                  {field.value && `Display: ${formatTimeFor12Hour(field.value)}`}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="event_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Event Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payment_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Payment Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="Deposit Only">Deposit Only</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="Paid in Full">Paid in Full</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="venue_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Venue Fee ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deposit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Deposit Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commission_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Commission Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="special_requests"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Special Requests</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any special requirements or requests..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600 text-slate-300 hover:text-white">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800">
            {loading ? "Updating..." : "Update Booking"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
