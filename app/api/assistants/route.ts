import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations
    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        assistants: []
      })
    }

    // Fetch assistants with phone number assignments
    const { data: assistants, error: assistantsError } = await supabase
      .from('vapi_assistants')
      .select(`
        *,
        phone_number_assignments (
          phone_number,
          vapi_phone_number_id,
          phone_provider
        )
      `)
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })

    if (assistantsError) {
      console.error('Error fetching assistants:', assistantsError)
      return NextResponse.json(
        { success: false, assistants: [], error: assistantsError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      assistants: assistants || []
    })
  } catch (error: any) {
    console.error('Assistants GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

