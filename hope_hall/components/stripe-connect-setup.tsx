"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, CheckCircle, AlertCircle, ExternalLink, 
  Loader2, RefreshCw, DollarSign, Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrganizationId } from '@/hooks/use-organization-id'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface StripeAccount {
  id: string
  business_type: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  country: string
  default_currency: string
  created: number
}

export default function StripeConnectSetup() {
  const { organizationId, loading: orgLoading } = useOrganizationId()
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [organization, setOrganization] = useState<any>(null)

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchStripeStatus()
    }
  }, [organizationId, orgLoading])

  const fetchStripeStatus = async () => {
    try {
      setLoading(true)
      
      // Fetch organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()
      
      if (orgError) throw orgError
      setOrganization(orgData)

      // If organization has Stripe account ID, fetch account details
      if (orgData.stripe_connect_account_id) {
        const { data: accountData, error: accountError } = await supabase.functions.invoke('stripe-account-status', {
          body: { account_id: orgData.stripe_connect_account_id }
        })

        if (!accountError && accountData) {
          setStripeAccount(accountData.account)
        }
      }
    } catch (error) {
      console.error('Error fetching Stripe status:', error)
      toast.error('Failed to load payment settings')
    } finally {
      setLoading(false)
    }
  }

  const connectStripeAccount = async () => {
    try {
      setConnecting(true)
      
      const { data, error } = await supabase.functions.invoke('stripe-connect-setup', {
        body: { organization_id: organizationId }
      })

      if (error) throw error

      if (data.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url
      } else {
        toast.error('Failed to create Stripe Connect account')
      }
    } catch (error) {
      console.error('Error connecting Stripe account:', error)
      toast.error('Failed to connect Stripe account')
    } finally {
      setConnecting(false)
    }
  }

  const refreshStripeStatus = async () => {
    await fetchStripeStatus()
    toast.success('Payment status refreshed')
  }

  const getAccountStatus = () => {
    if (!stripeAccount) return { status: 'not_connected', color: 'text-red-500', icon: AlertCircle }
    
    if (!stripeAccount.details_submitted) {
      return { status: 'pending', color: 'text-yellow-500', icon: AlertCircle }
    }
    
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return { status: 'active', color: 'text-green-500', icon: CheckCircle }
    }
    
    return { status: 'limited', color: 'text-orange-500', icon: AlertCircle }
  }

  const status = getAccountStatus()
  const StatusIcon = status.icon

  if (loading || orgLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Payment Integration</CardTitle>
          <CardDescription className="text-slate-400">
            Connect your Stripe account to accept payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Integration
        </CardTitle>
        <CardDescription className="text-slate-400">
          Connect your Stripe account to accept payments and manage payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`text-sm font-medium ${status.color}`}>
                {status.status === 'not_connected' && 'Not Connected'}
                {status.status === 'pending' && 'Setup Pending'}
                {status.status === 'active' && 'Active'}
                {status.status === 'limited' && 'Limited Access'}
              </span>
            </div>
            <Badge variant={status.status === 'active' ? 'default' : 'secondary'}>
              {status.status}
            </Badge>
          </div>

          {stripeAccount && (
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Account ID:</span>
                  <span className="text-white ml-2 font-mono">{stripeAccount.id}</span>
                </div>
                <div>
                  <span className="text-slate-400">Business Type:</span>
                  <span className="text-white ml-2 capitalize">{stripeAccount.business_type}</span>
                </div>
                <div>
                  <span className="text-slate-400">Country:</span>
                  <span className="text-white ml-2">{stripeAccount.country}</span>
                </div>
                <div>
                  <span className="text-slate-400">Currency:</span>
                  <span className="text-white ml-2">{stripeAccount.default_currency.toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-slate-700" />

        {/* Capabilities */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Payment Capabilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {stripeAccount?.charges_enabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-slate-300">Accept Payments</span>
            </div>
            <div className="flex items-center gap-2">
              {stripeAccount?.payouts_enabled ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-slate-300">Receive Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              {stripeAccount?.details_submitted ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-slate-300">Account Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-slate-300">PCI Compliant</span>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {!stripeAccount ? (
              <Button
                onClick={connectStripeAccount}
                disabled={connecting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={refreshStripeStatus}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
                <Button
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Stripe Dashboard
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-blue-400 font-medium">Payment Processing</h4>
              <p className="text-slate-300 text-sm">
                Connect your Stripe account to accept credit card payments, manage refunds, 
                and receive payouts directly to your bank account. All transactions are 
                PCI compliant and secure.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 