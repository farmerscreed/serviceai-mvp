"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Save, Loader2 } from "lucide-react"
import { useOrganization } from "@/hooks/use-organization"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function GeneralSettings() {
  const { organization, loading, updateOrganization, updateSettings } = useOrganization()
  const [saving, setSaving] = useState(false)
  
  // Local state for form fields
  const [venueName, setVenueName] = useState("")
  const [venueDescription, setVenueDescription] = useState("")
  const [maxCapacity, setMaxCapacity] = useState("")
  const [secondaryCapacity, setSecondaryCapacity] = useState("")
  const [timezone, setTimezone] = useState("America/New_York")
  const [autoRespond, setAutoRespond] = useState(true)

  // Update local state when organization data loads
  useEffect(() => {
    if (organization) {
      setVenueName(organization.name || "The Hope Hall")
      setVenueDescription(
        "Premier event venue in Maryland specializing in weddings, quinceañeras, and corporate events."
      )
      setMaxCapacity(organization.settings?.venue_capacity?.toString() || "300")
      setSecondaryCapacity(organization.settings?.secondary_hall_capacity?.toString() || "50")
      setAutoRespond(organization.settings?.notifications?.email_alerts ?? true)
    }
  }, [organization])

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update basic organization info
      await updateOrganization({
        name: venueName
      })

      // Update settings
      await updateSettings({
        venue_capacity: parseInt(maxCapacity) || 300,
        secondary_hall_capacity: parseInt(secondaryCapacity) || 50,
        notifications: {
          email_alerts: autoRespond,
          sms_alerts: organization?.settings?.notifications?.sms_alerts ?? false,
          lead_notifications: organization?.settings?.notifications?.lead_notifications ?? true,
          tour_reminders: organization?.settings?.notifications?.tour_reminders ?? true
        }
      })

      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">General Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Venue Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Venue Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue-name" className="text-slate-300">
                Venue Name
              </Label>
              <Input
                id="venue-name"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-capacity" className="text-slate-300">
                Main Hall Capacity
              </Label>
              <Input
                id="max-capacity"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secondary-capacity" className="text-slate-300">
                Secondary Hall Capacity
              </Label>
              <Input
                id="secondary-capacity"
                value={secondaryCapacity}
                onChange={(e) => setSecondaryCapacity(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-description" className="text-slate-300">
              Venue Description
            </Label>
            <Textarea
              id="venue-description"
              value={venueDescription}
              onChange={(e) => setVenueDescription(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>
        </div>

        {/* Venue Logo */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Venue Logo</h3>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder.svg?height=64&width=64" />
              <AvatarFallback>HH</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="border-slate-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Logo
            </Button>
          </div>
        </div>

        {/* System Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">System Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-slate-300">
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-slate-300">Auto-respond to Leads</Label>
              <p className="text-sm text-slate-400">Automatically send welcome messages to new leads</p>
            </div>
            <Switch checked={autoRespond} onCheckedChange={setAutoRespond} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
