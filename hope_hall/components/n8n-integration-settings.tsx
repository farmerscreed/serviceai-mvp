'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/use-organization';
import { supabase } from '@/lib/supabase';
import { 
  Webhook, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Settings
} from 'lucide-react';

interface N8NIntegration {
  id?: string;
  organization_id: string;
  integration_type: 'n8n';
  configuration: {
    webhook_url: string;
    webhook_name?: string;
    description?: string;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function N8NIntegrationSettings() {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [integration, setIntegration] = useState<N8NIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    if (organization?.id) {
      loadIntegration();
    }
  }, [organization?.id]);

  const loadIntegration = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('integration_type', 'n8n')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading N8N integration:', error);
        toast({
          title: 'Error',
          description: 'Failed to load N8N integration settings.',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setIntegration(data);
      } else {
        // Create default integration
        setIntegration({
          organization_id: organization.id,
          integration_type: 'n8n',
          configuration: {
            webhook_url: '',
            webhook_name: `${organization.name} N8N Webhook`,
            description: 'VAPI call enrichment webhook'
          },
          is_active: false
        });
      }
    } catch (error) {
      console.error('Error loading integration:', error);
    }
  };

  const saveIntegration = async () => {
    if (!organization?.id || !integration) return;

    setIsLoading(true);
    try {
      const payload = {
        organization_id: organization.id,
        integration_type: 'n8n' as const,
        configuration: integration.configuration,
        is_active: integration.is_active
      };

      let result;
      if (integration.id) {
        // Update existing
        result = await supabase
          .from('organization_integrations')
          .update(payload)
          .eq('id', integration.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('organization_integrations')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setIntegration(result.data);
      toast({
        title: 'Success',
        description: 'N8N integration settings saved successfully.',
      });
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save N8N integration settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async () => {
    if (!integration?.configuration.webhook_url) {
      toast({
        title: 'Error',
        description: 'Please enter a webhook URL first.',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const testPayload = {
        test: true,
        organization_id: organization?.id,
        message: 'This is a test webhook call from Hope Hall VAPI integration',
        timestamp: new Date().toISOString(),
        test_data: {
          call_id: 'test-call-123',
          caller_phone: '+1234567890',
          transcript: 'Test call transcript',
          call_duration: 120,
          enrichment_type: 'test'
        }
      };

      const response = await fetch(integration.configuration.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      const result = {
        success: response.ok,
        message: response.ok 
          ? 'Webhook test successful! Check your N8N workflow for the test data.'
          : `Webhook test failed: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString()
      };

      setTestResult(result);
      
      if (result.success) {
        toast({
          title: 'Test Successful',
          description: 'Webhook test completed successfully.',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const result = {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setTestResult(result);
      toast({
        title: 'Test Failed',
        description: result.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    if (integration?.configuration.webhook_url) {
      navigator.clipboard.writeText(integration.configuration.webhook_url);
      toast({
        title: 'Copied',
        description: 'Webhook URL copied to clipboard.',
      });
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading organization...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          N8N Integration Settings
        </CardTitle>
        <CardDescription>
          Configure organization-specific N8N webhook for VAPI call enrichment and automation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={integration?.is_active ? "default" : "secondary"}>
              {integration?.is_active ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {integration?.is_active 
                ? "Webhook will receive VAPI call data"
                : "Webhook is disabled"
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={integration?.is_active || false}
              onCheckedChange={(checked) => 
                setIntegration(prev => prev ? { ...prev, is_active: checked } : null)
              }
            />
            <Label className="text-sm">Enable Integration</Label>
          </div>
        </div>

        <Separator />

        {/* Webhook Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="webhook-name">Webhook Name</Label>
            <Input
              id="webhook-name"
              value={integration?.configuration.webhook_name || ''}
              onChange={(e) => 
                setIntegration(prev => prev ? {
                  ...prev,
                  configuration: {
                    ...prev.configuration,
                    webhook_name: e.target.value
                  }
                } : null)
              }
              placeholder="My Organization N8N Webhook"
            />
          </div>

          <div>
            <Label htmlFor="webhook-url">Webhook URL *</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={integration?.configuration.webhook_url || ''}
                onChange={(e) => 
                  setIntegration(prev => prev ? {
                    ...prev,
                    configuration: {
                      ...prev.configuration,
                      webhook_url: e.target.value
                    }
                  } : null)
                }
                placeholder="https://your-n8n-instance.com/webhook/vapi-enrichment"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyWebhookUrl}
                disabled={!integration?.configuration.webhook_url}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This webhook will receive VAPI call data for enrichment and automation.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={integration?.configuration.description || ''}
              onChange={(e) => 
                setIntegration(prev => prev ? {
                  ...prev,
                  configuration: {
                    ...prev.configuration,
                    description: e.target.value
                  }
                } : null)
              }
              placeholder="Optional description of this webhook's purpose"
            />
          </div>
        </div>

        <Separator />

        {/* Test Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Test Webhook</h4>
              <p className="text-sm text-muted-foreground">
                Send a test payload to verify your N8N webhook is working correctly.
              </p>
            </div>
            <Button
              onClick={testWebhook}
              disabled={isTesting || !integration?.configuration.webhook_url}
              variant="outline"
              size="sm"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Webhook'}
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {testResult.message}
                  </AlertDescription>
                  {testResult.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Tested at: {new Date(testResult.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Documentation */}
        <div className="space-y-3">
          <h4 className="font-medium">Integration Details</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Payload Format:</strong> The webhook receives JSON data containing call information, 
              lead data, and organization context for enrichment and automation.
            </p>
            <p>
              <strong>Expected Response:</strong> Your N8N workflow should return a 200 status code 
              to confirm successful processing.
            </p>
            <p>
              <strong>Fallback:</strong> If no organization-specific webhook is configured, 
              the system will use the default webhook URL.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveIntegration}
            disabled={isLoading || !integration?.configuration.webhook_url}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 