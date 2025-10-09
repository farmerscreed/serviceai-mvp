"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Facebook, Mail, Calendar, CreditCard, Settings, Loader2 } from "lucide-react"
import { useOrganization } from "@/hooks/use-organization"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"



export function IntegrationSettings() {
  const { organization, loading, updateSettings } = useOrganization()
  const [saving, setSaving] = useState(false)
  
  // Local state for form fields
  const [vapiEnabled, setVapiEnabled] = useState(true)
  const [facebookEnabled, setFacebookEnabled] = useState(true)
  const [calendarEnabled, setCalendarEnabled] = useState(false)
  const [stripeEnabled, setStripeEnabled] = useState(false)

  // Update local state when organization data loads
  useEffect(() => {
    if (organization?.settings?.integrations) {
      const integrations = organization.settings.integrations
      setVapiEnabled(integrations.vapi_enabled ?? true)
      setFacebookEnabled(integrations.facebook_enabled ?? true)
      setCalendarEnabled(integrations.google_calendar_enabled ?? false)
      setStripeEnabled(integrations.stripe_enabled ?? false)
    }
  }, [organization])

  const handleSaveIntegrations = async () => {
    try {
      setSaving(true)
      
      await updateSettings({
        integrations: {
          vapi_enabled: vapiEnabled,
          facebook_enabled: facebookEnabled,
          google_calendar_enabled: calendarEnabled,
          stripe_enabled: stripeEnabled
        }
      })

      toast.success("Integration settings saved successfully!")
    } catch (error) {
      console.error("Error saving integration settings:", error)
      toast.error("Failed to save integration settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Update integrations array with real status
  const integrations = [
    {
      id: "vapi",
      name: "VAPI Phone System",
      description: "AI-powered phone system for lead capture",
      icon: Phone,
      status: vapiEnabled ? "connected" : "disconnected",
      color: vapiEnabled ? "bg-green-600" : "bg-gray-600",
    },
    {
      id: "facebook",
      name: "Facebook Lead Ads",
      description: "Capture leads from Facebook advertising",
      icon: Facebook,
      status: facebookEnabled ? "connected" : "disconnected",
      color: facebookEnabled ? "bg-blue-600" : "bg-gray-600",
    },
    {
      id: "google",
      name: "Google Ads",
      description: "Track leads from Google advertising campaigns",
      icon: Mail,
      status: "disconnected",
      color: "bg-gray-600",
    },
    {
      id: "calendar",
      name: "Google Calendar",
      description: "Sync tours and events with Google Calendar",
      icon: Calendar,
      status: calendarEnabled ? "connected" : "disconnected",
      color: calendarEnabled ? "bg-green-600" : "bg-gray-600",
    },
    {
      id: "stripe",
      name: "Stripe Payments",
      description: "Process deposits and payments",
      icon: CreditCard,
      status: stripeEnabled ? "connected" : "disconnected",
      color: stripeEnabled ? "bg-green-600" : "bg-gray-600",
    },
  ]

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Integration List */}
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${integration.color}`}>
                  <integration.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">{integration.name}</div>
                  <div className="text-sm text-slate-400">{integration.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  variant={integration.status === "connected" ? "default" : "secondary"}
                  className={integration.status === "connected" ? "bg-green-600" : "bg-gray-600"}
                >
                  {integration.status}
                </Badge>
                <Button variant="outline" size="sm" className="border-slate-700 text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* VAPI Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">VAPI Configuration</h3>

          <div className="bg-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Enable VAPI Integration</Label>
                <p className="text-sm text-slate-400">Allow AI phone system to capture leads</p>
              </div>
              <Switch checked={vapiEnabled} onCheckedChange={setVapiEnabled} />
            </div>

            {vapiEnabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input 
                      value={process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER || "+17747711584"} 
                      className="bg-slate-700 border-slate-600 text-white" 
                      readOnly 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Language Support</Label>
                    <Input value="English, Spanish" className="bg-slate-700 border-slate-600 text-white" readOnly />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Facebook Integration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Facebook Lead Ads</h3>

          <div className="bg-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Enable Facebook Integration</Label>
                <p className="text-sm text-slate-400">Automatically import leads from Facebook ads</p>
              </div>
              <Switch checked={facebookEnabled} onCheckedChange={setFacebookEnabled} />
            </div>

            {facebookEnabled && (
              <div className="space-y-3">
                <div className="text-sm text-green-400">✓ Connected to Hope Hall Facebook Page</div>
                <div className="text-sm text-slate-400">Last sync: 2 minutes ago</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveIntegrations}
            disabled={saving}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {saving ? "Saving..." : "Save Integration Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
