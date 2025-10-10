'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/Badge'
import { 
  Settings, Zap, Mail, MessageSquare, Globe, Shield, 
  Loader2, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrganizationId } from '@/hooks/use-organization-id'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface IntegrationSettings {
  n8n_webhook_url?: string
  email_service_provider?: string
  sms_service_provider?: string
  enable_email_notifications?: boolean
  enable_sms_notifications?: boolean
  enable_webhook_notifications?: boolean
  custom_webhook_url?: string
  api_rate_limit?: number
  enable_audit_logging?: boolean
  enable_analytics?: boolean
}

interface IntegrationConfig {
  id?: string
  organization_id: string
  integration_type: string
  configuration: Record<string, any>
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function AdvancedSettings() {
  const { organizationId, loading: orgLoading } = useOrganizationId()
  const [settings, setSettings] = useState<IntegrationSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchSettings()
    }
  }, [organizationId, orgLoading])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch organization integrations
      const { data: integrationsData, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', organizationId)
      
      if (error) throw error
      
      setIntegrations(integrationsData || [])
      
      // Convert integrations to settings object
      const settingsObj: IntegrationSettings = {}
      integrationsData?.forEach(integration => {
        switch (integration.integration_type) {
          case 'n8n':
            settingsObj.n8n_webhook_url = integration.configuration?.webhook_url
            settingsObj.enable_webhook_notifications = integration.is_active
            break
          case 'email_service':
            settingsObj.email_service_provider = integration.configuration?.provider
            settingsObj.enable_email_notifications = integration.is_active
            break
          case 'sms_service':
            settingsObj.sms_service_provider = integration.configuration?.provider
            settingsObj.enable_sms_notifications = integration.is_active
            break
          case 'custom_webhook':
            settingsObj.custom_webhook_url = integration.configuration?.webhook_url
            break
          case 'api_settings':
            settingsObj.api_rate_limit = integration.configuration?.rate_limit
            settingsObj.enable_audit_logging = integration.configuration?.audit_logging
            settingsObj.enable_analytics = integration.configuration?.analytics
            break
        }
      })
      
      setSettings(settingsObj)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load advanced settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!organizationId) return
    
    setSaving(true)
    
    try {
      const integrationConfigs = [
        {
          integration_type: 'n8n',
          configuration: {
            webhook_url: settings.n8n_webhook_url
          },
          is_active: settings.enable_webhook_notifications || false
        },
        {
          integration_type: 'email_service',
          configuration: {
            provider: settings.email_service_provider || 'default'
          },
          is_active: settings.enable_email_notifications || false
        },
        {
          integration_type: 'sms_service',
          configuration: {
            provider: settings.sms_service_provider || 'default'
          },
          is_active: settings.enable_sms_notifications || false
        },
        {
          integration_type: 'custom_webhook',
          configuration: {
            webhook_url: settings.custom_webhook_url
          },
          is_active: !!settings.custom_webhook_url
        },
        {
          integration_type: 'api_settings',
          configuration: {
            rate_limit: settings.api_rate_limit || 1000,
            audit_logging: settings.enable_audit_logging || false,
            analytics: settings.enable_analytics || false
          },
          is_active: true
        }
      ]

      // Upsert each integration configuration
      for (const config of integrationConfigs) {
        const existingIntegration = integrations.find(
          i => i.integration_type === config.integration_type
        )

        if (existingIntegration) {
          await supabase
            .from('organization_integrations')
            .update({
              configuration: config.configuration,
              is_active: config.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingIntegration.id)
        } else {
          await supabase
            .from('organization_integrations')
            .insert([{
              organization_id: organizationId,
              ...config
            }])
        }
      }
      
      toast.success('Advanced settings saved successfully')
      await fetchSettings() // Refresh data
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save advanced settings')
    } finally {
      setSaving(false)
    }
  }

  const testWebhook = async (webhookUrl: string) => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          organization_id: organizationId
        })
      })
      
      if (response.ok) {
        toast.success('Webhook test successful')
      } else {
        toast.error('Webhook test failed')
      }
    } catch (error) {
      toast.error('Webhook test failed')
    }
  }

  if (loading || orgLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Advanced Settings</CardTitle>
          <CardDescription className="text-slate-400">
            Configure advanced integrations and automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Advanced Settings
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure advanced integrations, automation, and system settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* N8N Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Workflow Automation</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="webhook-notifications"
                checked={settings.enable_webhook_notifications || false}
                onCheckedChange={(checked) => setSettings({...settings, enable_webhook_notifications: checked})}
              />
              <Label htmlFor="webhook-notifications" className="text-slate-300">
                Enable N8N webhook notifications
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="n8n-webhook" className="text-slate-300">N8N Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="n8n-webhook"
                  value={settings.n8n_webhook_url || ''}
                  onChange={(e) => setSettings({...settings, n8n_webhook_url: e.target.value})}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  className="text-slate-300 flex-1"
                />
                {settings.n8n_webhook_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(settings.n8n_webhook_url!)}
                    className="border-slate-600 text-slate-300"
                  >
                    Test
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Custom webhook URL for your organization's automation workflows.
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Email Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="email-notifications"
                checked={settings.enable_email_notifications || false}
                onCheckedChange={(checked) => setSettings({...settings, enable_email_notifications: checked})}
              />
              <Label htmlFor="email-notifications" className="text-slate-300">
                Enable email notifications
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-provider" className="text-slate-300">Email Service Provider</Label>
              <Select
                value={settings.email_service_provider || 'default'}
                onValueChange={(value) => setSettings({...settings, email_service_provider: value})}
              >
                <SelectTrigger className="text-slate-300 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Platform)</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* SMS Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">SMS Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="sms-notifications"
                checked={settings.enable_sms_notifications || false}
                onCheckedChange={(checked) => setSettings({...settings, enable_sms_notifications: checked})}
              />
              <Label htmlFor="sms-notifications" className="text-slate-300">
                Enable SMS notifications
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-provider" className="text-slate-300">SMS Service Provider</Label>
              <Select
                value={settings.sms_service_provider || 'default'}
                onValueChange={(value) => setSettings({...settings, sms_service_provider: value})}
              >
                <SelectTrigger className="text-slate-300 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Platform)</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="messagebird">MessageBird</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Custom Webhook */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Custom Webhook</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-webhook" className="text-slate-300">Custom Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="custom-webhook"
                value={settings.custom_webhook_url || ''}
                onChange={(e) => setSettings({...settings, custom_webhook_url: e.target.value})}
                placeholder="https://your-custom-webhook.com/endpoint"
                className="text-slate-300 flex-1"
              />
              {settings.custom_webhook_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(settings.custom_webhook_url!)}
                  className="border-slate-600 text-slate-300"
                >
                  Test
                </Button>
              )}
            </div>
            <p className="text-sm text-slate-400">
              Custom webhook for external system integrations.
            </p>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* API Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-white">API & Security</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate-limit" className="text-slate-300">API Rate Limit (requests/hour)</Label>
              <Input
                id="rate-limit"
                type="number"
                value={settings.api_rate_limit || 1000}
                onChange={(e) => setSettings({...settings, api_rate_limit: parseInt(e.target.value)})}
                className="text-slate-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="audit-logging"
                checked={settings.enable_audit_logging || false}
                onCheckedChange={(checked) => setSettings({...settings, enable_audit_logging: checked})}
              />
              <Label htmlFor="audit-logging" className="text-slate-300">
                Enable audit logging
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="analytics"
                checked={settings.enable_analytics || false}
                onCheckedChange={(checked) => setSettings({...settings, enable_analytics: checked})}
              />
              <Label htmlFor="analytics" className="text-slate-300">
                Enable analytics tracking
              </Label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Save Advanced Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
