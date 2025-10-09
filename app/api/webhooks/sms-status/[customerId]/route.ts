// API Route: SMS Status Webhook
// Task 2.3: SMS-Integrated Webhook Handler

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface SMSStatusData {
  MessageSid: string
  MessageStatus: 'sent' | 'delivered' | 'failed' | 'undelivered'
  To: string
  From: string
  ErrorCode?: string
  ErrorMessage?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const smsStatus: SMSStatusData = await request.json()

    console.log(`📱 SMS status update for customer ${customerId}: ${smsStatus.MessageStatus}`)

    // Validate required fields
    if (!smsStatus.MessageSid || !smsStatus.MessageStatus) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: MessageSid, MessageStatus'
      }, { status: 400 })
    }

    // Update SMS status in database
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('sms_communications')
      .update({
        status: smsStatus.MessageStatus,
        delivered_at: smsStatus.MessageStatus === 'delivered' ? new Date().toISOString() : null,
        error_message: smsStatus.ErrorMessage || null,
        updated_at: new Date().toISOString()
      })
      .eq('external_message_id', smsStatus.MessageSid)

    if (error) {
      console.error('Error updating SMS status:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update SMS status'
      }, { status: 500 })
    }

    // Log status update
    console.log(`✅ SMS status updated: ${smsStatus.MessageSid} -> ${smsStatus.MessageStatus}`)

    return NextResponse.json({
      success: true,
      message: 'SMS status updated successfully'
    })

  } catch (error) {
    console.error('Error processing SMS status webhook:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'

    console.log(`📊 Getting SMS status for customer ${customerId}`)

    // Get SMS communications for customer
    const supabase = await createServerClient()
    
    const { data: smsCommunications, error } = await supabase
      .from('sms_communications')
      .select(`
        id,
        phone_number,
        message_type,
        direction,
        language_code,
        status,
        sent_at,
        delivered_at,
        error_message,
        created_at
      `)
      .eq('organization_id', customerId)
      .gte('created_at', new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Calculate statistics
    const stats = {
      totalSent: smsCommunications?.length || 0,
      delivered: smsCommunications?.filter(s => s.status === 'delivered').length || 0,
      failed: smsCommunications?.filter(s => s.status === 'failed').length || 0,
      pending: smsCommunications?.filter(s => s.status === 'sent').length || 0,
      deliveryRate: 0
    }

    if (stats.totalSent > 0) {
      stats.deliveryRate = stats.delivered / stats.totalSent
    }

    return NextResponse.json({
      success: true,
      smsCommunications: smsCommunications || [],
      statistics: stats
    })

  } catch (error) {
    console.error('Error fetching SMS status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch SMS status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}
