// Workflow Create API - Task 3.2
// Create new SMS workflows

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SMSWorkflowEngine } from '@/lib/sms/sms-workflow-engine'
import { z } from 'zod'

// Request validation schema
const CreateWorkflowRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  customerId: z.string().uuid('Invalid customer ID'),
  workflowType: z.enum(['appointment_confirmation', 'appointment_reminder', 'emergency_alert', 'follow_up', 'survey']),
  scheduledAt: z.string().datetime('Invalid scheduled date'),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Workflow Create API called')

    // Parse and validate request
    const body = await request.json()
    const validatedData = CreateWorkflowRequestSchema.parse(body)

    // Get organization context
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify organization access
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', validatedData.organizationId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      )
    }

    // Create workflow
    const workflowEngine = new SMSWorkflowEngine()
    const workflow = await workflowEngine.createWorkflow(
      validatedData.organizationId,
      validatedData.customerId,
      validatedData.workflowType,
      validatedData.scheduledAt,
      validatedData.metadata || {}
    )

    console.log(`✅ Workflow created: ${workflow.id}`)

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        organizationId: workflow.organizationId,
        customerId: workflow.customerId,
        workflowType: workflow.workflowType,
        status: workflow.status,
        scheduledAt: workflow.scheduledAt,
        metadata: workflow.metadata
      }
    })

  } catch (error) {
    console.error('Workflow Create API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
