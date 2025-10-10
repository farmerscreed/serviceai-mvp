// Template Loader - Load and manage industry templates
// Task 1.4: Industry Template Definitions

import { createServerClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type { IndustryTemplate } from './types'
import { HVAC_TEMPLATE_EN, HVAC_TEMPLATE_ES } from './industry-templates/hvac-template'
import { PLUMBING_TEMPLATE_EN, PLUMBING_TEMPLATE_ES } from './industry-templates/plumbing-template'
import { ELECTRICAL_TEMPLATE_EN, ELECTRICAL_TEMPLATE_ES } from './industry-templates/electrical-template'

export class TemplateLoader {
  private isServer: boolean

  constructor(isServer: boolean = true) {
    this.isServer = isServer
  }

  // =====================================================
  // Template Seeding
  // =====================================================

  /**
   * Seed all industry templates into the database
   */
  async seedAllTemplates(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    const templates = this.getAllTemplates()

    for (const template of templates) {
      try {
        await this.seedTemplate(template)
        console.log(`✅ Seeded template: ${template.industry_code}_${template.language_code}`)
      } catch (error) {
        const errorMsg = `Failed to seed ${template.industry_code}_${template.language_code}: ${error}`
        errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  /**
   * Seed a single template into the database
   */
  async seedTemplate(template: IndustryTemplate): Promise<void> {
    const supabase = this.isServer ? await createServerClient() : createBrowserClient()

    // Check if template already exists
    const { data: existing } = await supabase
      .from('industry_templates')
      .select('id')
      .eq('industry_code', template.industry_code)
      .eq('language_code', template.language_code)
      .single()

    if (existing) {
      // Update existing template
      const { error } = await supabase
        .from('industry_templates')
        .update({
          display_name: template.display_name,
          template_config: template.template_config as any,
          emergency_patterns: template.emergency_patterns as any,
          appointment_types: template.appointment_types as any,
          required_fields: template.required_fields as any,
          sms_templates: template.sms_templates as any,
          cultural_guidelines: template.cultural_guidelines as any,
          integration_requirements: template.integration_requirements as any,
          version: template.version,
          is_active: template.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        throw new Error(`Update failed: ${error.message}`)
      }
    } else {
      // Insert new template
      const { error } = await supabase
        .from('industry_templates')
        .insert({
          industry_code: template.industry_code,
          language_code: template.language_code,
          display_name: template.display_name,
          template_config: template.template_config as any,
          emergency_patterns: template.emergency_patterns as any,
          appointment_types: template.appointment_types as any,
          required_fields: template.required_fields as any,
          sms_templates: template.sms_templates as any,
          cultural_guidelines: template.cultural_guidelines as any,
          integration_requirements: template.integration_requirements as any,
          version: template.version,
          is_active: template.is_active
        })

      if (error) {
        throw new Error(`Insert failed: ${error.message}`)
      }
    }
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): IndustryTemplate[] {
    return [
      HVAC_TEMPLATE_EN,
      HVAC_TEMPLATE_ES,
      PLUMBING_TEMPLATE_EN,
      PLUMBING_TEMPLATE_ES,
      ELECTRICAL_TEMPLATE_EN,
      ELECTRICAL_TEMPLATE_ES
    ]
  }

  /**
   * Get templates by industry
   */
  getTemplatesByIndustry(industryCode: string): IndustryTemplate[] {
    return this.getAllTemplates().filter(t => t.industry_code === industryCode)
  }

  /**
   * Get templates by language
   */
  getTemplatesByLanguage(languageCode: string): IndustryTemplate[] {
    return this.getAllTemplates().filter(t => t.language_code === languageCode)
  }

  /**
   * Get specific template
   */
  getTemplate(industryCode: string, languageCode: string): IndustryTemplate | null {
    return this.getAllTemplates().find(
      t => t.industry_code === industryCode && t.language_code === languageCode
    ) || null
  }

  // =====================================================
  // Template Validation
  // =====================================================

  /**
   * Validate all templates
   */
  validateAllTemplates(): { valid: boolean; results: Record<string, any> } {
    const templates = this.getAllTemplates()
    const results: Record<string, any> = {}
    let allValid = true

    for (const template of templates) {
      const key = `${template.industry_code}_${template.language_code}`
      const validation = this.validateTemplate(template)
      results[key] = validation
      
      if (!validation.valid) {
        allValid = false
      }
    }

    return { valid: allValid, results }
  }

  /**
   * Validate a single template
   */
  validateTemplate(template: IndustryTemplate): {
    valid: boolean
    errors: string[]
    warnings: string[]
    missing_fields: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    const missingFields: string[] = []

    // Check required fields
    if (!template.industry_code) missingFields.push('industry_code')
    if (!template.language_code) missingFields.push('language_code')
    if (!template.display_name) missingFields.push('display_name')
    if (!template.template_config) missingFields.push('template_config')
    if (!template.emergency_patterns) missingFields.push('emergency_patterns')
    if (!template.appointment_types) missingFields.push('appointment_types')
    if (!template.sms_templates) missingFields.push('sms_templates')
    if (!template.cultural_guidelines) missingFields.push('cultural_guidelines')

    // Validate emergency patterns
    if (template.emergency_patterns) {
      if (!template.emergency_patterns.keywords.en?.length) {
        errors.push('English emergency keywords missing')
      }
      if (!template.emergency_patterns.keywords.es?.length) {
        errors.push('Spanish emergency keywords missing')
      }
    }

    // Validate appointment types
    if (template.appointment_types) {
      const appointmentKeys = Object.keys(template.appointment_types)
      if (appointmentKeys.length === 0) {
        warnings.push('No appointment types defined')
      }
    }

    // Validate SMS templates
    if (template.sms_templates) {
      const requiredSMSTypes = ['appointment_confirmation', 'appointment_reminder', 'emergency_alert']
      for (const smsType of requiredSMSTypes) {
        if (!template.sms_templates[smsType as keyof typeof template.sms_templates]) {
          warnings.push(`SMS template missing: ${smsType}`)
        }
      }
    }

    // Validate cultural guidelines
    if (template.cultural_guidelines) {
      const requiredGuidelines = ['communication_style', 'formality_level', 'urgency_expression']
      for (const guideline of requiredGuidelines) {
        if (!template.cultural_guidelines[guideline as keyof typeof template.cultural_guidelines]) {
          warnings.push(`Cultural guideline missing: ${guideline}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missing_fields: missingFields
    }
  }

  // =====================================================
  // Database Operations
  // =====================================================

  /**
   * Get all templates from database
   */
  async getTemplatesFromDatabase(): Promise<IndustryTemplate[]> {
    const supabase = this.isServer ? await createServerClient() : createBrowserClient()

    const { data, error } = await supabase
      .from('industry_templates')
      .select('*')
      .eq('is_active', true)
      .order('industry_code', { ascending: true })
      .order('language_code', { ascending: true })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data as unknown as IndustryTemplate[]
  }

  /**
   * Get template from database
   */
  async getTemplateFromDatabase(industryCode: string, languageCode: string): Promise<IndustryTemplate | null> {
    const supabase = this.isServer ? await createServerClient() : createBrowserClient()

    const { data, error } = await supabase
      .from('industry_templates')
      .select('*')
      .eq('industry_code', industryCode)
      .eq('language_code', languageCode)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Template not found
      }
      throw new Error(`Database error: ${error.message}`)
    }

    return data as unknown as IndustryTemplate
  }

  /**
   * Delete template from database
   */
  async deleteTemplate(industryCode: string, languageCode: string): Promise<void> {
    const supabase = this.isServer ? await createServerClient() : createBrowserClient()

    const { error } = await supabase
      .from('industry_templates')
      .delete()
      .eq('industry_code', industryCode)
      .eq('language_code', languageCode)

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total_templates: number
    by_industry: Record<string, number>
    by_language: Record<string, number>
    active_templates: number
  }> {
    const templates = await this.getTemplatesFromDatabase()
    
    const stats = {
      total_templates: templates.length,
      by_industry: {} as Record<string, number>,
      by_language: {} as Record<string, number>,
      active_templates: templates.filter(t => t.is_active).length
    }

    for (const template of templates) {
      stats.by_industry[template.industry_code] = (stats.by_industry[template.industry_code] || 0) + 1
      stats.by_language[template.language_code] = (stats.by_language[template.language_code] || 0) + 1
    }

    return stats
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create a server-side template loader
 */
export function createServerTemplateLoader() {
  return new TemplateLoader(true)
}

/**
 * Create a client-side template loader
 */
export function createClientTemplateLoader() {
  return new TemplateLoader(false)
}
