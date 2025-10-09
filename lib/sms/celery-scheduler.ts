// Celery Scheduler Integration - Task 3.2
// Manages scheduled SMS workflows using Celery

import { createServerClient } from '@/lib/supabase/server'
import { SMSWorkflowEngine } from './sms-workflow-engine'

export interface ScheduledTask {
  id: string
  taskName: string
  workflowId: string
  scheduledAt: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: any
  error?: string
  createdAt: string
  executedAt?: string
}

export interface TaskSchedule {
  taskName: string
  workflowId: string
  scheduledAt: string
  priority: number
  retryCount: number
  maxRetries: number
}

export class CeleryScheduler {
  private workflowEngine: SMSWorkflowEngine

  constructor() {
    this.workflowEngine = new SMSWorkflowEngine()
  }

  // =====================================================
  // Task Scheduling
  // =====================================================

  /**
   * Schedule a workflow for execution
   */
  async scheduleWorkflow(
    workflowId: string,
    scheduledAt: string,
    priority: number = 5,
    maxRetries: number = 3
  ): Promise<ScheduledTask> {
    try {
      console.log(`⏰ Scheduling workflow: ${workflowId} for ${scheduledAt}`)

      const supabase = await createServerClient()
      
      const task: Omit<ScheduledTask, 'id' | 'createdAt'> = {
        taskName: 'execute_sms_workflow',
        workflowId,
        scheduledAt,
        status: 'pending',
        retryCount: 0,
        maxRetries
      }

      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert(task)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Schedule with Celery (placeholder for actual Celery integration)
      await this.scheduleWithCelery({
        taskName: 'execute_sms_workflow',
        workflowId,
        scheduledAt,
        priority,
        retryCount: 0,
        maxRetries
      })

      console.log(`✅ Workflow scheduled: ${data.id}`)
      return data

    } catch (error) {
      console.error('Error scheduling workflow:', error)
      throw error
    }
  }

  /**
   * Schedule recurring workflow
   */
  async scheduleRecurringWorkflow(
    workflowId: string,
    cronExpression: string,
    startDate: string,
    endDate?: string
  ): Promise<ScheduledTask> {
    try {
      console.log(`🔄 Scheduling recurring workflow: ${workflowId}`)

      const supabase = await createServerClient()
      
      const task: Omit<ScheduledTask, 'id' | 'createdAt'> = {
        taskName: 'execute_recurring_sms_workflow',
        workflowId,
        scheduledAt: startDate,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3
      }

      const { data, error } = await supabase
        .from('scheduled_tasks')
        .insert(task)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Schedule recurring task with Celery
      await this.scheduleRecurringWithCelery({
        taskName: 'execute_recurring_sms_workflow',
        workflowId,
        cronExpression,
        startDate,
        endDate
      })

      console.log(`✅ Recurring workflow scheduled: ${data.id}`)
      return data

    } catch (error) {
      console.error('Error scheduling recurring workflow:', error)
      throw error
    }
  }

  /**
   * Cancel scheduled task
   */
  async cancelScheduledTask(taskId: string): Promise<void> {
    try {
      console.log(`❌ Cancelling scheduled task: ${taskId}`)

      const supabase = await createServerClient()
      
      // Update task status
      await supabase
        .from('scheduled_tasks')
        .update({
          status: 'cancelled',
          executedAt: new Date().toISOString()
        })
        .eq('id', taskId)

      // Cancel with Celery
      await this.cancelWithCelery(taskId)

      console.log(`✅ Scheduled task cancelled: ${taskId}`)

    } catch (error) {
      console.error('Error cancelling scheduled task:', error)
      throw error
    }
  }

  // =====================================================
  // Task Execution
  // =====================================================

  /**
   * Execute scheduled task
   */
  async executeScheduledTask(taskId: string): Promise<void> {
    try {
      console.log(`🔄 Executing scheduled task: ${taskId}`)

      const supabase = await createServerClient()
      
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (taskError || !task) {
        throw new Error(`Task not found: ${taskId}`)
      }

      // Update task status
      await supabase
        .from('scheduled_tasks')
        .update({
          status: 'running',
          executedAt: new Date().toISOString()
        })
        .eq('id', taskId)

      try {
        // Execute workflow
        const executions = await this.workflowEngine.executeWorkflow(task.workflowId)

        // Update task with result
        await supabase
          .from('scheduled_tasks')
          .update({
            status: 'completed',
            result: { executions },
            executedAt: new Date().toISOString()
          })
          .eq('id', taskId)

        console.log(`✅ Scheduled task completed: ${taskId}`)

      } catch (error) {
        // Update task with error
        await supabase
          .from('scheduled_tasks')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            executedAt: new Date().toISOString()
          })
          .eq('id', taskId)

        console.error(`❌ Scheduled task failed: ${taskId}`, error)
        throw error
      }

    } catch (error) {
      console.error('Error executing scheduled task:', error)
      throw error
    }
  }

  /**
   * Retry failed task
   */
  async retryFailedTask(taskId: string): Promise<void> {
    try {
      console.log(`🔄 Retrying failed task: ${taskId}`)

      const supabase = await createServerClient()
      
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (taskError || !task) {
        throw new Error(`Task not found: ${taskId}`)
      }

      // Check retry count
      if (task.retryCount >= task.maxRetries) {
        throw new Error(`Task has exceeded maximum retries: ${task.maxRetries}`)
      }

      // Update retry count
      await supabase
        .from('scheduled_tasks')
        .update({
          retryCount: task.retryCount + 1,
          status: 'pending',
          error: null
        })
        .eq('id', taskId)

      // Reschedule task
      await this.scheduleWithCelery({
        taskName: task.taskName,
        workflowId: task.workflowId,
        scheduledAt: new Date().toISOString(),
        priority: 5,
        retryCount: task.retryCount + 1,
        maxRetries: task.maxRetries
      })

      console.log(`✅ Task retry scheduled: ${taskId}`)

    } catch (error) {
      console.error('Error retrying failed task:', error)
      throw error
    }
  }

  // =====================================================
  // Task Management
  // =====================================================

  /**
   * Get scheduled tasks for organization
   */
  async getScheduledTasks(
    organizationId: string,
    status?: string,
    limit: number = 50
  ): Promise<ScheduledTask[]> {
    try {
      console.log(`📋 Getting scheduled tasks for organization: ${organizationId}`)

      const supabase = await createServerClient()
      
      let query = supabase
        .from('scheduled_tasks')
        .select(`
          *,
          workflows:sms_workflows!inner(
            organization_id,
            workflow_type,
            status
          )
        `)
        .eq('workflows.organization_id', organizationId)
        .order('scheduledAt', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Retrieved ${data?.length || 0} scheduled tasks`)
      return data || []

    } catch (error) {
      console.error('Error getting scheduled tasks:', error)
      return []
    }
  }

  /**
   * Get task execution history
   */
  async getTaskExecutionHistory(
    organizationId: string,
    days: number = 7
  ): Promise<Array<{
    date: string
    total: number
    completed: number
    failed: number
    cancelled: number
  }>> {
    try {
      console.log(`📊 Getting task execution history for organization: ${organizationId}`)

      const supabase = await createServerClient()
      
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select(`
          status,
          executedAt,
          workflows:sms_workflows!inner(
            organization_id
          )
        `)
        .eq('workflows.organization_id', organizationId)
        .gte('executedAt', startDate)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      // Group by date and status
      const history: Record<string, { total: number; completed: number; failed: number; cancelled: number }> = {}

      for (const task of data || []) {
        const date = task.executedAt?.split('T')[0] || 'unknown'
        
        if (!history[date]) {
          history[date] = { total: 0, completed: 0, failed: 0, cancelled: 0 }
        }

        history[date].total++
        
        switch (task.status) {
          case 'completed':
            history[date].completed++
            break
          case 'failed':
            history[date].failed++
            break
          case 'cancelled':
            history[date].cancelled++
            break
        }
      }

      const result = Object.entries(history).map(([date, stats]) => ({
        date,
        ...stats
      }))

      console.log(`✅ Retrieved task execution history: ${result.length} days`)
      return result

    } catch (error) {
      console.error('Error getting task execution history:', error)
      return []
    }
  }

  // =====================================================
  // Celery Integration (Placeholder)
  // =====================================================

  /**
   * Schedule task with Celery
   */
  private async scheduleWithCelery(schedule: TaskSchedule): Promise<void> {
    try {
      // Placeholder for actual Celery integration
      console.log(`⏰ Scheduling with Celery: ${schedule.taskName}`)
      console.log(`   Workflow ID: ${schedule.workflowId}`)
      console.log(`   Scheduled At: ${schedule.scheduledAt}`)
      console.log(`   Priority: ${schedule.priority}`)
      console.log(`   Retry Count: ${schedule.retryCount}`)

      // In a real implementation, this would:
      // 1. Connect to Celery broker (Redis/RabbitMQ)
      // 2. Create a Celery task with the schedule
      // 3. Set up retry logic and error handling
      // 4. Configure task routing and priority

    } catch (error) {
      console.error('Error scheduling with Celery:', error)
      throw error
    }
  }

  /**
   * Schedule recurring task with Celery
   */
  private async scheduleRecurringWithCelery(config: {
    taskName: string
    workflowId: string
    cronExpression: string
    startDate: string
    endDate?: string
  }): Promise<void> {
    try {
      // Placeholder for actual Celery integration
      console.log(`🔄 Scheduling recurring with Celery: ${config.taskName}`)
      console.log(`   Workflow ID: ${config.workflowId}`)
      console.log(`   Cron Expression: ${config.cronExpression}`)
      console.log(`   Start Date: ${config.startDate}`)
      console.log(`   End Date: ${config.endDate || 'Never'}`)

      // In a real implementation, this would:
      // 1. Use Celery Beat for periodic tasks
      // 2. Configure cron expressions
      // 3. Set up task chains and workflows
      // 4. Handle timezone considerations

    } catch (error) {
      console.error('Error scheduling recurring with Celery:', error)
      throw error
    }
  }

  /**
   * Cancel task with Celery
   */
  private async cancelWithCelery(taskId: string): Promise<void> {
    try {
      // Placeholder for actual Celery integration
      console.log(`❌ Cancelling with Celery: ${taskId}`)

      // In a real implementation, this would:
      // 1. Revoke the Celery task
      // 2. Remove from the schedule
      // 3. Clean up any associated resources

    } catch (error) {
      console.error('Error cancelling with Celery:', error)
      throw error
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create Celery scheduler
 */
export function createCeleryScheduler(): CeleryScheduler {
  return new CeleryScheduler()
}
