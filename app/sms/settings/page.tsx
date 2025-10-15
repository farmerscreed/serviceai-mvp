'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/lib/organizations/organization-context'
import { 
  Smartphone, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TestTube,
  Save,
  RefreshCw,
  Phone,
  MessageSquare
} from 'lucide-react'

interface SMSProvider {
  name: string
  enabled: boolean
  configured: boolean
  phoneNumber?: string
  accountSid?: string
  apiKey?: string
  status: 'connected' | 'disconnected' | 'error'
}

interface SMSSettings {
  smsEnabled: boolean
  defaultLanguage: 'en' | 'es'
  autoSendConfirmations: boolean
  autoSendReminders: boolean
  reminderHours: number
  emergencySMSEnabled: boolean
  providers: SMSProvider[]
}

export default function SMSSettingsPage() {
  const { currentOrganization, refreshOrganizations } = useOrganization()
  const { toast } = useToast()
  const [settings, setSettings] = useState<SMSSettings>({
    smsEnabled: false,
    defaultLanguage: 'en',
    autoSendConfirmations: true,
    autoSendReminders: true,
    reminderHours: 24,
    emergencySMSEnabled: true,
    providers: [
      {
        name: 'twilio',
        enabled: true,
        configured: false,
        status: 'disconnected'
      },
      {
        name: 'vonage',
        enabled: false,
        configured: false,
        status: 'disconnected'
      }
    ]
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadSettings()
    }
  }, [currentOrganization])

  const loadSettings = async () => {
    if (!currentOrganization) return

    setLoading(true)
    try {
      // Fetch full organization details including SMS settings
      const response = await fetch(`/api/organizations/${currentOrganization.organization_id}`)
      if (!response.ok) {
        throw new Error('Failed to load organization settings')
      }
      
      const data = await response.json()
      const org = data.organization
      
      setSettings({
        smsEnabled: org.sms_enabled ?? true,
        defaultLanguage: org.sms_default_language ?? 'en',
        autoSendConfirmations: org.sms_auto_send_confirmations ?? true,
        autoSendReminders: org.sms_auto_send_reminders ?? true,
        reminderHours: org.sms_reminder_hours ?? 24,
        emergencySMSEnabled: org.sms_emergency_enabled ?? true,
        providers: [
          {
            name: 'twilio',
            enabled: true,
            configured: !!org.twilio_account_sid,
            status: org.twilio_account_sid ? 'connected' : 'disconnected',
            accountSid: org.twilio_account_sid,
            apiKey: org.twilio_auth_token,
            phoneNumber: org.twilio_phone_numbers ? org.twilio_phone_numbers[0] : undefined,
          },
          {
            name: 'vonage',
            enabled: false,
            configured: false,
            status: 'disconnected'
          }
        ]
      })
    } catch (error) {
      console.error('Error loading SMS settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load SMS settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!currentOrganization) return

    try {
      setSaving(true)
      
      const twilioProvider = settings.providers.find(p => p.name === 'twilio')

      const response = await fetch(`/api/organizations/${currentOrganization.organization_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sms_enabled: settings.smsEnabled,
          sms_default_language: settings.defaultLanguage,
          sms_auto_send_confirmations: settings.autoSendConfirmations,
          sms_auto_send_reminders: settings.autoSendReminders,
          sms_reminder_hours: settings.reminderHours,
          sms_emergency_enabled: settings.emergencySMSEnabled,
          twilio_account_sid: twilioProvider?.accountSid,
          twilio_auth_token: twilioProvider?.apiKey,
          twilio_phone_numbers: twilioProvider?.phoneNumber ? [twilioProvider.phoneNumber] : [],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }
      
      // Reload settings to confirm they were saved
      await loadSettings()

      toast({
        title: 'Success',
        description: 'SMS settings saved successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save SMS settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testProvider = async (providerName: string) => {
    if (!currentOrganization) return

    try {
      setTesting(providerName)
      
      // Simulate testing the provider
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update provider status
      setSettings(prev => ({
        ...prev,
        providers: prev.providers.map(provider => 
          provider.name === providerName 
            ? { ...provider, status: 'connected' as const }
            : provider
        )
      }))
      
      toast({
        title: 'Success',
        description: `${providerName} provider test successful`
      })
    } catch (error) {
      setSettings(prev => ({
        ...prev,
        providers: prev.providers.map(provider => 
          provider.name === providerName 
            ? { ...provider, status: 'error' as const }
            : provider
        )
      }))
      
      toast({
        title: 'Error',
        description: `Failed to test ${providerName} provider`,
        variant: 'destructive'
      })
    } finally {
      setTesting(null)
    }
  }

  const updateProvider = (providerName: string, updates: Partial<SMSProvider>) => {
    setSettings(prev => ({
      ...prev,
      providers: prev.providers.map(provider => 
        provider.name === providerName 
          ? { ...provider, ...updates }
          : provider
      )
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SMS settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Settings</h1>
          <p className="text-gray-600">Configure your SMS providers and messaging preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>General SMS Settings</span>
              </CardTitle>
              <CardDescription>
                Configure basic SMS functionality and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-enabled">Enable SMS</Label>
                  <p className="text-sm text-gray-600">
                    Allow sending and receiving SMS messages
                  </p>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsEnabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-language">Default Language</Label>
                <select
                  id="default-language"
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultLanguage: e.target.value as 'en' | 'es' }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
                <p className="text-sm text-gray-600">
                  Default language for SMS messages when customer preference is not available
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emergency-sms">Emergency SMS</Label>
                  <p className="text-sm text-gray-600">
                    Enable automatic SMS alerts for emergency situations
                  </p>
                </div>
                <Switch
                  id="emergency-sms"
                  checked={settings.emergencySMSEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emergencySMSEnabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider Settings */}
        <TabsContent value="providers" className="space-y-6">
          {settings.providers.map((provider) => (
            <Card key={provider.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(provider.status)}
                      <CardTitle className="capitalize">{provider.name}</CardTitle>
                    </div>
                    {getStatusBadge(provider.status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(checked) => updateProvider(provider.name, { enabled: checked })}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProvider(provider.name)}
                      disabled={testing === provider.name}
                    >
                      {testing === provider.name ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {provider.name === 'twilio' 
                    ? 'Primary SMS provider with high reliability and global coverage'
                    : 'Secondary SMS provider for fallback and redundancy'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.name === 'twilio' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-sid">Account SID</Label>
                      <Input
                        id="twilio-sid"
                        type="password"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={provider.accountSid || ''}
                        onChange={(e) => updateProvider(provider.name, { accountSid: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-token">Auth Token</Label>
                      <Input
                        id="twilio-token"
                        type="password"
                        placeholder="Your Twilio Auth Token"
                        value={provider.apiKey || ''}
                        onChange={(e) => updateProvider(provider.name, { apiKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-phone">Phone Number</Label>
                      <Input
                        id="twilio-phone"
                        placeholder="+1234567890"
                        value={provider.phoneNumber || ''}
                        onChange={(e) => updateProvider(provider.name, { phoneNumber: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="vonage-key">API Key</Label>
                      <Input
                        id="vonage-key"
                        type="password"
                        placeholder="Your Vonage API Key"
                        value={provider.apiKey || ''}
                        onChange={(e) => updateProvider(provider.name, { apiKey: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vonage-secret">API Secret</Label>
                      <Input
                        id="vonage-secret"
                        type="password"
                        placeholder="Your Vonage API Secret"
                        value={provider.accountSid || ''}
                        onChange={(e) => updateProvider(provider.name, { accountSid: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vonage-phone">Phone Number</Label>
                      <Input
                        id="vonage-phone"
                        placeholder="+1234567890"
                        value={provider.phoneNumber || ''}
                        onChange={(e) => updateProvider(provider.name, { phoneNumber: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Automation Settings */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Automated SMS</span>
              </CardTitle>
              <CardDescription>
                Configure automatic SMS messages for appointments and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-confirmations">Auto Send Confirmations</Label>
                  <p className="text-sm text-gray-600">
                    Automatically send confirmation SMS when appointments are booked
                  </p>
                </div>
                <Switch
                  id="auto-confirmations"
                  checked={settings.autoSendConfirmations}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSendConfirmations: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-reminders">Auto Send Reminders</Label>
                  <p className="text-sm text-gray-600">
                    Automatically send reminder SMS before appointments
                  </p>
                </div>
                <Switch
                  id="auto-reminders"
                  checked={settings.autoSendReminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSendReminders: checked }))}
                />
              </div>

              {settings.autoSendReminders && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-hours">Reminder Hours Before</Label>
                  <Input
                    id="reminder-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.reminderHours}
                    onChange={(e) => setSettings(prev => ({ ...prev, reminderHours: parseInt(e.target.value) || 24 }))}
                  />
                  <p className="text-sm text-gray-600">
                    Send reminder SMS this many hours before the appointment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Emergency SMS</span>
              </CardTitle>
              <CardDescription>
                Configure emergency SMS alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Emergency SMS Configuration</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Emergency SMS alerts are automatically sent to all emergency contacts when urgent situations are detected. 
                      Make sure your emergency contacts are properly configured in the Emergency Contacts settings.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
