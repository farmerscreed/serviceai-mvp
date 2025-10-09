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
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          active: 0,
          byIndustry: {},
          byLanguage: {}
        }
      })
    }

    // Get assistants count
    const { data: assistants, error: assistError } = await supabase
      .from('vapi_assistants')
      .select('id, industry_code, language_code, is_active')
      .in('organization_id', orgIds)

    if (assistError) {
      console.error('Error fetching assistants:', assistError)
      return NextResponse.json({ error: assistError.message }, { status: 400 })
    }

    // Calculate stats
    const total = assistants?.length || 0
    const active = assistants?.filter(a => a.is_active).length || 0
    
    const byIndustry: Record<string, number> = {}
    const byLanguage: Record<string, number> = {}
    
    assistants?.forEach(a => {
      byIndustry[a.industry_code] = (byIndustry[a.industry_code] || 0) + 1
      byLanguage[a.language_code] = (byLanguage[a.language_code] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      stats: {
        total,
        active,
        byIndustry,
        byLanguage
      },
      assistants: assistants || []
    })
  } catch (error: any) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

