"use client"

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Shield, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormData {
  bookingId: string
  amount: number
  paymentType: 'deposit' | 'final_payment'
  currency?: string
  customerEmail?: string
  customerName?: string
  description?: string
  eventName?: string
  eventDate?: string
  venue?: string
}

interface StripePaymentFormProps {
  paymentData: PaymentFormData
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  onCancel?: () => void
}

// This is the inner form, which will be wrapped by the Elements provider
function PaymentForm({ onSuccess, onError, onCancel, paymentData }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.')
      return
    }

    setIsProcessing(true)
    setError(null)
    setPaymentStatus('processing')

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/bookings?payment=success`,
          receipt_email: paymentData.customerEmail,
        },
        redirect: 'if_required'
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          setPaymentStatus('succeeded')
          toast.success('Payment successful!')
          onSuccess(paymentIntent.id)
        } else if (paymentIntent.status === 'processing') {
          setPaymentStatus('processing')
          toast.info('Payment is being processed...')
        } else if (paymentIntent.status === 'requires_action') {
          // Handle additional authentication if needed
          toast.info('Additional authentication required')
        } else {
          throw new Error('Payment failed')
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
      setPaymentStatus('failed')
      onError(err.message || 'Payment failed')
      toast.error(err.message || 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const getPaymentTypeLabel = () => {
    return paymentData.paymentType === 'deposit' ? 'Deposit Payment' : 'Final Payment'
  }

  const getPaymentDescription = () => {
    return paymentData.description || 
           `${getPaymentTypeLabel()} for ${paymentData.eventName || 'your event'}`
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Payment Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatCurrency(paymentData.amount)}</span>
          </div>
          
          {paymentData.eventName && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Event</span>
              <span className="text-sm">{paymentData.eventName}</span>
            </div>
          )}
          
          {paymentData.eventDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm">{new Date(paymentData.eventDate).toLocaleDateString()}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment Type</span>
            <Badge variant={paymentData.paymentType === 'deposit' ? 'default' : 'secondary'}>
              {paymentData.paymentType === 'deposit' ? 'Deposit' : 'Final Payment'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Status */}
        {paymentStatus === 'succeeded' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Payment completed successfully!</AlertDescription>
          </Alert>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Information</label>
            <div className="border rounded-md p-3">
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  defaultValues: {
                    billingDetails: {
                      email: paymentData.customerEmail,
                      name: paymentData.customerName
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={!stripe || isProcessing || paymentStatus === 'succeeded'}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatCurrency(paymentData.amount)}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Payment Processing Notice */}
        {paymentStatus === 'processing' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your payment is being processed. This may take a few moments.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

// This is the main exported component, which will now handle fetching the client secret
export function StripePaymentForm({ 
  paymentData, 
  onSuccess, 
  onError, 
  onCancel 
}: StripePaymentFormProps) {
  const [options, setOptions] = useState<StripeElementsOptions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [headerData, setHeaderData] = useState({ title: 'Payment', description: 'Please enter your payment details.'})

  useEffect(() => {
    if (paymentData.amount > 0) {
      setHeaderData({
        title: paymentData.paymentType === 'deposit' ? 'Deposit Payment' : 'Final Payment',
        description: paymentData.description || `${paymentData.paymentType === 'deposit' ? 'Deposit' : 'Final'} for ${paymentData.eventName || 'your event'}`
      })
      setError(null)
      supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId: paymentData.bookingId,
          amount: paymentData.amount,
          paymentType: paymentData.paymentType,
          currency: paymentData.currency || 'usd',
          customerEmail: paymentData.customerEmail,
          customerName: paymentData.customerName,
          description: paymentData.description,
          automaticPaymentMethods: true
        }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error creating payment intent:', error)
          setError(error.message || 'Failed to initialize payment')
          onError(error.message || 'Failed to initialize payment')
        } else if (data?.clientSecret) {
          setOptions({
            clientSecret: data.clientSecret,
            appearance: {
              theme: 'stripe',
            },
          })
        } else {
          const errorMessage = 'Failed to create payment intent: Invalid response from server.'
          console.error(errorMessage, data)
          setError(errorMessage)
          onError(errorMessage)
        }
      }).catch(err => {
        console.error('Error invoking function:', err)
        const errorMessage = err.message || 'An unexpected error occurred.'
        setError(errorMessage)
        onError(errorMessage)
      })
    }
  }, [paymentData, onError])

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Payment Initialization Failed
          </CardTitle>
          <CardDescription>
            There was a problem setting up the payment form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          {onCancel && (
            <Button variant="outline" className="mt-4 w-full" onClick={onCancel}>
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!options) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Initializing Payment
          </CardTitle>
          <CardDescription>
            Setting up secure payment processing...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        paymentData={paymentData}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  )
}

/**
 * Custom hook to manage the payment dialog state.
 */
export function useStripePayment() {
  const [isOpen, setIsOpen] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null)

  const openPaymentForm = (data: PaymentFormData) => {
    setPaymentData(data)
    setIsOpen(true)
  }

  const closePaymentForm = () => {
    setIsOpen(false)
    setPaymentData(null)
  }

  return {
    isOpen,
    paymentData,
    openPaymentForm,
    closePaymentForm
  }
}

// Example usage component
export function PaymentDialog({ 
  isOpen, 
  onClose, 
  paymentData, 
  onSuccess, 
  onError 
}: {
  isOpen: boolean
  onClose: () => void
  paymentData: PaymentFormData | null
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}) {
  if (!isOpen || !paymentData) return null

  const title = paymentData.paymentType === 'deposit' ? 'Deposit Payment' : 'Final Payment'
  const description = paymentData.description || `${paymentData.paymentType === 'deposit' ? 'Deposit' : 'Final'} for ${paymentData.eventName || 'your event'}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg grid grid-rows-[auto_1fr] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto min-h-0 px-6 pt-4 pb-6">
          <StripePaymentForm
            paymentData={paymentData}
            onSuccess={(paymentIntentId) => {
              onSuccess(paymentIntentId)
              onClose()
            }}
            onError={onError}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

/*
Usage Example:

import { StripePaymentForm, useStripePayment, PaymentDialog } from '@/components/stripe-payment-form'

function BookingPage() {
  const { isOpen, paymentData, openPaymentForm, closePaymentForm } = useStripePayment()

  const handlePayDeposit = () => {
    openPaymentForm({
      bookingId: booking.id,
      amount: booking.deposit_amount,
      paymentType: 'deposit',
      customerEmail: booking.client_email,
      customerName: booking.client_name,
      eventName: booking.event_name,
      eventDate: booking.event_date,
      description: `Deposit for ${booking.event_name}`
    })
  }

  const handlePaymentSuccess = (paymentIntentId: string) => {
    toast.success('Payment successful!')
    // Refresh booking data
    refetchBooking()
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`)
  }

  return (
    <div>
      <Button onClick={handlePayDeposit}>
        Pay Deposit ({formatCurrency(booking.deposit_amount)})
      </Button>

      <PaymentDialog
        isOpen={isOpen}
        onClose={closePaymentForm}
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  )
}
*/ 