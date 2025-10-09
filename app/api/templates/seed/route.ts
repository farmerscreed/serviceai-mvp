import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

import { HVAC_TEMPLATE_EN, HVAC_TEMPLATE_ES } from '@/lib/templates/industry-templates/hvac-template'
import { ELECTRICAL_TEMPLATE_EN } from '@/lib/templates/industry-templates/electrical-template'
import { PLUMBING_TEMPLATE_EN } from '@/lib/templates/industry-templates/plumbing-template'

// Try to import ES variants if exported similarly
let ELECTRICAL_TEMPLATE_ES: any | null = null
let PLUMBING_TEMPLATE_ES: any | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ELECTRICAL_TEMPLATE_ES = require('@/lib/templates/industry-templates/electrical-template').ELECTRICAL_TEMPLATE_ES
} catch {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PLUMBING_TEMPLATE_ES = require('@/lib/templates/industry-templates/plumbing-template').PLUMBING_TEMPLATE_ES
} catch {}

function toEsVariantIfMissing(t: any): any | null {
  if (!t) return null
  return {
    ...t,
    id: `${t.industry_code}-es-template-auto`,
    language_code: 'es',
    display_name: `${t.display_name} (ES)`
  }
}

function toDbRow(t: any) {
  return {
    industry_code: t.industry_code,
    language_code: t.language_code,
    display_name: t.display_name,
    template_config: t.template_config,
    emergency_patterns: t.emergency_patterns,
    appointment_types: t.appointment_types,
    required_fields: t.required_fields,
    sms_templates: t.sms_templates,
    cultural_guidelines: t.cultural_guidelines,
    integration_requirements: t.integration_requirements,
    version: t.version ?? 1,
    is_active: t.is_active ?? true,
  }
}

export async function POST() {
  try {
    const admin = createAdminClient()

    let templates = [
      HVAC_TEMPLATE_EN,
      HVAC_TEMPLATE_ES,
      ELECTRICAL_TEMPLATE_EN,
      PLUMBING_TEMPLATE_EN,
      ELECTRICAL_TEMPLATE_ES,
      PLUMBING_TEMPLATE_ES,
    ].filter(Boolean)

    // Auto-generate ES variants if missing
    const hasElectricalEs = templates.some((t: any) => t.industry_code === 'electrical' && t.language_code === 'es')
    const hasPlumbingEs = templates.some((t: any) => t.industry_code === 'plumbing' && t.language_code === 'es')
    if (!hasElectricalEs) {
      const auto = toEsVariantIfMissing(ELECTRICAL_TEMPLATE_EN)
      if (auto) templates.push(auto)
    }
    if (!hasPlumbingEs) {
      const auto = toEsVariantIfMissing(PLUMBING_TEMPLATE_EN)
      if (auto) templates.push(auto)
    }

    const rows = templates.map(toDbRow)

    const { data, error } = await admin
      .from('industry_templates')
      .upsert(rows, { onConflict: 'industry_code,language_code' })
      .select('industry_code,language_code,version,is_active')

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, inserted: data?.length ?? 0, items: data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
// API Route for Seeding Industry Templates
// Task 1.4: Industry Template Definitions
