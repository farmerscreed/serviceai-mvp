-- Task 3.2: SMS Workflow Engine Database Schema
-- Create tables for SMS workflows, steps, and execution tracking

-- =====================================================
-- SMS Workflows Table
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL CHECK (workflow_type IN (
        'appointment_confirmation',
        'appointment_reminder',
        'emergency_alert',
        'follow_up',
        'survey'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'active',
        'completed',
        'cancelled',
        'failed'
    )),
    scheduled_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Workflow Steps Table
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.sms_workflows(id) ON DELETE CASCADE,
    step_type VARCHAR(20) NOT NULL CHECK (step_type IN (
        'send_sms',
        'wait',
        'condition',
        'webhook'
    )),
    order_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'executing',
        'completed',
        'failed',
        'skipped'
    )),
    scheduled_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    config JSONB DEFAULT '{}',
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Workflow Executions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.sms_workflows(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'success',
        'failure',
        'skipped'
    )),
    result JSONB,
    error TEXT,
    executed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Scheduled Tasks Table
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(100) NOT NULL,
    workflow_id UUID NOT NULL REFERENCES public.sms_workflows(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'running',
        'completed',
        'failed',
        'cancelled'
    )),
    priority INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- SMS Workflows indexes
CREATE INDEX IF NOT EXISTS idx_sms_workflows_organization_id ON sms_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_customer_id ON sms_workflows(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_workflow_type ON sms_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_status ON sms_workflows(status);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_scheduled_at ON sms_workflows(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_executed_at ON sms_workflows(executed_at);

-- Workflow Steps indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_step_type ON workflow_steps(step_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON workflow_steps(workflow_id, order_number);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_scheduled_at ON workflow_steps(scheduled_at);

-- Workflow Executions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_step_id ON workflow_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_executed_at ON workflow_executions(executed_at);

-- Scheduled Tasks indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_workflow_id ON scheduled_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_at ON scheduled_tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_priority ON scheduled_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_retry_count ON scheduled_tasks(retry_count);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sms_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- SMS Workflows RLS policies
CREATE POLICY "Users can view SMS workflows for their organization"
ON sms_workflows FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert SMS workflows for their organization"
ON sms_workflows FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update SMS workflows for their organization"
ON sms_workflows FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Workflow Steps RLS policies
CREATE POLICY "Users can view workflow steps for their organization"
ON workflow_steps FOR SELECT
USING (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert workflow steps for their organization"
ON workflow_steps FOR INSERT
WITH CHECK (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can update workflow steps for their organization"
ON workflow_steps FOR UPDATE
USING (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- Workflow Executions RLS policies
CREATE POLICY "Users can view workflow executions for their organization"
ON workflow_executions FOR SELECT
USING (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert workflow executions for their organization"
ON workflow_executions FOR INSERT
WITH CHECK (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- Scheduled Tasks RLS policies
CREATE POLICY "Users can view scheduled tasks for their organization"
ON scheduled_tasks FOR SELECT
USING (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert scheduled tasks for their organization"
ON scheduled_tasks FOR INSERT
WITH CHECK (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can update scheduled tasks for their organization"
ON scheduled_tasks FOR UPDATE
USING (
    workflow_id IN (
        SELECT id 
        FROM sms_workflows 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

-- =====================================================
-- Database Functions for Workflow Analytics
-- =====================================================

-- Function to get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_statistics(
    p_organization_id UUID,
    p_time_range_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS TABLE (
    total_workflows BIGINT,
    active_workflows BIGINT,
    completed_workflows BIGINT,
    failed_workflows BIGINT,
    cancelled_workflows BIGINT,
    success_rate NUMERIC,
    avg_execution_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_workflows,
        COUNT(*) FILTER (WHERE status = 'active') as active_workflows,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_workflows,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_workflows,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_workflows,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0 THEN
                ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - executed_at))) FILTER (WHERE status = 'completed'), 2)
            ELSE 0
        END as avg_execution_time_seconds
    FROM sms_workflows
    WHERE organization_id = p_organization_id
    AND created_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get workflow trends
CREATE OR REPLACE FUNCTION get_workflow_trends(
    p_organization_id UUID,
    p_time_range_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS TABLE (
    date_hour TIMESTAMPTZ,
    total_workflows BIGINT,
    completed_workflows BIGINT,
    failed_workflows BIGINT,
    cancelled_workflows BIGINT,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('hour', created_at) as date_hour,
        COUNT(*) as total_workflows,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_workflows,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_workflows,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_workflows,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate
    FROM sms_workflows
    WHERE organization_id = p_organization_id
    AND created_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours
    GROUP BY DATE_TRUNC('hour', created_at)
    ORDER BY date_hour ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get step performance
CREATE OR REPLACE FUNCTION get_step_performance(
    p_organization_id UUID,
    p_time_range_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS TABLE (
    step_type VARCHAR(20),
    total_executions BIGINT,
    success_count BIGINT,
    failure_count BIGINT,
    skipped_count BIGINT,
    success_rate NUMERIC,
    avg_execution_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ws.step_type,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE ws.status = 'completed') as success_count,
        COUNT(*) FILTER (WHERE ws.status = 'failed') as failure_count,
        COUNT(*) FILTER (WHERE ws.status = 'skipped') as skipped_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE ws.status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as success_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE ws.status = 'completed') > 0 THEN
                ROUND(AVG(EXTRACT(EPOCH FROM (ws.completed_at - ws.executed_at))) FILTER (WHERE ws.status = 'completed'), 2)
            ELSE 0
        END as avg_execution_time_seconds
    FROM workflow_steps ws
    JOIN sms_workflows sw ON ws.workflow_id = sw.id
    WHERE sw.organization_id = p_organization_id
    AND ws.executed_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours
    GROUP BY ws.step_type
    ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for Updated At
-- =====================================================

-- SMS Workflows updated_at trigger
CREATE OR REPLACE FUNCTION update_sms_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sms_workflows_updated_at
    BEFORE UPDATE ON sms_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_workflows_updated_at();

-- Workflow Steps updated_at trigger
CREATE OR REPLACE FUNCTION update_workflow_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_steps_updated_at();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE sms_workflows IS 'Stores SMS workflow definitions and execution status';
COMMENT ON TABLE workflow_steps IS 'Stores individual steps within SMS workflows';
COMMENT ON TABLE workflow_executions IS 'Tracks execution results for workflow steps';
COMMENT ON TABLE scheduled_tasks IS 'Manages scheduled execution of SMS workflows';

COMMENT ON COLUMN sms_workflows.organization_id IS 'Organization that owns this workflow';
COMMENT ON COLUMN sms_workflows.customer_id IS 'Customer associated with this workflow';
COMMENT ON COLUMN sms_workflows.workflow_type IS 'Type of SMS workflow (appointment_confirmation, appointment_reminder, emergency_alert, follow_up, survey)';
COMMENT ON COLUMN sms_workflows.status IS 'Current status of the workflow (pending, active, completed, cancelled, failed)';
COMMENT ON COLUMN sms_workflows.scheduled_at IS 'When the workflow is scheduled to execute';
COMMENT ON COLUMN sms_workflows.executed_at IS 'When the workflow started executing';
COMMENT ON COLUMN sms_workflows.completed_at IS 'When the workflow completed execution';
COMMENT ON COLUMN sms_workflows.error_message IS 'Error message if workflow failed';
COMMENT ON COLUMN sms_workflows.metadata IS 'Additional workflow configuration and data';

COMMENT ON COLUMN workflow_steps.workflow_id IS 'Workflow this step belongs to';
COMMENT ON COLUMN workflow_steps.step_type IS 'Type of step (send_sms, wait, condition, webhook)';
COMMENT ON COLUMN workflow_steps.order_number IS 'Order of execution within the workflow';
COMMENT ON COLUMN workflow_steps.status IS 'Current status of the step (pending, executing, completed, failed, skipped)';
COMMENT ON COLUMN workflow_steps.scheduled_at IS 'When the step is scheduled to execute';
COMMENT ON COLUMN workflow_steps.executed_at IS 'When the step started executing';
COMMENT ON COLUMN workflow_steps.completed_at IS 'When the step completed execution';
COMMENT ON COLUMN workflow_steps.error_message IS 'Error message if step failed';
COMMENT ON COLUMN workflow_steps.config IS 'Step configuration and parameters';
COMMENT ON COLUMN workflow_steps.result IS 'Step execution result';

COMMENT ON COLUMN workflow_executions.workflow_id IS 'Workflow this execution belongs to';
COMMENT ON COLUMN workflow_executions.step_id IS 'Step this execution belongs to';
COMMENT ON COLUMN workflow_executions.status IS 'Execution status (success, failure, skipped)';
COMMENT ON COLUMN workflow_executions.result IS 'Execution result data';
COMMENT ON COLUMN workflow_executions.error IS 'Error message if execution failed';
COMMENT ON COLUMN workflow_executions.executed_at IS 'When the execution occurred';

COMMENT ON COLUMN scheduled_tasks.task_name IS 'Name of the scheduled task';
COMMENT ON COLUMN scheduled_tasks.workflow_id IS 'Workflow to execute';
COMMENT ON COLUMN scheduled_tasks.scheduled_at IS 'When the task is scheduled to run';
COMMENT ON COLUMN scheduled_tasks.status IS 'Current status of the task (pending, running, completed, failed, cancelled)';
COMMENT ON COLUMN scheduled_tasks.priority IS 'Task priority (1-10, higher is more important)';
COMMENT ON COLUMN scheduled_tasks.retry_count IS 'Number of times the task has been retried';
COMMENT ON COLUMN scheduled_tasks.max_retries IS 'Maximum number of retries allowed';
COMMENT ON COLUMN scheduled_tasks.result IS 'Task execution result';
COMMENT ON COLUMN scheduled_tasks.error IS 'Error message if task failed';
COMMENT ON COLUMN scheduled_tasks.executed_at IS 'When the task was executed';
