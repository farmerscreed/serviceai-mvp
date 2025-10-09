"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Use a safe fallback for the max capacity
const MAX_CAPACITY = venueConfig?.capacity?.mainHall?.max || 300;

// Time validation helper
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const bookingFormSchema = z.object({
  event_name: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  client_name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  client_email: z.string().email({ message: "Invalid email address." }),
  client_phone: z.string().optional(),
  event_date: z.date({ required_error: "Event date is required." }),
  // ADDED: Time fields
  start_time: z.string().regex(timeRegex, { message: "Start time must be in HH:MM format (24-hour)." }),
  end_time: z.string().regex(timeRegex, { message: "End time must be in HH:MM format (24-hour)." }),
  event_type: z.string().min(2, { message: "Event type is required." }),
  guest_count: z.coerce.number().int().min(1, { message: "Guest count must be at least 1." }).max(MAX_CAPACITY, { message: `Guest count cannot exceed ${MAX_CAPACITY}.` }),
  event_status: z.enum(["confirmed", "pending", "cancelled"]),
  venue_fee: z.coerce.number().min(0, { message: "Venue fee must be a positive number." }),
  deposit_amount: z.coerce.number().min(0, { message: "Deposit must be a positive number." }),
  // UPDATED: Payment status to match database values
  payment_status: z.enum(["pending", "Deposit Only", "partial", "paid", "overdue", "Paid in Full"]),
}).refine((data) => {
  // Validate that end time is after start time
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  organizationId: string;
  onBookingCreated: () => void;
  initialData?: any | null; // Changed from leadId to initialData
}

export function BookingForm({ organizationId, onBookingCreated, initialData }: BookingFormProps) {
  const { addBooking, loading } = useBookings();
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      event_name: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      event_type: "Wedding",
      event_status: "pending",
      guest_count: 100,
      venue_fee: 0,
      deposit_amount: 0,
      payment_status: "Deposit Only",
      start_time: "18:00",
      end_time: "23:00",
    },
  });

  // Pre-fill form with initial data when it's available
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...form.getValues(), // Keep existing defaults
        client_name: initialData.customer_name || "",
        client_email: initialData.customer_email || "",
        client_phone: initialData.customer_phone || "",
        event_type: initialData.event_type || "Wedding",
        guest_count: initialData.guest_count || 100,
        // Pre-fill event name from client name and event type
        event_name: `${initialData.customer_name}'s ${initialData.event_type}` || ""
      });
    }
  }, [initialData, form]);

  async function onSubmit(data: BookingFormValues) {
    try {
      // ROBUST: Multiple fallback methods for date formatting
      const formatDateForDB = (date: Date): string => {
        try {
          // Method 1: toLocaleDateString with Canadian format (YYYY-MM-DD)
          const canadianFormat = date.toLocaleDateString('en-CA');
          if (canadianFormat && canadianFormat.includes('-')) {
            return canadianFormat;
          }
        } catch (e) {
          console.warn('Canadian date format failed:', e);
        }

        try {
          // Method 2: Manual formatting (most reliable)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch (e) {
          console.error('Manual date formatting failed:', e);
          // Method 3: Last resort - ISO split (might have timezone issues but better than nothing)
          return date.toISOString().split('T')[0];
        }
      };

      const formattedDate = formatDateForDB(data.event_date);
      
      // Debug logging
      console.log('🔍 Original date object:', data.event_date);
      console.log('🔍 Formatted date for DB:', formattedDate);
      console.log('🔍 Full booking data:', JSON.stringify({
        ...data,
        event_date: formattedDate
      }, null, 2));
      
      await addBooking({
        ...data,
        event_date: formattedDate,
        lead_id: initialData?.lead_id || undefined, // Pass lead_id if available
        commission_rate: 0.20, // Default 20% commission rate
        commission_amount: (data.venue_fee || 0) * 0.20, // Calculate commission amount
        total_paid: 0, // Initialize as 0
        balance_due: data.venue_fee || 0, // Initialize as full venue fee
        updated_at: new Date().toISOString(),
      });
      
      toast({
        title: "Booking Created",
        description: "The new booking has been successfully added.",
      });
      form.reset();
      onBookingCreated();
    } catch (error: any) {
      console.error('❌ Booking creation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
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
                <FormLabel>Event Name</FormLabel>
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
                <FormLabel>Client Name</FormLabel>
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
                <FormLabel>Client Email</FormLabel>
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
                <FormLabel>Client Phone (Optional)</FormLabel>
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
          {/* ADDED: Start Time field */}
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
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
                <div className="text-xs text-muted-foreground">
                  {field.value && `Display: ${formatTimeFor12Hour(field.value)}`}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* ADDED: End Time field */}
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
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
                <div className="text-xs text-muted-foreground">
                  {field.value && `Display: ${formatTimeFor12Hour(field.value)}`}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="event_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Corporate Event">Corporate Event</SelectItem>
                    <SelectItem value="Birthday Party">Birthday Party</SelectItem>
                    <SelectItem value="Anniversary">Anniversary</SelectItem>
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
                <FormLabel>Guest Count</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="event_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
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
          {/* UPDATED: Payment Status field with correct values */}
          <FormField
            control={form.control}
            name="payment_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="Deposit Only">Deposit Only</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="paid">Fully Paid</SelectItem>
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
                <FormLabel>Venue Fee ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="3000" {...field} />
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
                <FormLabel>Deposit Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full md:w-auto bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800">
          {loading ? "Creating..." : "Create Booking"}
        </Button>
      </form>
    </Form>
  );
}