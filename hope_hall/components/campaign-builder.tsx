"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause, 
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Campaign, CampaignStep, CampaignAnalytics, EmailTemplate, SMSTemplate } from '@/lib/oauth/types';

interface CampaignBuilderProps {
  organizationId: string;
}

export function CampaignBuilder({ organizationId }: CampaignBuilderProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, CampaignAnalytics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
    loadAnalytics();
  }, [organizationId]);

  const loadCampaigns = async () => {
    try {
      // Mock campaigns data
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Lead Nurturing Sequence',
          description: 'Automated follow-up sequence for new leads',
          steps: [
            {
              id: 'welcome',
              type: 'email',
              trigger: 'immediate',
              content: {
                subject: 'Welcome to Hope Hall - Let\'s Plan Your Perfect {{eventType}}!',
                htmlContent: '<h2>Hi {{firstName}}!</h2><p>Thank you for your interest in Hope Hall...</p>',
                textContent: 'Hi {{firstName}}! Thank you for your interest in Hope Hall...',
                variables: ['firstName', 'eventType']
              }
            },
            {
              id: 'follow_up_1',
              type: 'email',
              trigger: 'delay',
              delay: 48,
              content: {
                subject: 'Hope Hall Tour - Perfect for Your {{eventType}}',
                htmlContent: '<h2>Hi {{firstName}},</h2><p>I wanted to follow up...</p>',
                textContent: 'Hi {{firstName}}, I wanted to follow up...',
                variables: ['firstName', 'eventType']
              }
            },
            {
              id: 'wait_step',
              type: 'wait',
              trigger: 'delay',
              delay: 24
            },
            {
              id: 'pricing_info',
              type: 'email',
              trigger: 'immediate',
              content: {
                subject: 'Hope Hall Pricing & Packages',
                htmlContent: '<h2>Hi {{firstName}},</h2><p>Here\'s your custom pricing...</p>',
                textContent: 'Hi {{firstName}}, Here\'s your custom pricing...',
                variables: ['firstName', 'eventType', 'guestCount']
              }
            }
          ],
          triggers: [
            {
              event: 'lead_created',
              conditions: { source: 'website' }
            }
          ],
          isActive: true,
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-20')
        },
        {
          id: '2',
          name: 'Tour Follow-Up',
          description: 'Follow-up sequence after venue tour',
          steps: [
            {
              id: 'tour_thanks',
              type: 'email',
              trigger: 'immediate',
              content: {
                subject: 'Thank you for visiting Hope Hall!',
                htmlContent: '<h2>Hi {{firstName}},</h2><p>It was wonderful meeting you...</p>',
                textContent: 'Hi {{firstName}}, It was wonderful meeting you...',
                variables: ['firstName', 'eventType']
              }
            },
            {
              id: 'booking_reminder',
              type: 'sms',
              trigger: 'delay',
              delay: 24,
              content: {
                message: 'Hi {{firstName}}, your {{eventDate}} date is still available at Hope Hall! Call us to book: (555) 123-4567',
                variables: ['firstName', 'eventDate']
              }
            }
          ],
          triggers: [
            {
              event: 'tour_scheduled'
            }
          ],
          isActive: true,
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-18')
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Mock analytics data
      const mockAnalytics: Record<string, CampaignAnalytics> = {
        '1': {
          totalSent: 150,
          totalOpened: 120,
          totalClicked: 45,
          totalConverted: 18,
          openRate: 80,
          clickRate: 37.5,
          conversionRate: 12,
          revenue: 54000,
          roi: 540
        },
        '2': {
          totalSent: 85,
          totalOpened: 75,
          totalClicked: 28,
          totalConverted: 12,
          openRate: 88.2,
          clickRate: 37.3,
          conversionRate: 14.1,
          revenue: 36000,
          roi: 360
        }
      };
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: 'New Campaign',
      description: 'Campaign description',
      steps: [],
      triggers: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCampaigns([...campaigns, newCampaign]);
    setSelectedCampaign(newCampaign);
  };

  const handleUpdateCampaign = (updatedCampaign: Campaign) => {
    setCampaigns(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    setSelectedCampaign(updatedCampaign);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId));
    if (selectedCampaign?.id === campaignId) {
      setSelectedCampaign(null);
    }
  };

  const handleToggleCampaign = async (campaignId: string, isActive: boolean) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      const updatedCampaign = { ...campaign, isActive };
      handleUpdateCampaign(updatedCampaign);
    }
  };

  const handleAddStep = (type: CampaignStep['type']) => {
    if (!selectedCampaign) return;

    const newStep: CampaignStep = {
      id: `step_${Date.now()}`,
      type,
      trigger: 'immediate',
      ...(type === 'wait' && { delay: 24 }),
      ...(type === 'email' && {
        content: {
          subject: 'Email Subject',
          htmlContent: '<p>Email content...</p>',
          textContent: 'Email content...',
          variables: []
        }
      }),
      ...(type === 'sms' && {
        content: {
          message: 'SMS message...',
          variables: []
        }
      }),
      ...(type === 'task' && {
        taskDescription: 'Task description...'
      })
    };

    const updatedCampaign = {
      ...selectedCampaign,
      steps: [...selectedCampaign.steps, newStep]
    };
    handleUpdateCampaign(updatedCampaign);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<CampaignStep>) => {
    if (!selectedCampaign) return;

    const updatedSteps = selectedCampaign.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    handleUpdateCampaign({
      ...selectedCampaign,
      steps: updatedSteps
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedCampaign) return;

    const updatedSteps = selectedCampaign.steps.filter(step => step.id !== stepId);
    handleUpdateCampaign({
      ...selectedCampaign,
      steps: updatedSteps
    });
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'wait': return <Clock className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      case 'condition': return <AlertCircle className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-green-100 text-green-800';
      case 'wait': return 'bg-yellow-100 text-yellow-800';
      case 'task': return 'bg-purple-100 text-purple-800';
      case 'condition': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Builder</h2>
          <p className="text-muted-foreground">Create and manage automated email campaigns</p>
        </div>
        <Button onClick={handleCreateCampaign}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign List */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Manage your automation campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCampaign?.id === campaign.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{campaign.name}</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={campaign.isActive}
                      onCheckedChange={(checked) => handleToggleCampaign(campaign.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCampaign(campaign.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{campaign.steps.length} steps</span>
                  <Badge variant={campaign.isActive ? 'default' : 'secondary'}>
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {analytics[campaign.id] && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Open Rate: {analytics[campaign.id].openRate}%</span>
                      <span>Conversions: {analytics[campaign.id].totalConverted}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campaign Builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedCampaign ? `Edit: ${selectedCampaign.name}` : 'Select a Campaign'}
            </CardTitle>
            <CardDescription>
              {selectedCampaign ? 'Configure your campaign steps and triggers' : 'Choose a campaign to edit'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCampaign ? (
              <Tabs defaultValue="steps" className="w-full">
                <TabsList>
                  <TabsTrigger value="steps">Steps</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="steps" className="space-y-4">
                  {/* Add Step Buttons */}
                  <div className="flex gap-2 mb-4">
                    <Button size="sm" variant="outline" onClick={() => handleAddStep('email')}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddStep('sms')}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddStep('wait')}>
                      <Clock className="h-3 w-3 mr-1" />
                      Wait
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddStep('task')}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Task
                    </Button>
                  </div>

                  {/* Campaign Steps */}
                  <div className="space-y-3">
                    {selectedCampaign.steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        {index > 0 && (
                          <div className="absolute left-4 -top-3 w-0.5 h-3 bg-gray-300" />
                        )}
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <div className={`p-2 rounded-full ${getStepColor(step.type)}`}>
                            {getStepIcon(step.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium capitalize">{step.type}</h4>
                              {step.delay && (
                                <Badge variant="outline" className="text-xs">
                                  {step.delay}h delay
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.type === 'email' && (step.content as EmailTemplate)?.subject}
                              {step.type === 'sms' && (step.content as SMSTemplate)?.message}
                              {step.type === 'wait' && `Wait ${step.delay} hours`}
                              {step.type === 'task' && step.taskDescription}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit {step.type} Step</DialogTitle>
                                </DialogHeader>
                                <StepEditor
                                  step={step}
                                  onSave={(updatedStep) => handleUpdateStep(step.id, updatedStep)}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStep(step.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Campaign Name</Label>
                      <Input
                        id="name"
                        value={selectedCampaign.name}
                        onChange={(e) => handleUpdateCampaign({
                          ...selectedCampaign,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={selectedCampaign.description}
                        onChange={(e) => handleUpdateCampaign({
                          ...selectedCampaign,
                          description: e.target.value
                        })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={selectedCampaign.isActive}
                        onCheckedChange={(checked) => handleUpdateCampaign({
                          ...selectedCampaign,
                          isActive: checked
                        })}
                      />
                      <Label htmlFor="active">Campaign Active</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  {analytics[selectedCampaign.id] ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{analytics[selectedCampaign.id].totalSent}</div>
                          <div className="text-sm text-muted-foreground">Total Sent</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{analytics[selectedCampaign.id].openRate}%</div>
                          <div className="text-sm text-muted-foreground">Open Rate</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{analytics[selectedCampaign.id].clickRate}%</div>
                          <div className="text-sm text-muted-foreground">Click Rate</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{analytics[selectedCampaign.id].totalConverted}</div>
                          <div className="text-sm text-muted-foreground">Conversions</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">${analytics[selectedCampaign.id].revenue.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{analytics[selectedCampaign.id].roi}%</div>
                          <div className="text-sm text-muted-foreground">ROI</div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No analytics data available yet. Activate the campaign to start collecting data.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a campaign from the left to start editing
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step Editor Component
function StepEditor({ step, onSave }: { step: CampaignStep; onSave: (step: Partial<CampaignStep>) => void }) {
  const [editedStep, setEditedStep] = useState(step);

  const handleSave = () => {
    onSave(editedStep);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="trigger">Trigger</Label>
        <Select
          value={editedStep.trigger}
          onValueChange={(value) => setEditedStep({ ...editedStep, trigger: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate</SelectItem>
            <SelectItem value="delay">Delay</SelectItem>
            <SelectItem value="condition">Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {editedStep.trigger === 'delay' && (
        <div>
          <Label htmlFor="delay">Delay (hours)</Label>
          <Input
            id="delay"
            type="number"
            value={editedStep.delay || 0}
            onChange={(e) => setEditedStep({ ...editedStep, delay: parseInt(e.target.value) })}
          />
        </div>
      )}

      {step.type === 'email' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={(editedStep.content as EmailTemplate)?.subject || ''}
              onChange={(e) => setEditedStep({
                ...editedStep,
                content: { 
                  ...(editedStep.content as EmailTemplate),
                  subject: e.target.value,
                  htmlContent: (editedStep.content as EmailTemplate)?.htmlContent || '',
                  textContent: (editedStep.content as EmailTemplate)?.textContent || '',
                  variables: (editedStep.content as EmailTemplate)?.variables || []
                }
              })}
            />
          </div>
          <div>
            <Label htmlFor="htmlContent">HTML Content</Label>
            <Textarea
              id="htmlContent"
              rows={10}
              value={(editedStep.content as EmailTemplate)?.htmlContent || ''}
              onChange={(e) => setEditedStep({
                ...editedStep,
                content: { 
                  ...(editedStep.content as EmailTemplate),
                  htmlContent: e.target.value,
                  subject: (editedStep.content as EmailTemplate)?.subject || '',
                  textContent: (editedStep.content as EmailTemplate)?.textContent || '',
                  variables: (editedStep.content as EmailTemplate)?.variables || []
                }
              })}
            />
          </div>
        </div>
      )}

      {step.type === 'sms' && (
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={(editedStep.content as SMSTemplate)?.message || ''}
            onChange={(e) => setEditedStep({
              ...editedStep,
              content: { 
                ...(editedStep.content as SMSTemplate),
                message: e.target.value,
                variables: (editedStep.content as SMSTemplate)?.variables || []
              }
            })}
          />
        </div>
      )}

      {step.type === 'task' && (
        <div>
          <Label htmlFor="taskDescription">Task Description</Label>
          <Textarea
            id="taskDescription"
            value={editedStep.taskDescription || ''}
            onChange={(e) => setEditedStep({ ...editedStep, taskDescription: e.target.value })}
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
} 