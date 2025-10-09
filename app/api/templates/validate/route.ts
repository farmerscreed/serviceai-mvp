import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('industry_templates')
      .select('*')
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    const results = (data || []).map((t: any) => {
      const errors: string[] = []
      const warnings: string[] = []

      if (!t.industry_code) errors.push('industry_code missing')
      if (!t.language_code) errors.push('language_code missing')
      if (!t.display_name) errors.push('display_name missing')
      if (!t.template_config) errors.push('template_config missing')
      if (!t.emergency_patterns) errors.push('emergency_patterns missing')
      if (!t.appointment_types) errors.push('appointment_types missing')
      if (!t.sms_templates) errors.push('sms_templates missing')
      if (!t.cultural_guidelines) errors.push('cultural_guidelines missing')

      const kp = t.emergency_patterns?.keywords
      if (!kp?.en?.length) errors.push('English emergency keywords missing')
      if (!kp?.es?.length) errors.push('Spanish emergency keywords missing')

      const sms = t.sms_templates || {}
      const requiredSMSTypes = [
        'appointment_confirmation',
        'appointment_reminder',
        'emergency_alert',
        'emergency_confirmation',
        'status_update',
        'follow_up'
      ]
      for (const key of requiredSMSTypes) {
        if (!sms[key]) warnings.push(`SMS template missing: ${key}`)
      }

      return {
        industry_code: t.industry_code,
        language_code: t.language_code,
        valid: errors.length === 0,
        errors,
        warnings
      }
    })

    const valid = results.every(r => r.valid)
    return NextResponse.json({ success: true, valid, results })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


