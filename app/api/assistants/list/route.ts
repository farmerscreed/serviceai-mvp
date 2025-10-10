import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 })
    }

    const orgIds = orgs?.map(o => o.organization_id) || []

    if (orgIds.length === 0) {
      return NextResponse.json({ success: true, assistants: [], count: 0 })
    }

    // Get assistants for user's organizations
    const { data: assistants, error: assistError } = await supabase
      .from('vapi_assistants' as any)
      .select(`
        id,
        organization_id,
        industry_code,
        language_code,
        vapi_assistant_id,
        vapi_phone_number,
        business_data,
        voice_config,
        is_active,
        created_at,
        updated_at
      `)
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })

    if (assistError) {
      return NextResponse.json({ error: assistError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      assistants: assistants || [],
      count: assistants?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

