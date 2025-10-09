// SMS Workflow Engine - Task 3.2
// Automated SMS workflow management and execution

import { createServerClient } from '@/lib/supabase/server'
import { TwilioSMSService } from './twilio-sms-service'
import { SMSDeliveryTracker } from './sms-delivery-tracker'

export interface SMSWorkflow {
  id: string
  organizationId: string
  customerId: string
  workflowType: 'appointment_confirmation' | 'appointment_reminder' | 'emergency_alert' | 'follow_up' | 'survey'
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'failed'
  scheduledAt: string
  executedAt?: string
  completedAt?: string
  errorMessage?: string
  metadata: Record<string, any>
}

export interface WorkflowStep {
  id: string
  workflowId: string
  stepType: 'send_sms' | 'wait' | 'condition' | 'webhook'
  order: number
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped'
  scheduledAt: string
  executedAt?: string
  completedAt?: string
  errorMessage?: string
  config: Record<string, any>
  result?: Record<string, any>
}

export interface WorkflowExecution {
  workflowId: string
  stepId: string
  status: 'success' | 'failure' | 'skipped'
  result?: Record<string, any>
  error?: string
  executedAt: string
}

export class SMSWorkflowEngine {
  private smsService: TwilioSMSService
  private deliveryTracker: SMSDeliveryTracker

  constructor() {
    this.smsService = new TwilioSMSService()
    this.deliveryTracker = new SMSDeliveryTracker()
  }

  // =====================================================
  // Workflow Management
  // =====================================================

  /**
   * Create a new SMS workflow
   */
  async createWorkflow(
    organizationId: string,
    customerId: string,
    workflowType: SMSWorkflow['workflowType'],
    scheduledAt: string,
    metadata: Record<string, any> = {}
  ): Promise<SMSWorkflow> {
    try {
      console.log(`🔄 Creating SMS workflow: ${workflowType} for customer ${customerId}`)

      const supabase = await createServerClient()
      
      const workflow: Omit<SMSWorkflow, 'id'> = {
        organizationId,
        customerId,
        workflowType,
        status: 'pending',
        scheduledAt,
        metadata
      }

      const { data, error } = await supabase
        .from('sms_workflows')
        .insert(workflow)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Create workflow steps based on type
      await this.createWorkflowSteps(data.id, workflowType, metadata)

      console.log(`✅ SMS workflow created: ${data.id}`)
      return data

    } catch (error) {
      console.error('Error creating SMS workflow:', error)
      throw error
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<WorkflowExecution[]> {
    try {
      console.log(`🔄 Executing SMS workflow: ${workflowId}`)

      const supabase = await createServerClient()
      
      // Get workflow and steps
      const { data: workflow, error: workflowError } = await supabase
        .from('sms_workflows')
        .select(`
          *,
          steps:workflow_steps(*)
        `)
        .eq('id', workflowId)
        .single()

      if (workflowError || !workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      // Update workflow status
      await supabase
        .from('sms_workflows')
        .update({ 
          status: 'active',
          executedAt: new Date().toISOString()
        })
        .eq('id', workflowId)

      const executions: WorkflowExecution[] = []

      // Execute steps in order
      for (const step of workflow.steps.sort((a, b) => a.order - b.order)) {
        try {
          const execution = await this.executeStep(step, workflow)
          executions.push(execution)

          // Update step status
          await supabase
            .from('workflow_steps')
            .update({
              status: execution.status,
              executedAt: execution.executedAt,
              completedAt: execution.status === 'success' ? execution.executedAt : null,
              errorMessage: execution.error
            })
            .eq('id', step.id)

          // Check if workflow should continue
          if (execution.status === 'failure' && step.stepType === 'send_sms') {
            console.log(`❌ Workflow step failed, stopping workflow: ${step.id}`)
            break
          }

        } catch (error) {
          console.error(`Error executing step ${step.id}:`, error)
          executions.push({
            workflowId,
            stepId: step.id,
            status: 'failure',
            error: error instanceof Error ? error.message : 'Unknown error',
            executedAt: new Date().toISOString()
          })
        }
      }

      // Update workflow completion status
      const allStepsCompleted = executions.every(exec => exec.status === 'success' || exec.status === 'skipped')
      await supabase
        .from('sms_workflows')
        .update({
          status: allStepsCompleted ? 'completed' : 'failed',
          completedAt: new Date().toISOString()
        })
        .eq('id', workflowId)

      console.log(`✅ SMS workflow executed: ${workflowId} (${executions.length} steps)`)

      return executions

    } catch (error) {
      console.error('Error executing SMS workflow:', error)
      throw error
    }
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    try {
      console.log(`🔄 Cancelling SMS workflow: ${workflowId}`)

      const supabase = await createServerClient()
      
      await supabase
        .from('sms_workflows')
        .update({
          status: 'cancelled',
          completedAt: new Date().toISOString()
        })
        .eq('id', workflowId)

      // Cancel pending steps
      await supabase
        .from('workflow_steps')
        .update({
          status: 'skipped',
          completedAt: new Date().toISOString()
        })
        .eq('workflow_id', workflowId)
        .eq('status', 'pending')

      console.log(`✅ SMS workflow cancelled: ${workflowId}`)

    } catch (error) {
      console.error('Error cancelling SMS workflow:', error)
      throw error
    }
  }

  // =====================================================
  // Workflow Execution
  // =====================================================

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, workflow: SMSWorkflow): Promise<WorkflowExecution> {
    try {
      console.log(`🔄 Executing step: ${step.stepType} (${step.id})`)

      switch (step.stepType) {
        case 'send_sms':
          return await this.executeSendSMSStep(step, workflow)
        
        case 'wait':
          return await this.executeWaitStep(step, workflow)
        
        case 'condition':
          return await this.executeConditionStep(step, workflow)
        
        case 'webhook':
          return await this.executeWebhookStep(step, workflow)
        
        default:
          throw new Error(`Unknown step type: ${step.stepType}`)
      }

    } catch (error) {
      console.error(`Error executing step ${step.id}:`, error)
      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Execute send SMS step
   */
  private async executeSendSMSStep(step: WorkflowStep, workflow: SMSWorkflow): Promise<WorkflowExecution> {
    try {
      const { templateKey, language, phoneNumber, data } = step.config

      const result = await this.smsService.sendMultilingualSms(
        phoneNumber,
        templateKey,
        language,
        {
          organization_id: workflow.organizationId,
          customer_id: workflow.customerId,
          ...data
        }
      )

      if (!result.success) {
        throw new Error(`SMS sending failed: ${result.error}`)
      }

      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'success',
        result: {
          messageId: result.message_id,
          language: result.language_used,
          content: result.content
        },
        executedAt: new Date().toISOString()
      }

    } catch (error) {
      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Execute wait step
   */
  private async executeWaitStep(step: WorkflowStep, workflow: SMSWorkflow): Promise<WorkflowExecution> {
    try {
      const { duration } = step.config
      const waitTime = parseInt(duration) || 0

      if (waitTime > 0) {
        console.log(`⏳ Waiting ${waitTime} seconds`)
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
      }

      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'success',
        result: { waited: waitTime },
        executedAt: new Date().toISOString()
      }

    } catch (error) {
      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(step: WorkflowStep, workflow: SMSWorkflow): Promise<WorkflowExecution> {
    try {
      const { condition, value } = step.config
      const shouldExecute = this.evaluateCondition(condition, value, workflow)

      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: shouldExecute ? 'success' : 'skipped',
        result: { conditionMet: shouldExecute },
        executedAt: new Date().toISOString()
      }

    } catch (error) {
      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Execute webhook step
   */
  private async executeWebhookStep(step: WorkflowStep, workflow: SMSWorkflow): Promise<WorkflowExecution> {
    try {
      const { url, method, headers, body } = step.config

      const response = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          stepId: step.id,
          ...body
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'success',
        result,
        executedAt: new Date().toISOString()
      }

    } catch (error) {
      return {
        workflowId: workflow.id,
        stepId: step.id,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date().toISOString()
      }
    }
  }

  // =====================================================
  // Workflow Step Creation
  // =====================================================

  /**
   * Create workflow steps based on workflow type
   */
  private async createWorkflowSteps(
    workflowId: string,
    workflowType: SMSWorkflow['workflowType'],
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      let steps: Omit<WorkflowStep, 'id' | 'workflowId'>[] = []

      switch (workflowType) {
        case 'appointment_confirmation':
          steps = this.createAppointmentConfirmationSteps(metadata)
          break
        
        case 'appointment_reminder':
          steps = this.createAppointmentReminderSteps(metadata)
          break
        
        case 'emergency_alert':
          steps = this.createEmergencyAlertSteps(metadata)
          break
        
        case 'follow_up':
          steps = this.createFollowUpSteps(metadata)
          break
        
        case 'survey':
          steps = this.createSurveySteps(metadata)
          break
        
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`)
      }

      // Insert steps
      for (const step of steps) {
        await supabase
          .from('workflow_steps')
          .insert({
            workflow_id: workflowId,
            ...step
          })
      }

      console.log(`✅ Created ${steps.length} workflow steps for ${workflowType}`)

    } catch (error) {
      console.error('Error creating workflow steps:', error)
      throw error
    }
  }

  /**
   * Create appointment confirmation steps
   */
  private createAppointmentConfirmationSteps(metadata: Record<string, any>): Omit<WorkflowStep, 'id' | 'workflowId'>[] {
    return [
      {
        stepType: 'send_sms',
        order: 1,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
        config: {
          templateKey: 'appointment_confirmation',
          language: metadata.language || 'en',
          phoneNumber: metadata.phoneNumber,
          data: {
            customerName: metadata.customerName,
            appointmentDate: metadata.appointmentDate,
            appointmentTime: metadata.appointmentTime,
            serviceType: metadata.serviceType,
            businessName: metadata.businessName
          }
        }
      }
    ]
  }

  /**
   * Create appointment reminder steps
   */
  private createAppointmentReminderSteps(metadata: Record<string, any>): Omit<WorkflowStep, 'id' | 'workflowId'>[] {
    return [
      {
        stepType: 'send_sms',
        order: 1,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
        config: {
          templateKey: 'appointment_reminder',
          language: metadata.language || 'en',
          phoneNumber: metadata.phoneNumber,
          data: {
            customerName: metadata.customerName,
            appointmentDate: metadata.appointmentDate,
            appointmentTime: metadata.appointmentTime,
            serviceType: metadata.serviceType,
            businessName: metadata.businessName
          }
        }
      }
    ]
  }

  /**
   * Create emergency alert steps
   */
  private createEmergencyAlertSteps(metadata: Record<string, any>): Omit<WorkflowStep, 'id' | 'workflowId'>[] {
    return [
      {
        stepType: 'send_sms',
        order: 1,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
        config: {
          templateKey: 'emergency_alert',
          language: metadata.language || 'en',
          phoneNumber: metadata.phoneNumber,
          data: {
            customerName: metadata.customerName,
            emergencyType: metadata.emergencyType,
            businessName: metadata.businessName,
            emergencyContact: metadata.emergencyContact
          }
        }
      }
    ]
  }

  /**
   * Create follow-up steps
   */
  private createFollowUpSteps(metadata: Record<string, any>): Omit<WorkflowStep, 'id' | 'workflowId'>[] {
    return [
      {
        stepType: 'send_sms',
        order: 1,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
        config: {
          templateKey: 'follow_up',
          language: metadata.language || 'en',
          phoneNumber: metadata.phoneNumber,
          data: {
            customerName: metadata.customerName,
            serviceType: metadata.serviceType,
            businessName: metadata.businessName
          }
        }
      }
    ]
  }

  /**
   * Create survey steps
   */
  private createSurveySteps(metadata: Record<string, any>): Omit<WorkflowStep, 'id' | 'workflowId'>[] {
    return [
      {
        stepType: 'send_sms',
        order: 1,
        status: 'pending',
        scheduledAt: new Date().toISOString(),
        config: {
          templateKey: 'survey',
          language: metadata.language || 'en',
          phoneNumber: metadata.phoneNumber,
          data: {
            customerName: metadata.customerName,
            serviceType: metadata.serviceType,
            businessName: metadata.businessName
          }
        }
      }
    ]
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Evaluate condition for conditional steps
   */
  private evaluateCondition(condition: string, value: any, workflow: SMSWorkflow): boolean {
    try {
      // Simple condition evaluation
      switch (condition) {
        case 'appointment_exists':
          return workflow.metadata.appointmentId !== undefined
        
        case 'customer_has_phone':
          return workflow.metadata.phoneNumber !== undefined
        
        case 'emergency_detected':
          return workflow.metadata.emergencyType !== undefined
        
        default:
          return false
      }
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create SMS workflow engine
 */
export function createSMSWorkflowEngine(): SMSWorkflowEngine {
  return new SMSWorkflowEngine()
}
