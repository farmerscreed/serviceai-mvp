"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Mail, Phone, MessageSquare, Save } from "lucide-react"

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [newLeadNotifications, setNewLeadNotifications] = useState(true)
  const [tourReminders, setTourReminders] = useState(true)
  const [paymentAlerts, setPaymentAlerts] = useState(true)
  const [notificationFrequency, setNotificationFrequency] = useState("immediate")

  const notificationTypes = [
    {
      id: "new-leads",
      title: "New Leads",
      description: "Get notified when new leads are generated",
      icon: Bell,
      enabled: newLeadNotifications,
      setEnabled: setNewLeadNotifications,
    },
    {
      id: "tour-reminders",
      title: "Tour Reminders",
      description: "Reminders for upcoming venue tours",
      icon: MessageSquare,
      enabled: tourReminders,
      setEnabled: setTourReminders,
    },
    {
      id: "payment-alerts",
      title: "Payment Alerts",
      description: "Notifications for deposits and payments",
      icon: Phone,
      enabled: paymentAlerts,
      setEnabled: setPaymentAlerts,
    },
  ]

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Notification Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Notification Channels</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <Label className="text-slate-300">Email Notifications</Label>
                  <p className="text-sm text-slate-400">Receive notifications via email</p>
                </div>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <Label className="text-slate-300">SMS Notifications</Label>
                  <p className="text-sm text-slate-400">Receive notifications via text message</p>
                </div>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-slate-400" />
                <div>
                  <Label className="text-slate-300">Push Notifications</Label>
                  <p className="text-sm text-slate-400">Receive browser push notifications</p>
                </div>
              </div>
              <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Notification Types</h3>

          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <type.icon className="h-5 w-5 text-slate-400" />
                  <div>
                    <Label className="text-slate-300">{type.title}</Label>
                    <p className="text-sm text-slate-400">{type.description}</p>
                  </div>
                </div>
                <Switch checked={type.enabled} onCheckedChange={type.setEnabled} />
              </div>
            ))}
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Notification Frequency</h3>

          <div className="space-y-2">
            <Label className="text-slate-300">How often would you like to receive notifications?</Label>
            <Select value={notificationFrequency} onValueChange={setNotificationFrequency}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-gradient-to-r from-yellow-600 to-yellow-700">
            <Save className="h-4 w-4 mr-2" />
            Save Notification Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
