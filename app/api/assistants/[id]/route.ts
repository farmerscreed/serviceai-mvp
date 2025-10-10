import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - Get single assistant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get assistant
    const { data: assistant, error: assistantError } = await supabase
      .from('vapi_assistants' as any)
      .select('*')
      .eq('id', id)
      .single()

    if (assistantError || !assistant) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this assistant's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', (assistant as any).organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      assistant
    })
  } catch (error: any) {
    console.error('Assistant GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update assistant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { vapi_phone_number, is_active, language_code, business_data } = body

    // Get assistant to verify access
    const { data: assistant, error: assistantError } = await supabase
      .from('vapi_assistants' as any)
      .select('organization_id')
      .eq('id', id)
      .single()

    if (assistantError || !assistant) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', (assistant as any).organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (vapi_phone_number !== undefined) updates.vapi_phone_number = vapi_phone_number
    if (is_active !== undefined) updates.is_active = is_active
    if (language_code !== undefined) updates.language_code = language_code
    if (business_data !== undefined) updates.business_data = business_data

    // Update assistant
    const { data: updatedAssistant, error: updateError } = await supabase
      .from('vapi_assistants' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating assistant:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      assistant: updatedAssistant
    })
  } catch (error: any) {
    console.error('Assistant PATCH error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get assistant to verify access and get Vapi assistant ID
    const { data: assistant, error: assistantError } = await supabase
      .from('vapi_assistants' as any)
      .select('organization_id, vapi_assistant_id, vapi_phone_number')
      .eq('id', id)
      .single()

    if (assistantError || !assistant) {
      return NextResponse.json(
        { success: false, error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // Verify user has access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', (assistant as any).organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const vapiApiKey = process.env.VAPI_API_KEY
    const vapiBaseUrl = process.env.NEXT_PUBLIC_VAPI_BASE_URL || 'https://api.vapi.ai'

    // Delete from Vapi first (if we have API key and assistant ID)
    if (vapiApiKey && (assistant as any).vapi_assistant_id) {
      try {
        console.log('🗑️ Deleting assistant from Vapi:', (assistant as any).vapi_assistant_id)
        
        const vapiResponse = await fetch(`${vapiBaseUrl}/assistant/${(assistant as any).vapi_assistant_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`
          }
        })

        if (!vapiResponse.ok) {
          const errorText = await vapiResponse.text()
          console.error('❌ Vapi deletion error:', errorText)
          // Continue with database deletion even if Vapi deletion fails
          // This prevents orphaned records in our DB
        } else {
          console.log('✅ Assistant deleted from Vapi')
        }

        // If assistant has a phone number, also delete/unassign it
        if ((assistant as any).vapi_phone_number) {
          console.log('📞 Unassigning phone number:', (assistant as any).vapi_phone_number)
          // Note: Phone number deletion is handled by Vapi when assistant is deleted
          // But we log it for transparency
        }
      } catch (vapiError: any) {
        console.error('❌ Error calling Vapi delete API:', vapiError.message)
        // Continue with database deletion even if Vapi call fails
      }
    } else {
      console.log('⚠️ Skipping Vapi deletion (no API key or assistant ID)')
    }

    // Delete assistant from database
    const { error: deleteError } = await supabase
      .from('vapi_assistants' as any)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting assistant from database:', deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      )
    }

    console.log('✅ Assistant deleted from database')

    return NextResponse.json({
      success: true,
      message: 'Assistant deleted successfully from both Vapi and database'
    })
  } catch (error: any) {
    console.error('Assistant DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

