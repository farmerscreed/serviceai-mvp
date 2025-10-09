"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Globe, CheckCircle, AlertCircle, Clock, ExternalLink, 
  Copy, Loader2, RefreshCw, AlertTriangle
} from "lucide-react"
import { useBrandingContext } from "@/lib/branding-context"
import { toast } from "sonner"

interface DomainStatus {
  status: 'pending' | 'verified' | 'failed' | 'active'
  message: string
  icon: any
  color: string
}

export function CustomDomainManager() {
  const { branding, updateBranding } = useBrandingContext()
  const [domain, setDomain] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [dnsRecords, setDnsRecords] = useState([
    { type: 'CNAME', name: '@', value: 'your-app.vercel.app', ttl: '3600' },
    { type: 'CNAME', name: 'www', value: 'your-app.vercel.app', ttl: '3600' }
  ])

  useEffect(() => {
    if (branding.custom_domain) {
      setDomain(branding.custom_domain)
    }
  }, [branding.custom_domain])

  const getDomainStatus = (): DomainStatus => {
    if (!domain) {
      return {
        status: 'pending',
        message: 'No domain configured',
        icon: AlertCircle,
        color: 'text-slate-400'
      }
    }

    if (branding.custom_domain_verified) {
      return {
        status: 'verified',
        message: 'Domain verified and active',
        icon: CheckCircle,
        color: 'text-green-500'
      }
    }

    return {
      status: 'pending',
      message: 'Domain verification pending',
      icon: Clock,
      color: 'text-yellow-500'
    }
  }

  const handleSaveDomain = async () => {
    if (!domain) {
      toast.error('Please enter a domain name')
      return
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(domain)) {
      toast.error('Please enter a valid domain name')
      return
    }

    try {
      await updateBranding({ custom_domain: domain })
      toast.success('Domain saved successfully')
    } catch (error) {
      toast.error('Failed to save domain')
    }
  }

  const handleVerifyDomain = async () => {
    if (!domain) {
      toast.error('Please enter a domain name first')
      return
    }

    setVerifying(true)
    try {
      // Simulate domain verification
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would check DNS records
      const isVerified = Math.random() > 0.5 // Simulate verification result
      
      if (isVerified) {
        await updateBranding({ custom_domain_verified: true })
        toast.success('Domain verified successfully!')
      } else {
        toast.error('Domain verification failed. Please check your DNS settings.')
      }
    } catch (error) {
      toast.error('Failed to verify domain')
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const status = getDomainStatus()
  const StatusIcon = status.icon

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Custom Domain
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure a custom domain for your venue management system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-4">
          <Label className="text-white">Domain Name</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourvenue.com"
              className="text-slate-300 flex-1"
            />
            <Button
              onClick={handleSaveDomain}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </div>
        </div>

        {/* Domain Status */}
        {domain && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`text-sm ${status.color}`}>{status.message}</span>
              <Badge variant={status.status === 'verified' ? 'default' : 'secondary'}>
                {status.status}
              </Badge>
            </div>

            {status.status === 'pending' && (
              <Button
                onClick={handleVerifyDomain}
                disabled={verifying}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Verify Domain
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        <Separator className="bg-slate-700" />

        {/* DNS Configuration */}
        <div className="space-y-4">
          <Label className="text-white">DNS Configuration</Label>
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-400">
              Add these DNS records to your domain provider:
            </p>
            
            {dnsRecords.map((record, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-700 rounded p-3">
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white ml-2">{record.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white ml-2">{record.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Value:</span>
                      <span className="text-white ml-2">{record.value}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`${record.type} ${record.name} ${record.value}`)}
                  className="text-slate-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Instructions */}
        <div className="space-y-4">
          <Label className="text-white">Setup Instructions</Label>
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="text-white text-sm font-medium">Add DNS Records</p>
                <p className="text-slate-400 text-sm">
                  Add the CNAME records above to your domain provider's DNS settings
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="text-white text-sm font-medium">Wait for Propagation</p>
                <p className="text-slate-400 text-sm">
                  DNS changes can take up to 48 hours to propagate globally
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="text-white text-sm font-medium">Verify Domain</p>
                <p className="text-slate-400 text-sm">
                  Click "Verify Domain" once DNS records are added
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SSL Certificate */}
        {branding.custom_domain_verified && (
          <div className="space-y-4">
            <Label className="text-white">SSL Certificate</Label>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 text-sm">SSL certificate is active</span>
            </div>
            <p className="text-slate-400 text-sm">
              Your custom domain is secured with an SSL certificate
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 