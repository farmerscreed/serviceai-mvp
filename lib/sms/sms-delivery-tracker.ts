// SMS Delivery Tracker - Task 3.1
// Tracks SMS delivery status and provides analytics

import { createServerClient } from '@/lib/supabase/server'

export interface SMSStatus {
  sent: 'sent'
  delivered: 'delivered'
  failed: 'failed'
  undelivered: 'undelivered'
}

export interface SMSStatistics {
  totalSent: number
  delivered: number
  failed: number
  undelivered: number
  deliveryRate: number
  byLanguage: Record<string, number>
  byTemplate: Record<string, number>
  byTimeRange: Record<string, number>
  averageDeliveryTime: number
}

export interface DeliveryEvent {
  messageId: string
  status: string
  timestamp: string
  errorCode?: string
  errorMessage?: string
}

export class SMSDeliveryTracker {
  // =====================================================
  // Delivery Tracking
  // =====================================================

  /**
   * Track SMS delivery status
   */
  async trackDelivery(
    messageId: string,
    status: string,
    timestamp: string,
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      console.log(`📊 Tracking SMS delivery: ${messageId} -> ${status}`)

      const supabase = await createServerClient()
      
      // Update SMS communication record
      const { error } = await supabase
        .from('sms_communications')
        .update({
          status: status,
          delivered_at: status === 'delivered' ? timestamp : null,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString()
        })
        .eq('external_message_id', messageId)

      if (error) {
        console.error('Error updating SMS delivery status:', error)
        return
      }

      // Log delivery event
      await this.logDeliveryEvent({
        messageId,
        status,
        timestamp,
        errorCode,
        errorMessage
      })

      console.log(`✅ SMS delivery tracked: ${messageId} -> ${status}`)

    } catch (error) {
      console.error('Error tracking SMS delivery:', error)
    }
  }

  /**
   * Get SMS delivery statistics
   */
  async getDeliveryStatistics(
    organizationId: string,
    timeRange: string = '24h'
  ): Promise<SMSStatistics> {
    try {
      console.log(`📊 Getting SMS statistics for ${organizationId} (${timeRange})`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      const { data: smsCommunications, error } = await supabase
        .from('sms_communications')
        .select(`
          status,
          language_code,
          message_type,
          sent_at,
          delivered_at,
          error_message
        `)
        .eq('organization_id', organizationId)
        .gte('sent_at', startTime)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const stats = this.calculateStatistics(smsCommunications || [])
      console.log(`✅ SMS statistics calculated: ${stats.totalSent} total, ${stats.deliveryRate.toFixed(2)}% delivery rate`)

      return stats

    } catch (error) {
      console.error('Error getting SMS statistics:', error)
      return {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        undelivered: 0,
        deliveryRate: 0,
        byLanguage: {},
        byTemplate: {},
        byTimeRange: {},
        averageDeliveryTime: 0
      }
    }
  }

  /**
   * Get delivery performance by template
   */
  async getTemplatePerformance(
    organizationId: string,
    templateKey: string,
    timeRange: string = '7d'
  ): Promise<{
    templateKey: string
    totalSent: number
    deliveryRate: number
    averageDeliveryTime: number
    commonErrors: string[]
  }> {
    try {
      console.log(`📊 Getting template performance: ${templateKey}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      const { data: smsCommunications, error } = await supabase
        .from('sms_communications')
        .select(`
          status,
          sent_at,
          delivered_at,
          error_message
        `)
        .eq('organization_id', organizationId)
        .eq('message_type', templateKey)
        .gte('sent_at', startTime)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const performance = this.calculateTemplatePerformance(smsCommunications || [])
      console.log(`✅ Template performance calculated: ${performance.deliveryRate.toFixed(2)}% delivery rate`)

      return {
        templateKey,
        ...performance
      }

    } catch (error) {
      console.error('Error getting template performance:', error)
      return {
        templateKey,
        totalSent: 0,
        deliveryRate: 0,
        averageDeliveryTime: 0,
        commonErrors: []
      }
    }
  }

  // =====================================================
  // Analytics and Reporting
  // =====================================================

  /**
   * Get delivery trends over time
   */
  async getDeliveryTrends(
    organizationId: string,
    timeRange: string = '7d'
  ): Promise<Array<{
    date: string
    sent: number
    delivered: number
    failed: number
    deliveryRate: number
  }>> {
    try {
      console.log(`📈 Getting delivery trends for ${organizationId}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      const { data: smsCommunications, error } = await supabase
        .from('sms_communications')
        .select(`
          status,
          sent_at,
          delivered_at
        `)
        .eq('organization_id', organizationId)
        .gte('sent_at', startTime)
        .order('sent_at', { ascending: true })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const trends = this.calculateDeliveryTrends(smsCommunications || [])
      console.log(`✅ Delivery trends calculated: ${trends.length} data points`)

      return trends

    } catch (error) {
      console.error('Error getting delivery trends:', error)
      return []
    }
  }

  /**
   * Get language performance comparison
   */
  async getLanguagePerformance(
    organizationId: string,
    timeRange: string = '30d'
  ): Promise<{
    english: SMSStatistics
    spanish: SMSStatistics
    comparison: {
      deliveryRateDifference: number
      averageDeliveryTimeDifference: number
    }
  }> {
    try {
      console.log(`🌍 Getting language performance for ${organizationId}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      // Get English statistics
      const { data: englishSMS, error: englishError } = await supabase
        .from('sms_communications')
        .select(`
          status,
          sent_at,
          delivered_at,
          error_message
        `)
        .eq('organization_id', organizationId)
        .eq('language_code', 'en')
        .gte('sent_at', startTime)

      if (englishError) {
        throw new Error(`Database error: ${englishError.message}`)
      }

      // Get Spanish statistics
      const { data: spanishSMS, error: spanishError } = await supabase
        .from('sms_communications')
        .select(`
          status,
          sent_at,
          delivered_at,
          error_message
        `)
        .eq('organization_id', organizationId)
        .eq('language_code', 'es')
        .gte('sent_at', startTime)

      if (spanishError) {
        throw new Error(`Database error: ${spanishError.message}`)
      }

      const englishStats = this.calculateStatistics(englishSMS || [])
      const spanishStats = this.calculateStatistics(spanishSMS || [])

      const comparison = {
        deliveryRateDifference: spanishStats.deliveryRate - englishStats.deliveryRate,
        averageDeliveryTimeDifference: spanishStats.averageDeliveryTime - englishStats.averageDeliveryTime
      }

      console.log(`✅ Language performance calculated`)
      console.log(`   English: ${englishStats.deliveryRate.toFixed(2)}% delivery rate`)
      console.log(`   Spanish: ${spanishStats.deliveryRate.toFixed(2)}% delivery rate`)

      return {
        english: englishStats,
        spanish: spanishStats,
        comparison
      }

    } catch (error) {
      console.error('Error getting language performance:', error)
      return {
        english: this.getEmptyStatistics(),
        spanish: this.getEmptyStatistics(),
        comparison: {
          deliveryRateDifference: 0,
          averageDeliveryTimeDifference: 0
        }
      }
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Calculate statistics from SMS communications
   */
  private calculateStatistics(smsCommunications: any[]): SMSStatistics {
    const stats: SMSStatistics = {
      totalSent: smsCommunications.length,
      delivered: 0,
      failed: 0,
      undelivered: 0,
      deliveryRate: 0,
      byLanguage: {},
      byTemplate: {},
      byTimeRange: {},
      averageDeliveryTime: 0
    }

    let totalDeliveryTime = 0
    let deliveredCount = 0

    for (const sms of smsCommunications) {
      // Count by status
      switch (sms.status) {
        case 'delivered':
          stats.delivered++
          deliveredCount++
          break
        case 'failed':
          stats.failed++
          break
        case 'undelivered':
          stats.undelivered++
          break
      }

      // Count by language
      if (sms.language_code) {
        stats.byLanguage[sms.language_code] = (stats.byLanguage[sms.language_code] || 0) + 1
      }

      // Count by template
      if (sms.message_type) {
        stats.byTemplate[sms.message_type] = (stats.byTemplate[sms.message_type] || 0) + 1
      }

      // Calculate delivery time
      if (sms.status === 'delivered' && sms.sent_at && sms.delivered_at) {
        const sentTime = new Date(sms.sent_at).getTime()
        const deliveredTime = new Date(sms.delivered_at).getTime()
        totalDeliveryTime += deliveredTime - sentTime
      }
    }

    // Calculate delivery rate
    if (stats.totalSent > 0) {
      stats.deliveryRate = (stats.delivered / stats.totalSent) * 100
    }

    // Calculate average delivery time
    if (deliveredCount > 0) {
      stats.averageDeliveryTime = Math.round(totalDeliveryTime / deliveredCount / 1000) // Convert to seconds
    }

    return stats
  }

  /**
   * Calculate template performance
   */
  private calculateTemplatePerformance(smsCommunications: any[]): {
    totalSent: number
    deliveryRate: number
    averageDeliveryTime: number
    commonErrors: string[]
  } {
    const totalSent = smsCommunications.length
    const delivered = smsCommunications.filter(sms => sms.status === 'delivered').length
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0

    // Calculate average delivery time
    let totalDeliveryTime = 0
    let deliveredCount = 0

    for (const sms of smsCommunications) {
      if (sms.status === 'delivered' && sms.sent_at && sms.delivered_at) {
        const sentTime = new Date(sms.sent_at).getTime()
        const deliveredTime = new Date(sms.delivered_at).getTime()
        totalDeliveryTime += deliveredTime - sentTime
        deliveredCount++
      }
    }

    const averageDeliveryTime = deliveredCount > 0 
      ? Math.round(totalDeliveryTime / deliveredCount / 1000) 
      : 0

    // Get common errors
    const errors = smsCommunications
      .filter(sms => sms.status === 'failed' && sms.error_message)
      .map(sms => sms.error_message)
    
    const errorCounts: Record<string, number> = {}
    for (const error of errors) {
      errorCounts[error] = (errorCounts[error] || 0) + 1
    }

    const commonErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error)

    return {
      totalSent,
      deliveryRate,
      averageDeliveryTime,
      commonErrors
    }
  }

  /**
   * Calculate delivery trends
   */
  private calculateDeliveryTrends(smsCommunications: any[]): Array<{
    date: string
    sent: number
    delivered: number
    failed: number
    deliveryRate: number
  }> {
    const trends: Record<string, {
      sent: number
      delivered: number
      failed: number
    }> = {}

    for (const sms of smsCommunications) {
      const date = new Date(sms.sent_at).toISOString().split('T')[0]
      
      if (!trends[date]) {
        trends[date] = { sent: 0, delivered: 0, failed: 0 }
      }

      trends[date].sent++
      
      if (sms.status === 'delivered') {
        trends[date].delivered++
      } else if (sms.status === 'failed') {
        trends[date].failed++
      }
    }

    return Object.entries(trends).map(([date, data]) => ({
      date,
      sent: data.sent,
      delivered: data.delivered,
      failed: data.failed,
      deliveryRate: data.sent > 0 ? (data.delivered / data.sent) * 100 : 0
    }))
  }

  /**
   * Log delivery event
   */
  private async logDeliveryEvent(event: DeliveryEvent): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      await supabase
        .from('sms_delivery_events')
        .insert({
          message_id: event.messageId,
          status: event.status,
          timestamp: event.timestamp,
          error_code: event.errorCode,
          error_message: event.errorMessage
        })

    } catch (error) {
      console.error('Error logging delivery event:', error)
    }
  }

  /**
   * Get time range in milliseconds
   */
  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 60 * 60 * 1000
      case '24h': return 24 * 60 * 60 * 1000
      case '7d': return 7 * 24 * 60 * 60 * 1000
      case '30d': return 30 * 24 * 60 * 60 * 1000
      default: return 24 * 60 * 60 * 1000
    }
  }

  /**
   * Get empty statistics
   */
  private getEmptyStatistics(): SMSStatistics {
    return {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      undelivered: 0,
      deliveryRate: 0,
      byLanguage: {},
      byTemplate: {},
      byTimeRange: {},
      averageDeliveryTime: 0
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create SMS delivery tracker
 */
export function createSMSDeliveryTracker(): SMSDeliveryTracker {
  return new SMSDeliveryTracker()
}
