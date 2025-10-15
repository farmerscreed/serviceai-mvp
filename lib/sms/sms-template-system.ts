// SMS Template System - Production Ready
// Multi-language SMS templates for ServiceAI

import { createServiceRoleClient } from '@/lib/supabase/server'

export interface SMSTemplate {
  id: string
  key: string
  language: 'en' | 'es'
  content: string
  variables: string[]
  category: 'appointment' | 'emergency' | 'reminder' | 'confirmation' | 'follow_up'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateData {
  [key: string]: string | number | Date
}

export class SMSTemplateSystem {
  private supabase = createServiceRoleClient()
  private templateCache = new Map<string, SMSTemplate>()

  constructor() {
    this.initializeDefaultTemplates()
  }

  // =====================================================
  // Template Management
  // =====================================================

  /**
   * Get template by key and language
   */
  async getTemplate(key: string, language: 'en' | 'es'): Promise<SMSTemplate | null> {
    const cacheKey = `${key}_${language}`
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!
    }

    const { data: template, error } = await this.supabase
      .from('sms_templates')
      .select('*')
      .eq('key', key)
      .eq('language', language)
      .eq('is_active', true)
      .single()

    if (error || !template) {
      return null
    }

    this.templateCache.set(cacheKey, template)
    return template
  }

  /**
   * Format template with data
   */
  formatTemplate(template: SMSTemplate, data: TemplateData): string {
    let content = template.content

    // Replace variables with data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`
      content = content.replace(new RegExp(placeholder, 'g'), String(value))
    }

    // Check for missing variables
    const missingVariables = template.variables.filter(variable => 
      !Object.keys(data).includes(variable)
    )

    if (missingVariables.length > 0) {
      console.warn(`Missing variables in template ${template.key}:`, missingVariables)
    }

    return content
  }

  /**
   * Create or update template
   */
  async saveTemplate(template: Partial<SMSTemplate>): Promise<SMSTemplate> {
    const { data, error } = await this.supabase
      .from('sms_templates')
      .upsert({
        ...template,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save template: ${error.message}`)
    }

    // Update cache
    const cacheKey = `${data.key}_${data.language}`
    this.templateCache.set(cacheKey, data)

    return data
  }

  // =====================================================
  // Default Templates
  // =====================================================

  /**
   * Initialize default SMS templates
   */
  private async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = this.getDefaultTemplates()
    
    for (const template of defaultTemplates) {
      try {
        // Check if template already exists
        const existing = await this.getTemplate(template.key, template.language)
        if (!existing) {
          await this.saveTemplate(template)
          console.log(`✅ Created default SMS template: ${template.key} (${template.language})`)
        }
      } catch (error) {
        console.error(`❌ Failed to create template ${template.key}:`, error)
      }
    }
  }

  /**
   * Get default SMS templates
   */
  private getDefaultTemplates(): Partial<SMSTemplate>[] {
    return [
      // Appointment Confirmation - English
      {
        key: 'appointment_confirmation',
        language: 'en',
        content: 'Hi {{customer_name}}! Your {{service_type}} appointment is confirmed for {{date}} at {{time}}. Address: {{address}}. We\'ll call 30 minutes before arrival. Reply STOP to opt out.',
        variables: ['customer_name', 'service_type', 'date', 'time', 'address'],
        category: 'appointment',
        is_active: true
      },
      // Appointment Confirmation - Spanish
      {
        key: 'appointment_confirmation',
        language: 'es',
        content: '¡Hola {{customer_name}}! Su cita de {{service_type}} está confirmada para el {{date}} a las {{time}}. Dirección: {{address}}. Llamaremos 30 minutos antes de llegar. Responda STOP para cancelar.',
        variables: ['customer_name', 'service_type', 'date', 'time', 'address'],
        category: 'appointment',
        is_active: true
      },
      // Appointment Reminder - English
      {
        key: 'appointment_reminder',
        language: 'en',
        content: 'Reminder: Your {{service_type}} appointment is tomorrow at {{time}}. Address: {{address}}. Please confirm by replying YES or reschedule by calling {{business_phone}}.',
        variables: ['service_type', 'time', 'address', 'business_phone'],
        category: 'reminder',
        is_active: true
      },
      // Appointment Reminder - Spanish
      {
        key: 'appointment_reminder',
        language: 'es',
        content: 'Recordatorio: Su cita de {{service_type}} es mañana a las {{time}}. Dirección: {{address}}. Confirme respondiendo SÍ o reagende llamando al {{business_phone}}.',
        variables: ['service_type', 'time', 'address', 'business_phone'],
        category: 'reminder',
        is_active: true
      },
      // Emergency Alert - English
      {
        key: 'emergency_alert',
        language: 'en',
        content: '🚨 EMERGENCY ALERT 🚨 {{customer_name}} reported: {{issue_description}}. Address: {{address}}. Phone: {{customer_phone}}. Urgency: {{urgency_level}}. Please respond immediately.',
        variables: ['customer_name', 'issue_description', 'address', 'customer_phone', 'urgency_level'],
        category: 'emergency',
        is_active: true
      },
      // Emergency Alert - Spanish
      {
        key: 'emergency_alert',
        language: 'es',
        content: '🚨 ALERTA DE EMERGENCIA 🚨 {{customer_name}} reportó: {{issue_description}}. Dirección: {{address}}. Teléfono: {{customer_phone}}. Urgencia: {{urgency_level}}. Responda inmediatamente.',
        variables: ['customer_name', 'issue_description', 'address', 'customer_phone', 'urgency_level'],
        category: 'emergency',
        is_active: true
      },
      // Service Completion Follow-up - English
      {
        key: 'service_completion',
        language: 'en',
        content: 'Thank you for choosing us! How was your {{service_type}} service today? Rate us 1-5 stars by replying with a number. For issues, call {{business_phone}}.',
        variables: ['service_type', 'business_phone'],
        category: 'follow_up',
        is_active: true
      },
      // Service Completion Follow-up - Spanish
      {
        key: 'service_completion',
        language: 'es',
        content: '¡Gracias por elegirnos! ¿Cómo fue su servicio de {{service_type}} hoy? Califíquenos de 1 a 5 estrellas respondiendo con un número. Para problemas, llame al {{business_phone}}.',
        variables: ['service_type', 'business_phone'],
        category: 'follow_up',
        is_active: true
      },
      // Appointment Cancellation - English
      {
        key: 'appointment_cancelled',
        language: 'en',
        content: 'Your {{service_type}} appointment for {{date}} at {{time}} has been cancelled. To reschedule, call {{business_phone}} or visit our website.',
        variables: ['service_type', 'date', 'time', 'business_phone'],
        category: 'appointment',
        is_active: true
      },
      // Appointment Cancellation - Spanish
      {
        key: 'appointment_cancelled',
        language: 'es',
        content: 'Su cita de {{service_type}} para el {{date}} a las {{time}} ha sido cancelada. Para reagendar, llame al {{business_phone}} o visite nuestro sitio web.',
        variables: ['service_type', 'date', 'time', 'business_phone'],
        category: 'appointment',
        is_active: true
      },
      // No Show Follow-up - English
      {
        key: 'no_show_followup',
        language: 'en',
        content: 'We missed you at your {{service_type}} appointment today. Please call {{business_phone}} to reschedule. We\'re here to help!',
        variables: ['service_type', 'business_phone'],
        category: 'follow_up',
        is_active: true
      },
      // No Show Follow-up - Spanish
      {
        key: 'no_show_followup',
        language: 'es',
        content: 'Te extrañamos en tu cita de {{service_type}} hoy. Por favor llame al {{business_phone}} para reagendar. ¡Estamos aquí para ayudar!',
        variables: ['service_type', 'business_phone'],
        category: 'follow_up',
        is_active: true
      },
      // Welcome Message - English
      {
        key: 'welcome_message',
        language: 'en',
        content: 'Welcome to {{business_name}}! We\'re excited to serve you. For appointments, call {{business_phone}} or visit our website. Reply STOP to opt out.',
        variables: ['business_name', 'business_phone'],
        category: 'confirmation',
        is_active: true
      },
      // Welcome Message - Spanish
      {
        key: 'welcome_message',
        language: 'es',
        content: '¡Bienvenido a {{business_name}}! Estamos emocionados de servirle. Para citas, llame al {{business_phone}} o visite nuestro sitio web. Responda STOP para cancelar.',
        variables: ['business_name', 'business_phone'],
        category: 'confirmation',
        is_active: true
      }
    ]
  }

  // =====================================================
  // Template Categories
  // =====================================================

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string, language: 'en' | 'es'): Promise<SMSTemplate[]> {
    const { data: templates, error } = await this.supabase
      .from('sms_templates')
      .select('*')
      .eq('category', category)
      .eq('language', language)
      .eq('is_active', true)
      .order('key')

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`)
    }

    return templates || []
  }

  /**
   * Get all available template keys
   */
  async getTemplateKeys(): Promise<string[]> {
    const { data: templates, error } = await this.supabase
      .from('sms_templates')
      .select('key')
      .eq('is_active', true)
      .order('key')

    if (error) {
      throw new Error(`Failed to get template keys: ${error.message}`)
    }

    return [...new Set(templates?.map(t => t.key) || [])]
  }

  // =====================================================
  // Template Validation
  // =====================================================

  /**
   * Validate template data
   */
  validateTemplateData(template: SMSTemplate, data: TemplateData): {
    valid: boolean
    missingVariables: string[]
    extraVariables: string[]
  } {
    const missingVariables = template.variables.filter(variable => 
      !Object.keys(data).includes(variable)
    )

    const extraVariables = Object.keys(data).filter(key => 
      !template.variables.includes(key)
    )

    return {
      valid: missingVariables.length === 0,
      missingVariables,
      extraVariables
    }
  }

  /**
   * Test template formatting
   */
  async testTemplate(key: string, language: 'en' | 'es', data: TemplateData): Promise<{
    success: boolean
    formattedMessage?: string
    error?: string
  }> {
    try {
      const template = await this.getTemplate(key, language)
      if (!template) {
        return {
          success: false,
          error: `Template ${key} not found in ${language}`
        }
      }

      const validation = this.validateTemplateData(template, data)
      if (!validation.valid) {
        return {
          success: false,
          error: `Missing variables: ${validation.missingVariables.join(', ')}`
        }
      }

      const formattedMessage = this.formatTemplate(template, data)
      
      return {
        success: true,
        formattedMessage
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create SMS template system instance
 */
export function createSMSTemplateSystem(): SMSTemplateSystem {
  return new SMSTemplateSystem()
}

// Export singleton instance
export const smsTemplateSystem = new SMSTemplateSystem()
