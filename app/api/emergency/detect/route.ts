// API Route: Emergency Detection
// Task 2.2: Multi-Language Emergency Detection with SMS Alerts

import { NextRequest, NextResponse } from 'next/server'
import { createEmergencyDetectorFromTemplate } from '@/lib/emergency/multilingual-emergency-detector'
import { createServerClient } from '@/lib/supabase/server'
import type { CallData, CallContext } from '@/lib/emergency/multilingual-emergency-detector'

interface EmergencyDetectionRequest {
  organizationId: string
  industryCode: string
  languagePreference?: 'en' | 'es'
  callData: CallData
  context: CallContext
}

export async function POST(request: NextRequest) {
  try {
    const body: EmergencyDetectionRequest = await request.json()
    const { organizationId, industryCode, languagePreference = 'en', callData, context } = body

    // Validate required fields
    if (!organizationId || !industryCode || !callData || !context) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: organizationId, industryCode, callData, context'
      }, { status: 400 })
    }

    // Validate call data
    if (!callData.transcript || !callData.customerName || !callData.customerPhone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required call data: transcript, customerName, customerPhone'
      }, { status: 400 })
    }

    // Check authentication
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this organization'
      }, { status: 403 })
    }

    // Create emergency detector
    const detector = await createEmergencyDetectorFromTemplate(industryCode, languagePreference)

    // Calculate urgency score
    const result = await detector.calculateUrgencyScore(callData, context)

    // Log emergency event if detected
    if (result.requiresImmediateAttention) {
      await detector.logEmergencyEvent(organizationId, callData, result, context)
    }

    return NextResponse.json({
      success: true,
      result: {
        urgencyScore: result.urgencyScore,
        detectedLanguage: result.detectedLanguage,
        emergencyKeywordsFound: result.emergencyKeywordsFound,
        requiresImmediateAttention: result.requiresImmediateAttention,
        culturalContext: result.culturalContext,
        industryModifiers: result.industryModifiers,
        smsAlertsSent: result.smsAlertsSent,
        timestamp: result.timestamp
      }
    })

  } catch (error) {
    console.error('Error in emergency detection:', error)
    return NextResponse.json({
      success: false,
      error: 'Emergency detection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const timeRange = searchParams.get('timeRange') || '24h'

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organizationId is required'
      }, { status: 400 })
    }

    // Check authentication
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied: Not a member of this organization'
      }, { status: 403 })
    }

    // Get emergency events for organization
    const { data: emergencyEvents, error } = await supabase
      .from('emergency_events')
      .select(`
        id,
        detected_language,
        urgency_score,
        emergency_keywords,
        issue_description,
        customer_phone,
        technician_alert_sent,
        customer_confirmation_sent,
        status,
        created_at
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Calculate statistics
    const stats = {
      totalEvents: emergencyEvents?.length || 0,
      highUrgencyEvents: emergencyEvents?.filter(e => e.urgency_score > 0.7).length || 0,
      smsAlertsSent: emergencyEvents?.filter(e => e.technician_alert_sent).length || 0,
      byLanguage: this.groupByLanguage(emergencyEvents || []),
      byStatus: this.groupByStatus(emergencyEvents || [])
    }

    return NextResponse.json({
      success: true,
      emergencyEvents: emergencyEvents || [],
      statistics: stats
    })

  } catch (error) {
    console.error('Error fetching emergency events:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch emergency events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper methods
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}

function groupByLanguage(events: any[]): Record<string, number> {
  return events.reduce((acc, event) => {
    const lang = event.detected_language || 'unknown'
    acc[lang] = (acc[lang] || 0) + 1
    return acc
  }, {})
}

function groupByStatus(events: any[]): Record<string, number> {
  return events.reduce((acc, event) => {
    const status = event.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
}
