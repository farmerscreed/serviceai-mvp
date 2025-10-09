// Template Service - High-level interface for Template Engine
// Task 1.3: Template Engine Core

import { MultiLanguageTemplateEngine } from './template-engine'
import type {
  IndustryTemplate,
  BusinessData,
  SystemPromptOptions,
  ToolGenerationOptions,
  TemplateEngineConfig
} from './types'

export class TemplateService {
  private engine: MultiLanguageTemplateEngine
  private isServer: boolean

  constructor(config?: Partial<TemplateEngineConfig>, isServer: boolean = true) {
    this.isServer = isServer
    this.engine = new MultiLanguageTemplateEngine(config, isServer)
  }

  // =====================================================
  // High-Level Template Operations
  // =====================================================

  /**
   * Load a template with automatic fallback
   */
  async getTemplate(industryCode: string, languageCode: string = 'en'): Promise<IndustryTemplate | null> {
    return await this.engine.loadTemplate(industryCode, languageCode)
  }

  /**
   * Get all available templates for an organization
   */
  async getOrganizationTemplates(organizationId: string): Promise<IndustryTemplate[]> {
    // This would typically fetch from organization settings
    // For now, return all available templates
    const industries = ['hvac', 'plumbing', 'electrical']
    const languages = ['en', 'es']
    const templates: IndustryTemplate[] = []

    for (const industry of industries) {
      for (const language of languages) {
        const template = await this.engine.loadTemplate(industry, language)
        if (template) {
          templates.push(template)
        }
      }
    }

    return templates
  }

  /**
   * Create a complete Vapi assistant configuration
   */
  async createVapiAssistantConfig(
    industryCode: string,
    languageCode: string,
    businessData: BusinessData,
    options?: {
      systemPromptOptions?: SystemPromptOptions
      toolOptions?: ToolGenerationOptions
    }
  ) {
    const template = await this.engine.loadTemplate(industryCode, languageCode)
    if (!template) {
      throw new Error(`Template not found: ${industryCode}_${languageCode}`)
    }

    const systemPrompt = await this.engine.renderMultilingualSystemPrompt(
      template,
      businessData,
      options?.systemPromptOptions
    )

    const tools = await this.engine.createMultilingualVapiTools(
      template,
      businessData,
      options?.toolOptions
    )

    return {
      template,
      systemPrompt,
      tools,
      voice: this.getVoiceConfig(languageCode),
      transcriber: this.getTranscriberConfig(),
      firstMessage: this.getFirstMessage(template, businessData, languageCode)
    }
  }

  /**
   * Get SMS template for a specific message type
   */
  async getSMSTemplate(
    industryCode: string,
    languageCode: string,
    messageType: string,
    variables: Record<string, string> = {}
  ): Promise<string | null> {
    const template = await this.engine.loadTemplate(industryCode, languageCode)
    if (!template) return null

    const smsTemplate = template.sms_templates[messageType as keyof typeof template.sms_templates]
    if (!smsTemplate) return null

    const templateText = smsTemplate[languageCode as 'en' | 'es']
    if (!templateText) return null

    // Replace variables in template
    return this.replaceTemplateVariables(templateText, variables)
  }

  /**
   * Get emergency keywords for a template
   */
  async getEmergencyKeywords(industryCode: string, languageCode: string): Promise<string[]> {
    const template = await this.engine.loadTemplate(industryCode, languageCode)
    if (!template) return []

    return template.emergency_patterns.keywords[languageCode as 'en' | 'es'] || []
  }

  /**
   * Get appointment types for a template
   */
  async getAppointmentTypes(industryCode: string, languageCode: string) {
    const template = await this.engine.loadTemplate(industryCode, languageCode)
    if (!template) return {}

    return template.appointment_types
  }

  // =====================================================
  // Template Validation and Management
  // =====================================================

  /**
   * Validate a template
   */
  async validateTemplate(industryCode: string, languageCode: string) {
    const template = await this.engine.loadTemplate(industryCode, languageCode)
    if (!template) {
      return {
        valid: false,
        errors: ['Template not found'],
        warnings: [],
        missing_fields: []
      }
    }

    return this.engine.validateTemplate(template)
  }

  /**
   * Get template cache statistics
   */
  getCacheStats() {
    return this.engine.getCacheStats()
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.engine.clearCache()
  }

  // =====================================================
  // Language Detection
  // =====================================================

  /**
   * Detect language from text
   */
  detectLanguage(text: string) {
    return this.engine.detectLanguage(text)
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.engine.getSupportedLanguages()
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string) {
    return this.engine.isLanguageSupported(language)
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  private getVoiceConfig(languageCode: string) {
    if (languageCode === 'es') {
      return {
        provider: 'azure',
        voiceId: 'es-MX-DaliaNeural', // Mexican Spanish
        speed: 1.0,
        pitch: 1.0
      }
    } else {
      return {
        provider: 'azure',
        voiceId: 'en-US-AriaNeural', // English
        speed: 1.0,
        pitch: 1.0
      }
    }
  }

  private getTranscriberConfig() {
    return {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'multi' // Enables automatic language detection
    }
  }

  private getFirstMessage(template: IndustryTemplate, businessData: BusinessData, languageCode: string): string {
    const greeting = template.template_config.greeting_template
    return greeting
      .replace('{business_name}', businessData.business_name)
      .replace('{business_phone}', businessData.business_phone)
      .replace('{language}', languageCode === 'es' ? 'español' : 'English')
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value)
    }
    return result
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create a server-side template service
 */
export function createServerTemplateService(config?: Partial<TemplateEngineConfig>) {
  return new TemplateService(config, true)
}

/**
 * Create a client-side template service
 */
export function createClientTemplateService(config?: Partial<TemplateEngineConfig>) {
  return new TemplateService(config, false)
}

// =====================================================
// Default Configuration
// =====================================================

export const DEFAULT_TEMPLATE_CONFIG: TemplateEngineConfig = {
  supported_languages: ['en', 'es'],
  default_language: 'en',
  cache_ttl_seconds: 3600,
  max_cache_size: 100,
  enable_fallback: true,
  validation_strict: true,
  log_level: 'info'
}
