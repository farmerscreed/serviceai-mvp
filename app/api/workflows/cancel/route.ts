// Workflow Cancel API - Task 3.2
// Cancel SMS workflows

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SMSWorkflowEngine } from '@/lib/sms/sms-workflow-engine'
import { z } from 'zod'

// Request validation schema
const CancelWorkflowRequestSchema = z.object({
  workflowId: z.string().uuid('Invalid workflow ID')
})

export async function POST(request: NextRequest) {
  try {
    console.log('❌ Workflow Cancel API called')

    // Parse and validate request
    const body = await request.json()
    const validatedData = CancelWorkflowRequestSchema.parse(body)

    // Get organization context
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get workflow and verify organization access
    const { data: workflow, error: workflowError } = await supabase
      .from('sms_workflows')
      .select(`
        *,
        organizations!inner(
          id,
          organization_members!inner(
            user_id,
            role
          )
        )
      `)
      .eq('id', validatedData.workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check if user has access to the organization
    const hasAccess = workflow.organizations.organization_members.some(
      (member: any) => member.user_id === user.id
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      )
    }

    // Cancel workflow
    const workflowEngine = new SMSWorkflowEngine()
    await workflowEngine.cancelWorkflow(validatedData.workflowId)

    console.log(`✅ Workflow cancelled: ${validatedData.workflowId}`)

    return NextResponse.json({
      success: true,
      workflowId: validatedData.workflowId,
      status: 'cancelled'
    })

  } catch (error) {
    console.error('Workflow Cancel API error:', error)

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
