"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Receipt,
  RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { StripePaymentForm, useStripePayment } from '@/components/stripe-payment-form'
import { useBookings } from '@/hooks/use-bookings'
import { toast } from 'sonner'

interface BookingPaymentIntegrationProps {
  booking: any;
  onPaymentSuccess: (paymentDetails: { amount: number; paymentType: string }) => void;
}

export function BookingPaymentIntegration({ booking, onPaymentSuccess }: BookingPaymentIntegrationProps) {
  const { updateBooking } = useBookings()
  const { isOpen, paymentData, openPaymentForm, closePaymentForm } = useStripePayment()
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate payment amounts
  const totalAmount = booking.venue_fee || 0
  const paidAmount = booking.total_paid || 0
  const depositAmount = booking.deposit_amount || (totalAmount * 0.5)
  const finalPaymentAmount = totalAmount - depositAmount
  const remainingBalance = totalAmount - paidAmount
  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  // Determine payment status and next steps
  const isDepositPaid = paidAmount >= depositAmount
  const isFullyPaid = paidAmount >= totalAmount
  const isOverdue = new Date(booking.next_payment_due) < new Date() && !isFullyPaid

  const getPaymentStatus = () => {
    if (isFullyPaid) return 'paid'
    if (isDepositPaid) return 'deposit_paid'
    if (paidAmount > 0) return 'partial'
    return 'pending'
  }

  const getPaymentStatusBadge = () => {
    const status = getPaymentStatus()
    
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600 hover:bg-green-700">Paid in Full</Badge>
      case 'deposit_paid':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Deposit Paid</Badge>
      case 'partial':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Partially Paid</Badge>
      default:
        return <Badge variant="outline">Payment Pending</Badge>
    }
  }

  const handlePayDeposit = () => {
    openPaymentForm({
      bookingId: booking.id,
      amount: depositAmount,
      paymentType: 'deposit',
      customerEmail: booking.client_email,
      customerName: booking.client_name,
      eventName: booking.event_name,
      eventDate: booking.event_date,
      description: `Deposit payment for ${booking.event_name}`
    })
  }

  const handlePayFinalPayment = () => {
    const remainingAmount = totalAmount - paidAmount
    
    openPaymentForm({
      bookingId: booking.id,
      amount: remainingAmount,
      paymentType: 'final_payment',
      customerEmail: booking.client_email,
      customerName: booking.client_name,
      eventName: booking.event_name,
      eventDate: booking.event_date,
      description: `Final payment for ${booking.event_name}`
    })
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsProcessing(false)
    closePaymentForm()
    
    try {
      // Update booking status with payment amount and type
      const paymentType = paymentData?.paymentType === 'final_payment' ? 'final_payment' : 'deposit'
      // TODO: Implement updateBookingStatus function
      console.log('Payment processed successfully:', paymentIntent)
      
      // The notification will be sent by the updateBookingStatus function
      console.log('Payment processed successfully:', paymentIntent)
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Payment processed but failed to update booking status')
    }
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`)
    console.error('Payment error:', error)
  }

  return (
    <div className="space-y-6">
      {/* Payment Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Status
          </CardTitle>
          <CardDescription>
            Track payment progress for {booking.event_name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Payment Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(paidAmount)} of {formatCurrency(totalAmount)}
              </span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Venue Fee</span>
                <span className="text-sm font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Deposit Required</span>
                <span className="text-sm font-medium">{formatCurrency(depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Final Payment</span>
                <span className="text-sm font-medium">{formatCurrency(finalPaymentAmount)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="text-sm font-medium text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining Balance</span>
                <span className="text-sm font-medium text-orange-600">{formatCurrency(remainingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getPaymentStatusBadge()}
              </div>
            </div>
          </div>

          {/* Overdue Warning */}
          {isOverdue && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                Payment is overdue. Please complete payment to secure your booking.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Actions
          </CardTitle>
          <CardDescription>
            Complete your payment securely online
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Event Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{new Date(booking.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{booking.start_time || '6:00 PM'} - {booking.end_time || '11:00 PM'}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">{booking.event_name}</div>
              <div className="text-sm text-muted-foreground">{booking.guest_count} guests</div>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3">
            {!isDepositPaid && (
              <Button 
                onClick={handlePayDeposit}
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Deposit ({formatCurrency(depositAmount)})
              </Button>
            )}
            
            {isDepositPaid && !isFullyPaid && (
              <Button 
                onClick={handlePayFinalPayment}
                className="w-full"
                size="lg"
                disabled={isProcessing}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Final Amount ({formatCurrency(remainingBalance)})
              </Button>
            )}
            
            {isFullyPaid && (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">Payment Complete</span>
              </div>
            )}
          </div>

          {/* Payment Features */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              <span>Secure SSL encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              <span>PCI DSS compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              <span>Instant confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              <span>Email receipt</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paidAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* This would be populated with actual payment records */}
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Deposit Payment</span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(paidAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stripe Payment Dialog */}
      <Dialog open={isOpen} onOpenChange={closePaymentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Complete your booking payment securely using Stripe.
            </DialogDescription>
          </DialogHeader>
          {paymentData && (
            <StripePaymentForm
              paymentData={paymentData}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={closePaymentForm}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Hook for easy integration
export function useBookingPayment(booking: any) {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const canPayDeposit = () => {
    const totalAmount = booking.venue_fee || 0
    const paidAmount = booking.total_paid || 0
    const depositAmount = booking.deposit_amount || (totalAmount * 0.5)
    return paidAmount < depositAmount
  }
  
  const canPayFinalPayment = () => {
    const totalAmount = booking.venue_fee || 0
    const paidAmount = booking.total_paid || 0
    const depositAmount = booking.deposit_amount || (totalAmount * 0.5)
    return paidAmount >= depositAmount && paidAmount < totalAmount
  }
  
  const isFullyPaid = () => {
    const totalAmount = booking.venue_fee || 0
    const paidAmount = booking.total_paid || 0
    return paidAmount >= totalAmount
  }
  
  const getPaymentProgress = () => {
    const totalAmount = booking.venue_fee || 0
    const paidAmount = booking.total_paid || 0
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
  }
  
  return {
    isProcessing,
    canPayDeposit: canPayDeposit(),
    canPayFinalPayment: canPayFinalPayment(),
    isFullyPaid: isFullyPaid(),
    paymentProgress: getPaymentProgress(),
    setIsProcessing
  }
}

/*
Usage Example:

import { BookingPaymentIntegration } from '@/components/booking-payment-integration'

function BookingDetailsPage({ booking }) {
  const handlePaymentSuccess = () => {
    // Refresh booking data or redirect
    router.refresh()
  }

  return (
    <div>
      <BookingPaymentIntegration 
        booking={booking}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
*/ 
