"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';
import { LeadScoringResult, BookingTrend } from '@/lib/oauth/types';

interface AILeadScoringProps {
  organizationId: string;
}

interface LeadWithScore {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  budget: number;
  aiScore: number;
  aiCategory: 'HOT' | 'WARM' | 'COOL';
  conversionProbability: number;
  aiFactors: {
    positive: string[];
    negative: string[];
  };
  recommendedActions: string[];
  createdAt: string;
}

export function AILeadScoring({ organizationId }: AILeadScoringProps) {
  const [leads, setLeads] = useState<LeadWithScore[]>([]);
  const [trends, setTrends] = useState<BookingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithScore | null>(null);

  useEffect(() => {
    loadLeadsWithScores();
    loadTrends();
  }, [organizationId]);

  const loadLeadsWithScores = async () => {
    try {
      // This would fetch from your API with AI scores
      const mockLeads: LeadWithScore[] = [
        {
          id: '1',
          name: 'Sarah & John Smith',
          email: 'sarah.smith@email.com',
          phone: '(555) 123-4567',
          source: 'referral',
          eventType: 'Wedding',
          eventDate: '2025-06-15',
          guestCount: 150,
          budget: 5000,
          aiScore: 85,
          aiCategory: 'HOT',
          conversionProbability: 0.89,
          aiFactors: {
            positive: ['High budget', 'Referral source', 'Peak wedding season', 'Fast response time'],
            negative: []
          },
          recommendedActions: [
            'Schedule venue tour within 24 hours',
            'Send personalized pricing proposal',
            'Follow up with phone call'
          ],
          createdAt: '2025-01-20T10:00:00Z'
        },
        {
          id: '2',
          name: 'Michael Johnson',
          email: 'michael.j@email.com',
          phone: '(555) 987-6543',
          source: 'google',
          eventType: 'Corporate Event',
          eventDate: '2025-03-20',
          guestCount: 80,
          budget: 2500,
          aiScore: 68,
          aiCategory: 'WARM',
          conversionProbability: 0.72,
          aiFactors: {
            positive: ['Good budget', 'Medium-sized event', 'Google search source'],
            negative: ['Slower response time']
          },
          recommendedActions: [
            'Send detailed venue information',
            'Schedule follow-up call within 48 hours',
            'Add to nurture email sequence'
          ],
          createdAt: '2025-01-19T14:30:00Z'
        },
        {
          id: '3',
          name: 'Emily Davis',
          email: 'emily.davis@email.com',
          phone: '(555) 456-7890',
          source: 'facebook',
          eventType: 'Birthday Party',
          eventDate: '2025-12-01',
          guestCount: 40,
          budget: 800,
          aiScore: 42,
          aiCategory: 'COOL',
          conversionProbability: 0.35,
          aiFactors: {
            positive: ['Social media engagement'],
            negative: ['Low budget', 'Small event', 'Event far in future']
          },
          recommendedActions: [
            'Add to general newsletter',
            'Schedule follow-up in 1 week',
            'Send educational content about venue'
          ],
          createdAt: '2025-01-18T16:45:00Z'
        }
      ];
      setLeads(mockLeads);
    } catch (error) {
      console.error('Failed to load leads with scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      const mockTrends: BookingTrend[] = [
        {
          period: 'Monthly',
          metric: 'Conversion Rate',
          value: 35,
          change: 12,
          trend: 'up',
          significance: 'high'
        },
        {
          period: 'Monthly',
          metric: 'Average Lead Score',
          value: 68,
          change: 5,
          trend: 'up',
          significance: 'medium'
        },
        {
          period: 'Monthly',
          metric: 'Hot Leads',
          value: 15,
          change: 8,
          trend: 'up',
          significance: 'high'
        }
      ];
      setTrends(mockTrends);
    } catch (error) {
      console.error('Failed to load trends:', error);
    }
  };

  const handleRescoreAll = async () => {
    setRescoring(true);
    try {
      // Call API to rescore all leads
      await fetch('/api/ai/rescore-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      
      // Reload leads with new scores
      loadLeadsWithScores();
    } catch (error) {
      console.error('Failed to rescore leads:', error);
    } finally {
      setRescoring(false);
    }
  };

  const handleRescoreLead = async (leadId: string) => {
    try {
      // Call API to rescore individual lead
      await fetch(`/api/ai/rescore-lead/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      
      // Reload leads
      loadLeadsWithScores();
    } catch (error) {
      console.error('Failed to rescore lead:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HOT': return 'bg-red-500';
      case 'WARM': return 'bg-yellow-500';
      case 'COOL': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'HOT': return 'text-red-700 bg-red-100';
      case 'WARM': return 'text-yellow-700 bg-yellow-100';
      case 'COOL': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
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
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Lead Scoring
          </h2>
          <p className="text-muted-foreground">
            AI-powered lead scoring and conversion predictions
          </p>
        </div>
        <Button onClick={handleRescoreAll} disabled={rescoring}>
          {rescoring ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Rescoring...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rescore All
            </>
          )}
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trends.map((trend, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{trend.metric}</p>
                  <p className="text-2xl font-bold">{trend.value}{trend.metric.includes('Rate') ? '%' : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(trend.trend)}
                  <span className={`text-sm ${trend.trend === 'up' ? 'text-green-500' : trend.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Lead Scores</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Scoring Results
              </CardTitle>
              <CardDescription>
                AI-powered scoring with conversion probability and recommended actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{lead.name}</h3>
                          <Badge className={getCategoryTextColor(lead.aiCategory)}>
                            {lead.aiCategory}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(lead.conversionProbability * 100)}% conversion
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div>Email: {lead.email}</div>
                          <div>Event: {lead.eventType}</div>
                          <div>Date: {new Date(lead.eventDate).toLocaleDateString()}</div>
                          <div>Guests: {lead.guestCount}</div>
                          <div>Budget: ${lead.budget.toLocaleString()}</div>
                          <div>Source: {lead.source}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">AI Score:</span>
                            <div className="flex-1 max-w-xs">
                              <Progress value={lead.aiScore} className="h-2" />
                            </div>
                            <span className={`text-sm font-bold ${getScoreColor(lead.aiScore)}`}>
                              {lead.aiScore}/100
                            </span>
                          </div>
                          
                          {lead.aiFactors.positive.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-green-600">Positive:</span>
                              <div className="flex flex-wrap gap-1">
                                {lead.aiFactors.positive.map((factor, index) => (
                                  <Badge key={index} variant="outline" className="text-xs text-green-600">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {lead.aiFactors.negative.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-red-600">Negative:</span>
                              <div className="flex flex-wrap gap-1">
                                {lead.aiFactors.negative.map((factor, index) => (
                                  <Badge key={index} variant="outline" className="text-xs text-red-600">
                                    {factor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedLead(lead)}
                          className="whitespace-nowrap"
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRescoreLead(lead.id)}
                          className="whitespace-nowrap"
                        >
                          Rescore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Machine learning insights about your lead patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Lead Quality Trends</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your lead quality has improved by 12% this month. Referral sources are performing 40% better than social media leads.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Conversion Patterns</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Leads with budgets above $3,000 have an 85% conversion rate. Weekend events show 25% higher conversion rates.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Seasonal Insights</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    June and October bookings are 60% more likely to convert. Consider premium pricing for these peak months.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Personalized recommendations to improve lead conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.filter(lead => lead.recommendedActions.length > 0).map((lead) => (
                  <div key={lead.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium">{lead.name}</h4>
                      <Badge className={getCategoryTextColor(lead.aiCategory)}>
                        {lead.aiCategory}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {lead.recommendedActions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedLead.name} - AI Analysis</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>Email: {selectedLead.email}</div>
                    <div>Phone: {selectedLead.phone}</div>
                    <div>Source: {selectedLead.source}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Event Details</h4>
                  <div className="space-y-1 text-sm">
                    <div>Type: {selectedLead.eventType}</div>
                    <div>Date: {new Date(selectedLead.eventDate).toLocaleDateString()}</div>
                    <div>Guests: {selectedLead.guestCount}</div>
                    <div>Budget: ${selectedLead.budget.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">AI Scoring Results</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Score:</span>
                    <Progress value={selectedLead.aiScore} className="flex-1" />
                    <span className={`font-bold ${getScoreColor(selectedLead.aiScore)}`}>
                      {selectedLead.aiScore}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Conversion Probability:</span>
                    <span className="font-bold">
                      {Math.round(selectedLead.conversionProbability * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Category:</span>
                    <Badge className={getCategoryTextColor(selectedLead.aiCategory)}>
                      {selectedLead.aiCategory}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Recommended Actions</h4>
                <div className="space-y-2">
                  {selectedLead.recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 