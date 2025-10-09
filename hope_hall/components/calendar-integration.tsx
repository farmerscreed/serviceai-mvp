"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { CalendarEvent, IntegrationStatus } from '@/lib/oauth/types';
import { CalendarSyncService } from '@/lib/calendar/sync-service';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { OutlookCalendarService } from '@/lib/calendar/outlook-calendar';

interface CalendarIntegrationProps {
  organizationId: string;
}

export function CalendarIntegration({ organizationId }: CalendarIntegrationProps) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadIntegrationStatus();
    loadCalendarEvents();
    loadConflicts();
  }, [organizationId]);

  const loadIntegrationStatus = async () => {
    try {
      // This would fetch from your API
      const mockIntegrations: IntegrationStatus[] = [
        {
          provider: 'google',
          isConnected: false,
          lastSync: null,
          syncStatus: 'pending'
        },
        {
          provider: 'outlook',
          isConnected: false,
          lastSync: null,
          syncStatus: 'pending'
        }
      ];
      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Failed to load integration status:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      // This would use CalendarSyncService
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Smith Wedding - Tour',
          description: 'Venue tour for Sarah & John Smith',
          start: new Date('2025-01-25T14:00:00'),
          end: new Date('2025-01-25T15:00:00'),
          location: 'Hope Hall',
          attendees: ['sarah.smith@email.com'],
          status: 'confirmed',
          source: 'internal'
        },
        {
          id: '2',
          title: 'Johnson Anniversary Party',
          description: '50th Anniversary celebration',
          start: new Date('2025-01-26T18:00:00'),
          end: new Date('2025-01-27T00:00:00'),
          location: 'Hope Hall',
          attendees: ['johnson@email.com'],
          status: 'confirmed',
          source: 'internal'
        }
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConflicts = async () => {
    try {
      // This would fetch sync conflicts
      const mockConflicts = [
        {
          id: '1',
          type: 'calendar',
          description: 'External meeting conflicts with Smith Wedding tour',
          localData: { title: 'Smith Wedding - Tour', start: '2025-01-25T14:00:00' },
          remoteData: { title: 'Team Meeting', start: '2025-01-25T14:30:00' },
          resolution: 'manual'
        }
      ];
      setConflicts(mockConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      // Redirect to OAuth flow
      const authUrl = `/api/oauth/${provider}/auth`;
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      // Call API to disconnect
      await fetch(`/api/oauth/${provider}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      
      // Refresh integration status
      loadIntegrationStatus();
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Trigger sync for all connected providers
      await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      
      // Refresh data
      loadIntegrationStatus();
      loadCalendarEvents();
      loadConflicts();
    } catch (error) {
      console.error('Failed to sync calendars:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'internal': return 'bg-blue-500';
      case 'google': return 'bg-green-500';
      case 'outlook': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calendar Integrations
          </CardTitle>
          <CardDescription>
            Connect your external calendars for two-way synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.provider} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.syncStatus)}`} />
                <div>
                  <h3 className="font-medium capitalize">{integration.provider} Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    {integration.isConnected ? (
                      <>
                        Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                        {integration.tokenExpiry && (
                          <span className="ml-2">
                            • Expires: {new Date(integration.tokenExpiry).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    ) : (
                      'Not connected'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={integration.isConnected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleConnect(integration.provider);
                    } else {
                      handleDisconnect(integration.provider);
                    }
                  }}
                />
                {integration.isConnected && (
                  <Badge variant={integration.syncStatus === 'success' ? 'default' : 'destructive'}>
                    {integration.syncStatus}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Conflicts */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Sync Conflicts ({conflicts.length})
            </CardTitle>
            <CardDescription>
              Resolve conflicts between internal bookings and external calendar events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{conflict.description}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Internal:</span> {conflict.localData.title}
                        </div>
                        <div>
                          <span className="font-medium">External:</span> {conflict.remoteData.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Keep Internal
                      </Button>
                      <Button size="sm" variant="outline">
                        Use External
                      </Button>
                      <Button size="sm">
                        Resolve Manually
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Unified Calendar View
          </CardTitle>
          <CardDescription>
            All events from internal bookings and external calendars
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No events found. Connect your calendars to see all events.
              </p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getSourceColor(event.source)}`} />
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start.toLocaleString()}
                        </span>
                        <span>
                          {event.location}
                        </span>
                        <span>
                          {event.attendees?.length || 0} attendee(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {event.source}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 