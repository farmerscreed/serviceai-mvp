// SMS Template Manager - Task 3.1
// Manages SMS templates with multi-language support and validation

import { createServerClient } from '@/lib/supabase/server'

export interface SMSTemplate {
  id: string
  templateKey: string
  languageCode: string
  content: string
  variables: string[]
  isActive: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface TemplateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class SMSTemplateManager {
  // =====================================================
  // Template Management
  // =====================================================

  /**
   * Get SMS template with language fallback
   */
  async getTemplate(
    templateKey: string,
    language: 'en' | 'es'
  ): Promise<SMSTemplate | null> {
    try {
      console.log(`📋 Getting SMS template: ${templateKey} (${language})`)

      const supabase = await createServerClient()
      
      // Try to get template in requested language
      const { data: template, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('template_key', templateKey)
        .eq('language_code', language)
        .eq('is_active', true)
        .single()

      if (error || !template) {
        console.warn(`Template ${templateKey} not found in ${language}, trying fallback`)
        
        // Fallback to English if template not available in requested language
        if (language !== 'en') {
          const { data: fallbackTemplate, error: fallbackError } = await supabase
            .from('sms_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('language_code', 'en')
            .eq('is_active', true)
            .single()

          if (!fallbackError && fallbackTemplate) {
            console.log(`✅ Using English fallback for ${templateKey}`)
            return this.mapTemplateToInterface(fallbackTemplate)
          }
        }

        console.error(`Template ${templateKey} not found in any language`)
        return null
      }

      console.log(`✅ Found template: ${templateKey} (${language})`)
      return this.mapTemplateToInterface(template)

    } catch (error) {
      console.error('Error getting SMS template:', error)
      return null
    }
  }

  /**
   * Format template with data
   */
  async formatTemplate(
    template: SMSTemplate,
    data: Record<string, any>
  ): Promise<string> {
    try {
      console.log(`🔧 Formatting template: ${template.templateKey}`)

      let formattedContent = template.content

      // Replace template variables with data
      for (const [key, value] of Object.entries(data)) {
        const placeholder = `{${key}}`
        if (formattedContent.includes(placeholder)) {
          formattedContent = formattedContent.replace(
            new RegExp(placeholder, 'g'),
            String(value || '')
          )
        }
      }

      // Check for any remaining placeholders
      const remainingPlaceholders = formattedContent.match(/\{[^}]+\}/g)
      if (remainingPlaceholders && remainingPlaceholders.length > 0) {
        console.warn(`⚠️ Unfilled placeholders in template: ${remainingPlaceholders.join(', ')}`)
      }

      console.log(`✅ Template formatted successfully`)
      return formattedContent

    } catch (error) {
      console.error('Error formatting template:', error)
      throw new Error(`Template formatting failed: ${error}`)
    }
  }

  /**
   * Validate template structure
   */
  async validateTemplate(template: SMSTemplate): Promise<TemplateValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check required fields
      if (!template.templateKey) {
        errors.push('Template key is required')
      }

      if (!template.languageCode) {
        errors.push('Language code is required')
      }

      if (!template.content) {
        errors.push('Template content is required')
      }

      // Check content length
      if (template.content.length > 1600) {
        errors.push('Template content exceeds maximum length (1600 characters)')
      } else if (template.content.length > 160) {
        warnings.push('Template content exceeds single SMS length (160 characters)')
      }

      // Check for valid language code
      if (!['en', 'es'].includes(template.languageCode)) {
        errors.push('Invalid language code. Must be "en" or "es"')
      }

      // Check for valid template key format
      if (template.templateKey && !/^[a-z_]+$/.test(template.templateKey)) {
        errors.push('Template key must contain only lowercase letters and underscores')
      }

      // Check for balanced placeholders
      const placeholders = template.content.match(/\{[^}]+\}/g) || []
      const uniquePlaceholders = [...new Set(placeholders)]
      
      if (uniquePlaceholders.length !== template.variables.length) {
        warnings.push('Template variables array may not match placeholders in content')
      }

      // Check for common issues
      if (template.content.includes('{{') || template.content.includes('}}')) {
        warnings.push('Template may contain double braces')
      }

      if (template.content.includes('{ ')) {
        warnings.push('Template may contain spaces in placeholders')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      console.error('Error validating template:', error)
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings: []
      }
    }
  }

  // =====================================================
  // Template CRUD Operations
  // =====================================================

  /**
   * Create new SMS template
   */
  async createTemplate(
    templateKey: string,
    languageCode: 'en' | 'es',
    content: string,
    variables: string[] = []
  ): Promise<SMSTemplate | null> {
    try {
      console.log(`📝 Creating SMS template: ${templateKey} (${languageCode})`)

      const supabase = await createServerClient()
      
      const { data: template, error } = await supabase
        .from('sms_templates')
        .insert({
          template_key: templateKey,
          language_code: languageCode,
          content,
          variables,
          is_active: true,
          version: 1
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ SMS template created: ${template.id}`)
      return this.mapTemplateToInterface(template)

    } catch (error) {
      console.error('Error creating SMS template:', error)
      return null
    }
  }

  /**
   * Update existing SMS template
   */
  async updateTemplate(
    templateId: string,
    content: string,
    variables: string[] = []
  ): Promise<SMSTemplate | null> {
    try {
      console.log(`📝 Updating SMS template: ${templateId}`)

      const supabase = await createServerClient()
      
      const { data: template, error } = await supabase
        .from('sms_templates')
        .update({
          content,
          variables,
          version: supabase.raw('version + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ SMS template updated: ${templateId}`)
      return this.mapTemplateToInterface(template)

    } catch (error) {
      console.error('Error updating SMS template:', error)
      return null
    }
  }

  /**
   * Get all templates for organization
   */
  async getTemplatesForOrganization(
    organizationId: string,
    language?: 'en' | 'es'
  ): Promise<SMSTemplate[]> {
    try {
      console.log(`📋 Getting SMS templates for organization: ${organizationId}`)

      const supabase = await createServerClient()
      
      let query = supabase
        .from('sms_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_key', { ascending: true })

      if (language) {
        query = query.eq('language_code', language)
      }

      const { data: templates, error } = await query

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Found ${templates?.length || 0} SMS templates`)
      return (templates || []).map(template => this.mapTemplateToInterface(template))

    } catch (error) {
      console.error('Error getting SMS templates:', error)
      return []
    }
  }

  // =====================================================
  // Template Utilities
  // =====================================================

  /**
   * Extract variables from template content
   */
  extractVariables(content: string): string[] {
    const placeholders = content.match(/\{[^}]+\}/g) || []
    const variables = placeholders.map(placeholder => 
      placeholder.slice(1, -1) // Remove { and }
    )
    return [...new Set(variables)] // Remove duplicates
  }

  /**
   * Get template statistics
   */
  async getTemplateStatistics(organizationId: string): Promise<{
    totalTemplates: number
    byLanguage: Record<string, number>
    byTemplateKey: Record<string, number>
    averageLength: number
  }> {
    try {
      const supabase = await createServerClient()
      
      const { data: templates, error } = await supabase
        .from('sms_templates')
        .select('template_key, language_code, content')
        .eq('is_active', true)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const stats = {
        totalTemplates: templates?.length || 0,
        byLanguage: {} as Record<string, number>,
        byTemplateKey: {} as Record<string, number>,
        averageLength: 0
      }

      let totalLength = 0

      for (const template of templates || []) {
        // Count by language
        stats.byLanguage[template.language_code] = 
          (stats.byLanguage[template.language_code] || 0) + 1

        // Count by template key
        stats.byTemplateKey[template.template_key] = 
          (stats.byTemplateKey[template.template_key] || 0) + 1

        // Calculate average length
        totalLength += template.content.length
      }

      if (stats.totalTemplates > 0) {
        stats.averageLength = Math.round(totalLength / stats.totalTemplates)
      }

      return stats

    } catch (error) {
      console.error('Error getting template statistics:', error)
      return {
        totalTemplates: 0,
        byLanguage: {},
        byTemplateKey: {},
        averageLength: 0
      }
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Map database template to interface
   */
  private mapTemplateToInterface(template: any): SMSTemplate {
    return {
      id: template.id,
      templateKey: template.template_key,
      languageCode: template.language_code,
      content: template.content,
      variables: template.variables || [],
      isActive: template.is_active,
      version: template.version,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }
  }

  /**
   * Get default SMS templates
   */
  getDefaultTemplates(): Array<{
    templateKey: string
    languageCode: 'en' | 'es'
    content: string
    variables: string[]
  }> {
    return [
      // English templates
      {
        templateKey: 'appointment_confirmation',
        languageCode: 'en',
        content: 'Hi {customer_name}! Your {service_type} appointment is confirmed for {date} at {time}. Address: {address}. Questions? Call {business_phone}',
        variables: ['customer_name', 'service_type', 'date', 'time', 'address', 'business_phone']
      },
      {
        templateKey: 'appointment_reminder',
        languageCode: 'en',
        content: 'Reminder: Your {service_type} appointment is {hours_before}h away ({date} at {time}). Address: {address}. Call {business_phone} to reschedule.',
        variables: ['service_type', 'hours_before', 'date', 'time', 'address', 'business_phone']
      },
      {
        templateKey: 'emergency_alert',
        languageCode: 'en',
        content: 'URGENT: {service_type} emergency from {customer_name} at {address}. Issue: {issue_description}. Contact: {customer_phone}',
        variables: ['service_type', 'customer_name', 'address', 'issue_description', 'customer_phone']
      },
      {
        templateKey: 'confirmation_received',
        languageCode: 'en',
        content: 'Thank you for confirming, {customer_name}! We\'ll see you at your appointment.',
        variables: ['customer_name']
      },
      {
        templateKey: 'cancellation_received',
        languageCode: 'en',
        content: 'We\'ve received your cancellation request, {customer_name}. Call {business_phone} to reschedule.',
        variables: ['customer_name', 'business_phone']
      },
      {
        templateKey: 'help_message',
        languageCode: 'en',
        content: 'Hi {customer_name}! Reply with YES to confirm, NO to cancel, or HELP for assistance. Call {business_phone} for immediate help.',
        variables: ['customer_name', 'business_phone']
      },

      // Spanish templates
      {
        templateKey: 'appointment_confirmation',
        languageCode: 'es',
        content: '¡Hola {customer_name}! Su cita de {service_type} está confirmada para {date} a las {time}. Dirección: {address}. ¿Preguntas? Llame {business_phone}',
        variables: ['customer_name', 'service_type', 'date', 'time', 'address', 'business_phone']
      },
      {
        templateKey: 'appointment_reminder',
        languageCode: 'es',
        content: 'Recordatorio: Su cita de {service_type} es en {hours_before}h ({date} a las {time}). Dirección: {address}. Llame {business_phone} para reprogramar.',
        variables: ['service_type', 'hours_before', 'date', 'time', 'address', 'business_phone']
      },
      {
        templateKey: 'emergency_alert',
        languageCode: 'es',
        content: 'URGENTE: Emergencia de {service_type} de {customer_name} en {address}. Problema: {issue_description}. Contacto: {customer_phone}',
        variables: ['service_type', 'customer_name', 'address', 'issue_description', 'customer_phone']
      },
      {
        templateKey: 'confirmation_received',
        languageCode: 'es',
        content: '¡Gracias por confirmar, {customer_name}! Nos vemos en su cita.',
        variables: ['customer_name']
      },
      {
        templateKey: 'cancellation_received',
        languageCode: 'es',
        content: 'Hemos recibido su solicitud de cancelación, {customer_name}. Llame {business_phone} para reprogramar.',
        variables: ['customer_name', 'business_phone']
      },
      {
        templateKey: 'help_message',
        languageCode: 'es',
        content: '¡Hola {customer_name}! Responda SÍ para confirmar, NO para cancelar, o AYUDA para asistencia. Llame {business_phone} para ayuda inmediata.',
        variables: ['customer_name', 'business_phone']
      }
    ]
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create SMS template manager
 */
export function createSMSTemplateManager(): SMSTemplateManager {
  return new SMSTemplateManager()
}
