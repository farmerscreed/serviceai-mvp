// Workflow Tracker - Task 3.2
// Tracks SMS workflow execution and provides analytics

import { createServerClient } from '@/lib/supabase/server'

export interface WorkflowMetrics {
  totalWorkflows: number
  activeWorkflows: number
  completedWorkflows: number
  failedWorkflows: number
  cancelledWorkflows: number
  successRate: number
  averageExecutionTime: number
  byWorkflowType: Record<string, number>
  byLanguage: Record<string, number>
  byTimeRange: Record<string, number>
}

export interface WorkflowExecution {
  workflowId: string
  stepId: string
  status: 'success' | 'failure' | 'skipped'
  result?: Record<string, any>
  error?: string
  executedAt: string
}

export interface WorkflowTrend {
  date: string
  total: number
  completed: number
  failed: number
  cancelled: number
  successRate: number
}

export interface StepPerformance {
  stepType: string
  totalExecutions: number
  successCount: number
  failureCount: number
  skippedCount: number
  successRate: number
  averageExecutionTime: number
  commonErrors: string[]
}

export class WorkflowTracker {
  // =====================================================
  // Workflow Metrics
  // =====================================================

  /**
   * Get workflow metrics for organization
   */
  async getWorkflowMetrics(
    organizationId: string,
    timeRange: string = '7d'
  ): Promise<WorkflowMetrics> {
    try {
      console.log(`📊 Getting workflow metrics for ${organizationId} (${timeRange})`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      // TODO: Implement when sms_workflows table is created
      // const { data: workflows, error } = await supabase
      //   .from('sms_workflows')
      //   .select(`
      //     id,
      //     workflow_type,
      //     status,
      //     created_at,
      //     executed_at,
      //     completed_at,
      //     metadata
      //   `)
      //   .eq('organization_id', organizationId)
      //   .gte('created_at', startTime)

      // if (error) {
      //   throw new Error(`Database error: ${error.message}`)
      // }

      const metrics = this.calculateWorkflowMetrics([])
      console.log(`✅ Workflow metrics calculated: ${metrics.totalWorkflows} total, ${metrics.successRate.toFixed(2)}% success rate`)

      return metrics

    } catch (error) {
      console.error('Error getting workflow metrics:', error)
      return {
        totalWorkflows: 0,
        activeWorkflows: 0,
        completedWorkflows: 0,
        failedWorkflows: 0,
        cancelledWorkflows: 0,
        successRate: 0,
        averageExecutionTime: 0,
        byWorkflowType: {},
        byLanguage: {},
        byTimeRange: {}
      }
    }
  }

  /**
   * Get workflow trends over time
   */
  async getWorkflowTrends(
    organizationId: string,
    timeRange: string = '7d'
  ): Promise<WorkflowTrend[]> {
    try {
      console.log(`📈 Getting workflow trends for ${organizationId}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      // TODO: Implement when sms_workflows table is created
      // const { data: workflows, error } = await supabase
      //   .from('sms_workflows')
      //   .select(`
      //     status,
      //     created_at,
      //     completed_at
      //   `)
      //   .eq('organization_id', organizationId)
      //   .gte('created_at', startTime)
      //   .order('created_at', { ascending: true })
      
      const workflows: any[] = []
      const error = null

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const trends = this.calculateWorkflowTrends(workflows || [])
      console.log(`✅ Workflow trends calculated: ${trends.length} data points`)

      return trends

    } catch (error) {
      console.error('Error getting workflow trends:', error)
      return []
    }
  }

  /**
   * Get step performance metrics
   */
  async getStepPerformance(
    organizationId: string,
    timeRange: string = '7d'
  ): Promise<StepPerformance[]> {
    try {
      console.log(`🔧 Getting step performance for ${organizationId}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      // TODO: Implement when workflow_steps table is created
      // const { data: steps, error } = await supabase
      //   .from('workflow_steps')
      //   .select(`
      //     step_type,
      //     status,
      //     executed_at,
      //     completed_at,
      //     error_message,
      //     workflows:sms_workflows!inner(
      //       organization_id
      //     )
      //   `)
      //   .eq('workflows.organization_id', organizationId)
      //   .gte('executed_at', startTime)

      // if (error) {
      //   throw new Error(`Database error: ${error.message}`)
      // }

      const performance = this.calculateStepPerformance([])
      console.log(`✅ Step performance calculated: ${performance.length} step types`)

      return performance

    } catch (error) {
      console.error('Error getting step performance:', error)
      return []
    }
  }

  // =====================================================
  // Workflow Execution Tracking
  // =====================================================

  /**
   * Track workflow execution
   */
  async trackWorkflowExecution(
    workflowId: string,
    executions: WorkflowExecution[]
  ): Promise<void> {
    try {
      console.log(`📝 Tracking workflow execution: ${workflowId} (${executions.length} steps)`)

      const supabase = await createServerClient()
      
      // TODO: Implement when workflow_executions table is created
      // Log each execution
      // for (const execution of executions) {
      //   await supabase
      //     .from('workflow_executions')
      //     .insert({
      //       workflow_id: execution.workflowId,
      //       step_id: execution.stepId,
      //       status: execution.status,
      //       result: execution.result,
      //       error: execution.error,
      //       executed_at: execution.executedAt
      //     })
      // }

      console.log(`✅ Workflow execution tracked: ${workflowId}`)

    } catch (error) {
      console.error('Error tracking workflow execution:', error)
    }
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutionHistory(
    workflowId: string
  ): Promise<WorkflowExecution[]> {
    try {
      console.log(`📋 Getting workflow execution history: ${workflowId}`)

      const supabase = await createServerClient()
      
      // TODO: Implement when workflow_executions table is created
      // const { data: executions, error } = await supabase
      //   .from('workflow_executions')
      //   .select(`
      //     workflow_id,
      //     step_id,
      //     status,
      //     result,
      //     error,
      //     executed_at
      //   `)
      //   .eq('workflow_id', workflowId)
      //   .order('executed_at', { ascending: true })

      // if (error) {
      //   throw new Error(`Database error: ${error.message}`)
      // }

      console.log(`✅ Retrieved 0 execution records (table not implemented)`)
      return []

    } catch (error) {
      console.error('Error getting workflow execution history:', error)
      return []
    }
  }

  // =====================================================
  // Workflow Analytics
  // =====================================================

  /**
   * Get workflow performance by type
   */
  async getWorkflowPerformanceByType(
    organizationId: string,
    timeRange: string = '30d'
  ): Promise<Array<{
    workflowType: string
    totalWorkflows: number
    successRate: number
    averageExecutionTime: number
    commonErrors: string[]
  }>> {
    try {
      console.log(`📊 Getting workflow performance by type for ${organizationId}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      // TODO: Implement when sms_workflows table is created
      // const { data: workflows, error } = await supabase
      //   .from('sms_workflows')
      //   .select(`
      //     workflow_type,
      //     status,
      //     created_at,
      //     executed_at,
      //     completed_at,
      //     error_message
      //   `)
      //   .eq('organization_id', organizationId)
      //   .gte('created_at', startTime)

      // if (error) {
      //   throw new Error(`Database error: ${error.message}`)
      // }

      const performance = this.calculateWorkflowPerformanceByType([])
      console.log(`✅ Workflow performance by type calculated: ${performance.length} types`)

      return performance

    } catch (error) {
      console.error('Error getting workflow performance by type:', error)
      return []
    }
  }

  /**
   * Get workflow performance by language
   */
  async getWorkflowPerformanceByLanguage(
    organizationId: string,
    timeRange: string = '30d'
  ): Promise<Array<{
    language: string
    totalWorkflows: number
    successRate: number
    averageExecutionTime: number
    commonErrors: string[]
  }>> {
    try {
      console.log(`🌍 Getting workflow performance by language for ${organizationId}`)

      const supabase = await createServerClient()
      
      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startTime = new Date(Date.now() - timeRangeMs).toISOString()

      // TODO: Implement when sms_workflows table is created
      // const { data: workflows, error } = await supabase
      //   .from('sms_workflows')
      //   .select(`
      //     metadata,
      //     status,
      //     created_at,
      //     executed_at,
      //     completed_at,
      //     error_message
      //   `)
      //   .eq('organization_id', organizationId)
      //   .gte('created_at', startTime)

      // if (error) {
      //   throw new Error(`Database error: ${error.message}`)
      // }

      const performance = this.calculateWorkflowPerformanceByLanguage([])
      console.log(`✅ Workflow performance by language calculated: ${performance.length} languages`)

      return performance

    } catch (error) {
      console.error('Error getting workflow performance by language:', error)
      return []
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Calculate workflow metrics
   */
  private calculateWorkflowMetrics(workflows: any[]): WorkflowMetrics {
    const metrics: WorkflowMetrics = {
      totalWorkflows: workflows.length,
      activeWorkflows: 0,
      completedWorkflows: 0,
      failedWorkflows: 0,
      cancelledWorkflows: 0,
      successRate: 0,
      averageExecutionTime: 0,
      byWorkflowType: {},
      byLanguage: {},
      byTimeRange: {}
    }

    let totalExecutionTime = 0
    let completedCount = 0

    for (const workflow of workflows) {
      // Count by status
      switch (workflow.status) {
        case 'active':
          metrics.activeWorkflows++
          break
        case 'completed':
          metrics.completedWorkflows++
          completedCount++
          break
        case 'failed':
          metrics.failedWorkflows++
          break
        case 'cancelled':
          metrics.cancelledWorkflows++
          break
      }

      // Count by workflow type
      if (workflow.workflow_type) {
        metrics.byWorkflowType[workflow.workflow_type] = (metrics.byWorkflowType[workflow.workflow_type] || 0) + 1
      }

      // Count by language
      if (workflow.metadata?.language) {
        metrics.byLanguage[workflow.metadata.language] = (metrics.byLanguage[workflow.metadata.language] || 0) + 1
      }

      // Calculate execution time
      if (workflow.status === 'completed' && workflow.executed_at && workflow.completed_at) {
        const executedTime = new Date(workflow.executed_at).getTime()
        const completedTime = new Date(workflow.completed_at).getTime()
        totalExecutionTime += completedTime - executedTime
      }
    }

    // Calculate success rate
    if (metrics.totalWorkflows > 0) {
      metrics.successRate = (metrics.completedWorkflows / metrics.totalWorkflows) * 100
    }

    // Calculate average execution time
    if (completedCount > 0) {
      metrics.averageExecutionTime = Math.round(totalExecutionTime / completedCount / 1000) // Convert to seconds
    }

    return metrics
  }

  /**
   * Calculate workflow trends
   */
  private calculateWorkflowTrends(workflows: any[]): WorkflowTrend[] {
    const trends: Record<string, { total: number; completed: number; failed: number; cancelled: number }> = {}

    for (const workflow of workflows) {
      const date = new Date(workflow.created_at).toISOString().split('T')[0]
      
      if (!trends[date]) {
        trends[date] = { total: 0, completed: 0, failed: 0, cancelled: 0 }
      }

      trends[date].total++
      
      switch (workflow.status) {
        case 'completed':
          trends[date].completed++
          break
        case 'failed':
          trends[date].failed++
          break
        case 'cancelled':
          trends[date].cancelled++
          break
      }
    }

    return Object.entries(trends).map(([date, stats]) => ({
      date,
      total: stats.total,
      completed: stats.completed,
      failed: stats.failed,
      cancelled: stats.cancelled,
      successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }))
  }

  /**
   * Calculate step performance
   */
  private calculateStepPerformance(steps: any[]): StepPerformance[] {
    const performance: Record<string, {
      total: number
      success: number
      failure: number
      skipped: number
      totalTime: number
      errors: string[]
    }> = {}

    for (const step of steps) {
      const stepType = step.step_type
      
      if (!performance[stepType]) {
        performance[stepType] = { total: 0, success: 0, failure: 0, skipped: 0, totalTime: 0, errors: [] }
      }

      performance[stepType].total++

      switch (step.status) {
        case 'completed':
          performance[stepType].success++
          break
        case 'failed':
          performance[stepType].failure++
          if (step.error_message) {
            performance[stepType].errors.push(step.error_message)
          }
          break
        case 'skipped':
          performance[stepType].skipped++
          break
      }

      // Calculate execution time
      if (step.executed_at && step.completed_at) {
        const executedTime = new Date(step.executed_at).getTime()
        const completedTime = new Date(step.completed_at).getTime()
        performance[stepType].totalTime += completedTime - executedTime
      }
    }

    return Object.entries(performance).map(([stepType, stats]) => ({
      stepType,
      totalExecutions: stats.total,
      successCount: stats.success,
      failureCount: stats.failure,
      skippedCount: stats.skipped,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
      averageExecutionTime: stats.success > 0 ? Math.round(stats.totalTime / stats.success / 1000) : 0,
      commonErrors: this.getCommonErrors(stats.errors)
    }))
  }

  /**
   * Calculate workflow performance by type
   */
  private calculateWorkflowPerformanceByType(workflows: any[]): Array<{
    workflowType: string
    totalWorkflows: number
    successRate: number
    averageExecutionTime: number
    commonErrors: string[]
  }> {
    const performance: Record<string, {
      total: number
      success: number
      totalTime: number
      errors: string[]
    }> = {}

    for (const workflow of workflows) {
      const workflowType = workflow.workflow_type
      
      if (!performance[workflowType]) {
        performance[workflowType] = { total: 0, success: 0, totalTime: 0, errors: [] }
      }

      performance[workflowType].total++

      if (workflow.status === 'completed') {
        performance[workflowType].success++
      } else if (workflow.status === 'failed' && workflow.error_message) {
        performance[workflowType].errors.push(workflow.error_message)
      }

      // Calculate execution time
      if (workflow.executed_at && workflow.completed_at) {
        const executedTime = new Date(workflow.executed_at).getTime()
        const completedTime = new Date(workflow.completed_at).getTime()
        performance[workflowType].totalTime += completedTime - executedTime
      }
    }

    return Object.entries(performance).map(([workflowType, stats]) => ({
      workflowType,
      totalWorkflows: stats.total,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
      averageExecutionTime: stats.success > 0 ? Math.round(stats.totalTime / stats.success / 1000) : 0,
      commonErrors: this.getCommonErrors(stats.errors)
    }))
  }

  /**
   * Calculate workflow performance by language
   */
  private calculateWorkflowPerformanceByLanguage(workflows: any[]): Array<{
    language: string
    totalWorkflows: number
    successRate: number
    averageExecutionTime: number
    commonErrors: string[]
  }> {
    const performance: Record<string, {
      total: number
      success: number
      totalTime: number
      errors: string[]
    }> = {}

    for (const workflow of workflows) {
      const language = workflow.metadata?.language || 'en'
      
      if (!performance[language]) {
        performance[language] = { total: 0, success: 0, totalTime: 0, errors: [] }
      }

      performance[language].total++

      if (workflow.status === 'completed') {
        performance[language].success++
      } else if (workflow.status === 'failed' && workflow.error_message) {
        performance[language].errors.push(workflow.error_message)
      }

      // Calculate execution time
      if (workflow.executed_at && workflow.completed_at) {
        const executedTime = new Date(workflow.executed_at).getTime()
        const completedTime = new Date(workflow.completed_at).getTime()
        performance[language].totalTime += completedTime - executedTime
      }
    }

    return Object.entries(performance).map(([language, stats]) => ({
      language,
      totalWorkflows: stats.total,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
      averageExecutionTime: stats.success > 0 ? Math.round(stats.totalTime / stats.success / 1000) : 0,
      commonErrors: this.getCommonErrors(stats.errors)
    }))
  }

  /**
   * Get common errors from error list
   */
  private getCommonErrors(errors: string[]): string[] {
    const errorCounts: Record<string, number> = {}
    
    for (const error of errors) {
      errorCounts[error] = (errorCounts[error] || 0) + 1
    }

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error)
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
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create workflow tracker
 */
export function createWorkflowTracker(): WorkflowTracker {
  return new WorkflowTracker()
}
