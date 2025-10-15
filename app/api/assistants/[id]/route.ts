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

    // Get assistant to verify access and get Vapi IDs
    const { data: assistant, error: assistantError } = await supabase
      .from('vapi_assistants' as any)
      .select('organization_id, vapi_assistant_id, vapi_phone_number, phone_provider')
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

    console.log('')
    console.log('╔═══════════════════════════════════════════════════════════╗')
    console.log('║  🗑️  DELETING ASSISTANT AND PHONE NUMBER                 ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')
    console.log(`   Assistant ID: ${(assistant as any).vapi_assistant_id}`)
    console.log(`   Phone Number: ${(assistant as any).vapi_phone_number || 'None'}`)
    console.log('')

    let phoneNumberDeleted = false
    let assistantDeleted = false

    // Step 1: Get phone number ID from phone_number_assignments table
    let phoneNumberId: string | null = null
    if ((assistant as any).vapi_phone_number) {
      const { data: phoneAssignment } = await (supabase as any).from('phone_number_assignments')
        .select('vapi_phone_number_id')
        .eq('vapi_assistant_id', (assistant as any).vapi_assistant_id)
        .eq('status', 'active')
        .single()

      phoneNumberId = phoneAssignment?.vapi_phone_number_id || null
      console.log(`📞 Phone Number ID from tracking: ${phoneNumberId || 'Not found in tracking table'}`)
    }

    // Step 2: Delete phone number from Vapi first (if we have the ID)
    if (vapiApiKey && phoneNumberId) {
      try {
        console.log(`🗑️  Step 1/3: Deleting phone number from Vapi: ${phoneNumberId}`)

        const phoneDeleteResponse = await fetch(`${vapiBaseUrl}/phone-number/${phoneNumberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`
          }
        })

        if (!phoneDeleteResponse.ok) {
          const errorText = await phoneDeleteResponse.text()
          console.error('❌ Vapi phone number deletion error:', errorText)
          console.warn('   Continuing with assistant deletion...')
        } else {
          console.log('✅ Phone number deleted from Vapi')
          phoneNumberDeleted = true
        }
      } catch (phoneError: any) {
        console.error('❌ Error calling Vapi phone delete API:', phoneError.message)
        console.warn('   Continuing with assistant deletion...')
      }
    } else if ((assistant as any).vapi_phone_number && !phoneNumberId) {
      console.warn('⚠️  Phone number exists but ID not found in tracking table')
      console.warn('   Skipping Vapi phone deletion - may need manual cleanup')
    }

    // Step 3: Delete assistant from Vapi
    if (vapiApiKey && (assistant as any).vapi_assistant_id) {
      try {
        console.log(`🗑️  Step 2/3: Deleting assistant from Vapi: ${(assistant as any).vapi_assistant_id}`)

        const vapiResponse = await fetch(`${vapiBaseUrl}/assistant/${(assistant as any).vapi_assistant_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`
          }
        })

        if (!vapiResponse.ok) {
          const errorText = await vapiResponse.text()
          console.error('❌ Vapi assistant deletion error:', errorText)
          console.warn('   Continuing with database deletion to prevent orphaned records...')
        } else {
          console.log('✅ Assistant deleted from Vapi')
          assistantDeleted = true
        }
      } catch (vapiError: any) {
        console.error('❌ Error calling Vapi assistant delete API:', vapiError.message)
        console.warn('   Continuing with database deletion...')
      }
    } else {
      console.log('⚠️  Skipping Vapi deletion (no API key or assistant ID)')
    }

    // Step 4: Clean up phone_number_assignments table
    if ((assistant as any).vapi_assistant_id) {
      console.log('🗑️  Step 3/3: Cleaning up database records...')

      const { error: assignmentDeleteError } = await (supabase as any).from('phone_number_assignments')
        .delete()
        .eq('vapi_assistant_id', (assistant as any).vapi_assistant_id)

      if (assignmentDeleteError) {
        console.error('❌ Error deleting phone assignment:', assignmentDeleteError.message)
      } else {
        console.log('✅ Phone number assignment record deleted')
      }
    }

    // Step 5: Delete assistant from vapi_assistants table
    const { error: deleteError } = await supabase
      .from('vapi_assistants' as any)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Error deleting assistant from database:', deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      )
    }

    console.log('✅ Assistant deleted from vapi_assistants table')
    console.log('')
    console.log('╔═══════════════════════════════════════════════════════════╗')
    console.log('║  ✅ DELETION COMPLETE                                     ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')
    console.log(`   Phone Number: ${phoneNumberDeleted ? '✅ Deleted from Vapi' : '⚠️  Skipped or failed'}`)
    console.log(`   Assistant: ${assistantDeleted ? '✅ Deleted from Vapi' : '⚠️  Skipped or failed'}`)
    console.log(`   Database: ✅ All records deleted`)
    console.log('')

    return NextResponse.json({
      success: true,
      message: 'Assistant and phone number deleted successfully',
      details: {
        phoneNumberDeleted,
        assistantDeleted,
        databaseCleaned: true
      }
    })
  } catch (error: any) {
    console.error('Assistant DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

