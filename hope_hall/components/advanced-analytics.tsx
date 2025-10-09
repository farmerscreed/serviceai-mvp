"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Target,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { BookingTrend } from '@/lib/oauth/types';

interface AdvancedAnalyticsProps {
  organizationId: string;
}

interface ForecastData {
  timeframe: 'month' | 'quarter' | 'year';
  predicted: number;
  confidence: number;
  factors: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit?: string;
}

interface LeadSourceAnalysis {
  source: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  costPerLead: number;
  roi: number;
}

export function AdvancedAnalytics({ organizationId }: AdvancedAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [trends, setTrends] = useState<BookingTrend[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [organizationId, selectedTimeframe]);

  const loadAnalyticsData = async () => {
    try {
      // Mock data - in production, this would call your API
      const mockForecast: ForecastData = {
        timeframe: selectedTimeframe,
        predicted: selectedTimeframe === 'month' ? 45000 : selectedTimeframe === 'quarter' ? 135000 : 540000,
        confidence: 0.85,
        factors: [
          'Based on 24 historical bookings',
          'Seasonal adjustment: 120%',
          'Trend: increasing',
          'Lead quality improving'
        ],
        trend: 'increasing'
      };

      const mockMetrics: PerformanceMetric[] = [
        {
          name: 'Conversion Rate',
          value: 35,
          change: 12,
          trend: 'up',
          target: 40,
          unit: '%'
        },
        {
          name: 'Average Deal Size',
          value: 3200,
          change: 8,
          trend: 'up',
          target: 3500,
          unit: '$'
        },
        {
          name: 'Lead Response Time',
          value: 2.5,
          change: -25,
          trend: 'up',
          target: 2,
          unit: 'hours'
        },
        {
          name: 'Tour-to-Booking Rate',
          value: 68,
          change: 15,
          trend: 'up',
          target: 70,
          unit: '%'
        },
        {
          name: 'Customer Satisfaction',
          value: 4.8,
          change: 4,
          trend: 'up',
          target: 4.9,
          unit: '/5'
        },
        {
          name: 'Revenue per Lead',
          value: 1120,
          change: 22,
          trend: 'up',
          target: 1200,
          unit: '$'
        }
      ];

      const mockTrends: BookingTrend[] = [
        {
          period: 'Monthly',
          metric: 'Revenue',
          value: 42000,
          change: 18,
          trend: 'up',
          significance: 'high'
        },
        {
          period: 'Monthly',
          metric: 'Bookings',
          value: 14,
          change: 12,
          trend: 'up',
          significance: 'medium'
        },
        {
          period: 'Monthly',
          metric: 'Lead Volume',
          value: 85,
          change: 25,
          trend: 'up',
          significance: 'high'
        },
        {
          period: 'Monthly',
          metric: 'Average Event Size',
          value: 125,
          change: -5,
          trend: 'down',
          significance: 'low'
        }
      ];

      const mockLeadSources: LeadSourceAnalysis[] = [
        {
          source: 'Referrals',
          leads: 25,
          conversions: 18,
          conversionRate: 72,
          revenue: 54000,
          costPerLead: 0,
          roi: Infinity
        },
        {
          source: 'Google Ads',
          leads: 45,
          conversions: 12,
          conversionRate: 27,
          revenue: 36000,
          costPerLead: 85,
          roi: 842
        },
        {
          source: 'Facebook',
          leads: 32,
          conversions: 8,
          conversionRate: 25,
          revenue: 24000,
          costPerLead: 45,
          roi: 1567
        },
        {
          source: 'Website',
          leads: 28,
          conversions: 10,
          conversionRate: 36,
          revenue: 30000,
          costPerLead: 25,
          roi: 4186
        },
        {
          source: 'Instagram',
          leads: 18,
          conversions: 4,
          conversionRate: 22,
          revenue: 12000,
          costPerLead: 35,
          roi: 1829
        }
      ];

      setForecastData(mockForecast);
      setPerformanceMetrics(mockMetrics);
      setTrends(mockTrends);
      setLeadSources(mockLeadSources);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMetricStatus = (metric: PerformanceMetric) => {
    if (!metric.target) return 'neutral';
    
    if (metric.name === 'Lead Response Time') {
      return metric.value <= metric.target ? 'good' : 'warning';
    }
    
    return metric.value >= metric.target ? 'good' : 'warning';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'danger': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'danger': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Advanced Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights and revenue forecasting
          </p>
        </div>
        <Select value={selectedTimeframe} onValueChange={(value: string) => setSelectedTimeframe(value as "year" | "month" | "quarter")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          {forecastData && (
            <>
              {/* Forecast Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Revenue Forecast - {selectedTimeframe}
                  </CardTitle>
                  <CardDescription>
                    AI-powered revenue prediction with {Math.round(forecastData.confidence * 100)}% confidence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Predicted Revenue</span>
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                          ${forecastData.predicted.toLocaleString()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">Trend</span>
                        </div>
                        <Badge variant={forecastData.trend === 'increasing' ? 'default' : 'secondary'}>
                          {forecastData.trend}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium">Confidence</span>
                        </div>
                        <div className="text-xl font-bold">
                          {Math.round(forecastData.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Forecast Factors</h4>
                      <div className="space-y-2">
                        {forecastData.factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Forecast Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Historical data and future projections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Revenue trend chart would be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((metric, index) => {
              const status = getMetricStatus(metric);
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{metric.name}</h3>
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">
                          {metric.unit === '$' && '$'}{metric.value.toLocaleString()}
                          {metric.unit && metric.unit !== '$' && metric.unit}
                        </span>
                        <div className={`flex items-center gap-1 text-sm ${getTrendColor(metric.trend)}`}>
                          {getTrendIcon(metric.trend)}
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </div>
                      </div>
                      
                      {metric.target && (
                        <div className="text-xs text-muted-foreground">
                          Target: {metric.unit === '$' && '$'}{metric.target.toLocaleString()}{metric.unit && metric.unit !== '$' && metric.unit}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business Trends
              </CardTitle>
              <CardDescription>
                Key performance indicators and their trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{trend.metric}</h4>
                      <p className="text-sm text-muted-foreground">{trend.period}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {trend.metric === 'Revenue' && '$'}{trend.value.toLocaleString()}
                        {trend.metric.includes('Rate') && '%'}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend.trend)}`}>
                        {getTrendIcon(trend.trend)}
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </div>
                    </div>
                    <Badge variant={
                      trend.significance === 'high' ? 'default' : 
                      trend.significance === 'medium' ? 'secondary' : 'outline'
                    }>
                      {trend.significance}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lead Source Analysis
              </CardTitle>
              <CardDescription>
                Performance analysis by lead source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadSources.map((source, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{source.source}</h4>
                      <Badge variant="outline">{source.leads} leads</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Conversions</div>
                        <div className="font-bold">{source.conversions}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Conversion Rate</div>
                        <div className="font-bold">{source.conversionRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-bold">${source.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">ROI</div>
                        <div className="font-bold">
                          {source.roi === Infinity ? '∞' : `${source.roi}%`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      Cost per lead: ${source.costPerLead} • 
                      Revenue per lead: ${Math.round(source.revenue / source.leads)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 