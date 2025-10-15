// SMS Templates API Route
// Manages SMS templates for organizations

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { smsTemplateSystem } from '@/lib/sms/sms-template-system'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const category = searchParams.get('category')
    const language = searchParams.get('language') as 'en' | 'es' || 'en'

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    let templates

    if (category) {
      templates = await smsTemplateSystem.getTemplatesByCategory(category, language)
    } else {
      // Get all template keys
      const keys = await smsTemplateSystem.getTemplateKeys()
      templates = []
      
      for (const key of keys) {
        const template = await smsTemplateSystem.getTemplate(key, language)
        if (template) {
          templates.push(template)
        }
      }
    }

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length
    })

  } catch (error) {
    console.error('SMS templates error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      key, 
      language, 
      content, 
      variables, 
      category, 
      organizationId 
    } = body

    // Validate required fields
    if (!key || !language || !content || !category || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, language, content, category, organizationId' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    // Create template
    const template = await smsTemplateSystem.saveTemplate({
      key,
      language,
      content,
      variables: variables || [],
      category,
      is_active: true
    })

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('SMS template creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      id,
      key, 
      language, 
      content, 
      variables, 
      category, 
      is_active,
      organizationId 
    } = body

    // Validate required fields
    if (!id || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Template ID and Organization ID are required' },
        { status: 400 }
      )
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Not a member of this organization' },
        { status: 403 }
      )
    }

    // Update template
    const template = await smsTemplateSystem.saveTemplate({
      id,
      key,
      language,
      content,
      variables,
      category,
      is_active
    })

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('SMS template update error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
