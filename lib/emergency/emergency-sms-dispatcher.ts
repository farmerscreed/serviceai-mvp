// Emergency SMS Dispatcher - Task 2.2
// Handles SMS alerts for emergency situations

export interface TechnicianAlertData {
  customerName: string
  customerPhone: string
  customerAddress: string
  issueDescription: string
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  businessName: string
  emergencyContactPhone: string
}

export interface CustomerConfirmationData {
  customerPhone: string
  language: 'en' | 'es'
  businessName: string
  estimatedArrival: string
  emergencyContactPhone: string
  industryCode: string
}

export interface StatusUpdateData {
  customerPhone: string
  language: 'en' | 'es'
  businessName: string
  industryCode: string
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  content?: string
}

export interface DispatchResult {
  technicianSMS: SMSResult
  customerSMS: SMSResult
  statusUpdateScheduled: boolean
}

export class EmergencySMSDispatcher {
  // =====================================================
  // SMS Alert Dispatch
  // =====================================================

  /**
   * Send technician alert SMS (always in English)
   */
  async sendTechnicianAlert(data: TechnicianAlertData): Promise<SMSResult> {
    try {
      console.log(`Sending technician alert to ${data.emergencyContactPhone}`)

      const messageContent = this.formatTechnicianAlert(data)
      
      // This would integrate with actual SMS service (Twilio)
      const result = await this.sendSMS({
        phone: data.emergencyContactPhone,
        content: messageContent,
        language: 'en'
      })

      console.log(`✅ Technician alert sent: ${result.success}`)
      return result

    } catch (error) {
      console.error('Error sending technician alert:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Send customer confirmation SMS (in their language)
   */
  async sendCustomerConfirmation(data: CustomerConfirmationData): Promise<SMSResult> {
    try {
      console.log(`Sending customer confirmation to ${data.customerPhone} in ${data.language}`)

      const messageContent = this.formatCustomerConfirmation(data)
      
      // This would integrate with actual SMS service (Twilio)
      const result = await this.sendSMS({
        phone: data.customerPhone,
        content: messageContent,
        language: data.language
      })

      console.log(`✅ Customer confirmation sent: ${result.success}`)
      return result

    } catch (error) {
      console.error('Error sending customer confirmation:', error)
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Schedule status update SMS
   */
  async scheduleStatusUpdate(data: StatusUpdateData): Promise<boolean> {
    try {
      console.log(`Scheduling status update for ${data.customerPhone}`)

      // This would integrate with a job scheduler (Celery/Redis)
      // For now, we'll simulate scheduling
      const scheduled = await this.scheduleSMSJob({
        phone: data.customerPhone,
        language: data.language,
        businessName: data.businessName,
        industryCode: data.industryCode,
        delay: 15 // 15 minutes
      })

      console.log(`✅ Status update scheduled: ${scheduled}`)
      return scheduled

    } catch (error) {
      console.error('Error scheduling status update:', error)
      return false
    }
  }

  // =====================================================
  // Message Formatting
  // =====================================================

  /**
   * Format technician alert message
   */
  private formatTechnicianAlert(data: TechnicianAlertData): string {
    const urgencyEmoji = data.urgencyLevel === 'HIGH' ? '🚨' : '⚠️'
    
    return `${urgencyEmoji} URGENT: ${data.industryCode.toUpperCase()} emergency from ${data.customerName} at ${data.customerAddress}. Issue: ${data.issueDescription}. Contact: ${data.customerPhone}. Business: ${data.businessName}. Respond immediately.`
  }

  /**
   * Format customer confirmation message
   */
  private formatCustomerConfirmation(data: CustomerConfirmationData): string {
    if (data.language === 'es') {
      return `🚨 URGENTE: Servicio de emergencia ${data.industryCode.toUpperCase()} despachado. Técnico llegará en ${data.estimatedArrival}. Llame ${data.emergencyContactPhone} para actualizaciones. ${data.businessName} está aquí para ayudarle.`
    } else {
      return `🚨 URGENT: Emergency ${data.industryCode.toUpperCase()} service dispatched. Technician will arrive within ${data.estimatedArrival}. Call ${data.emergencyContactPhone} for updates. ${data.businessName} is here to help.`
    }
  }

  /**
   * Format status update message
   */
  private formatStatusUpdate(data: StatusUpdateData, status: string, eta: string): string {
    if (data.language === 'es') {
      return `Actualización: Su técnico está en camino. Estado: ${status}. Tiempo estimado: ${eta}. Llame ${data.businessName} si tiene preguntas.`
    } else {
      return `Update: Your technician is en route. Status: ${status}. ETA: ${eta}. Call ${data.businessName} if you have questions.`
    }
  }

  // =====================================================
  // SMS Service Integration
  // =====================================================

  /**
   * Send SMS message (mock implementation)
   */
  private async sendSMS(params: {
    phone: string
    content: string
    language: 'en' | 'es'
  }): Promise<SMSResult> {
    try {
      // This would integrate with Twilio SMS service
      console.log(`📱 Sending SMS to ${params.phone} (${params.language}):`)
      console.log(`   ${params.content}`)

      // Simulate SMS sending
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Simulate delivery success/failure
      const success = Math.random() > 0.05 // 95% success rate

      if (success) {
        return {
          success: true,
          messageId,
          content: params.content
        }
      } else {
        return {
          success: false,
          error: 'SMS delivery failed'
        }
      }

    } catch (error) {
      return {
        success: false,
        error: String(error)
      }
    }
  }

  /**
   * Schedule SMS job (mock implementation)
   */
  private async scheduleSMSJob(params: {
    phone: string
    language: 'en' | 'es'
    businessName: string
    industryCode: string
    delay: number
  }): Promise<boolean> {
    try {
      // This would integrate with Celery/Redis job scheduler
      console.log(`⏰ Scheduling SMS job for ${params.phone} in ${params.delay} minutes`)

      // Simulate job scheduling
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // In real implementation, this would:
      // 1. Create a Celery task
      // 2. Schedule it with Redis
      // 3. Return job ID for tracking
      
      console.log(`✅ SMS job scheduled: ${jobId}`)
      return true

    } catch (error) {
      console.error('Error scheduling SMS job:', error)
      return false
    }
  }

  // =====================================================
  // Emergency Workflow Management
  // =====================================================

  /**
   * Handle complete emergency workflow
   */
  async handleEmergencyWorkflow(
    emergencyData: {
      customerName: string
      customerPhone: string
      customerAddress: string
      issueDescription: string
      urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
      businessName: string
      emergencyContactPhone: string
      industryCode: string
      language: 'en' | 'es'
    }
  ): Promise<DispatchResult> {
    try {
      console.log(`🚨 Handling emergency workflow for ${emergencyData.businessName}`)

      const result: DispatchResult = {
        technicianSMS: { success: false },
        customerSMS: { success: false },
        statusUpdateScheduled: false
      }

      // 1. Send technician alert
      result.technicianSMS = await this.sendTechnicianAlert({
        customerName: emergencyData.customerName,
        customerPhone: emergencyData.customerPhone,
        customerAddress: emergencyData.customerAddress,
        issueDescription: emergencyData.issueDescription,
        urgencyLevel: emergencyData.urgencyLevel,
        businessName: emergencyData.businessName,
        emergencyContactPhone: emergencyData.emergencyContactPhone
      })

      // 2. Send customer confirmation
      result.customerSMS = await this.sendCustomerConfirmation({
        customerPhone: emergencyData.customerPhone,
        language: emergencyData.language,
        businessName: emergencyData.businessName,
        estimatedArrival: this.getEstimatedArrival(emergencyData.urgencyLevel),
        emergencyContactPhone: emergencyData.emergencyContactPhone,
        industryCode: emergencyData.industryCode
      })

      // 3. Schedule status update
      result.statusUpdateScheduled = await this.scheduleStatusUpdate({
        customerPhone: emergencyData.customerPhone,
        language: emergencyData.language,
        businessName: emergencyData.businessName,
        industryCode: emergencyData.industryCode
      })

      console.log(`✅ Emergency workflow completed`)
      console.log(`   Technician SMS: ${result.technicianSMS.success}`)
      console.log(`   Customer SMS: ${result.customerSMS.success}`)
      console.log(`   Status Update: ${result.statusUpdateScheduled}`)

      return result

    } catch (error) {
      console.error('Error handling emergency workflow:', error)
      throw new Error(`Emergency workflow failed: ${error}`)
    }
  }

  /**
   * Get estimated arrival time based on urgency
   */
  private getEstimatedArrival(urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW'): string {
    switch (urgencyLevel) {
      case 'HIGH':
        return '15-30 minutes'
      case 'MEDIUM':
        return '30-45 minutes'
      case 'LOW':
        return '45-60 minutes'
      default:
        return '30-45 minutes'
    }
  }

  // =====================================================
  // SMS Analytics and Tracking
  // =====================================================

  /**
   * Track SMS delivery status
   */
  async trackSMSDelivery(messageId: string, status: 'sent' | 'delivered' | 'failed'): Promise<void> {
    try {
      console.log(`📊 Tracking SMS delivery: ${messageId} - ${status}`)
      
      // This would update the database with delivery status
      // await this.updateSMSStatus(messageId, status)
      
    } catch (error) {
      console.error('Error tracking SMS delivery:', error)
    }
  }

  /**
   * Get SMS delivery statistics
   */
  async getSMSStatistics(organizationId: string, timeRange: string = '24h'): Promise<{
    totalSent: number
    delivered: number
    failed: number
    deliveryRate: number
  }> {
    try {
      // This would query the database for SMS statistics
      console.log(`📊 Getting SMS statistics for ${organizationId} (${timeRange})`)
      
      // Mock statistics
      return {
        totalSent: 150,
        delivered: 147,
        failed: 3,
        deliveryRate: 0.98
      }

    } catch (error) {
      console.error('Error getting SMS statistics:', error)
      return {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        deliveryRate: 0
      }
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create emergency SMS dispatcher
 */
export function createEmergencySMSDispatcher(): EmergencySMSDispatcher {
  return new EmergencySMSDispatcher()
}
