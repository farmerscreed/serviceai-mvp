// MultiLanguageTemplateEngine - Core Template Engine for ServiceAI
// Task 1.3: Template Engine Core

import { createServerClient } from '@/lib/supabase/server'
import { createBrowserClient } from '@/lib/supabase/client'
import type {
  IndustryTemplate,
  TemplateCache,
  TemplateLoadOptions,
  TemplateValidationResult,
  BusinessData,
  SystemPromptOptions,
  ToolGenerationOptions,
  LanguageDetectionResult,
  TemplateEngineConfig,
  VapiTool,
  EmergencyPatterns,
  AppointmentTypes,
  SMSTemplates,
  CulturalGuidelines
} from './types'

export class MultiLanguageTemplateEngine {
  private cache: TemplateCache = {}
  private config: TemplateEngineConfig
  private isServer: boolean

  constructor(config?: Partial<TemplateEngineConfig>, isServer: boolean = true) {
    this.isServer = isServer
    this.config = {
      supported_languages: ['en', 'es'],
      default_language: 'en',
      cache_ttl_seconds: 3600, // 1 hour
      max_cache_size: 100,
      enable_fallback: true,
      validation_strict: true,
      log_level: 'info',
      ...config
    }
  }

  // =====================================================
  // Template Loading and Caching
  // =====================================================

  async loadTemplate(
    industryCode: string, 
    languageCode: string = 'en',
    options: TemplateLoadOptions = {}
  ): Promise<IndustryTemplate | null> {
    const cacheKey = `${industryCode}_${languageCode}`
    const useCache = options.use_cache !== false

    // Check cache first
    if (useCache && this.cache[cacheKey]) {
      const cached = this.cache[cacheKey]
      if (Date.now() < cached.expires_at) {
        this.log(`Cache hit for template ${cacheKey}`, 'debug')
        return cached.template
      } else {
        delete this.cache[cacheKey]
      }
    }

    try {
      // Load from database
      const template = await this.fetchTemplateFromDatabase(industryCode, languageCode)
      
      if (!template && this.config.enable_fallback && languageCode !== this.config.default_language) {
        this.log(`Template not found for ${industryCode}_${languageCode}, falling back to ${this.config.default_language}`, 'warn')
        return await this.loadTemplate(industryCode, this.config.default_language, { ...options, use_cache: false })
      }

      if (!template) {
        this.log(`Template not found for ${industryCode}_${languageCode}`, 'error')
        return null
      }

      // Validate template if required
      if (options.validate_required !== false) {
        const validation = this.validateTemplate(template)
        if (!validation.valid) {
          this.log(`Template validation failed for ${cacheKey}: ${validation.errors.join(', ')}`, 'error')
          return null
        }
      }

      // Cache the template
      if (useCache) {
        this.cacheTemplate(cacheKey, template)
      }

      this.log(`Template loaded successfully: ${cacheKey}`, 'info')
      return template

    } catch (error) {
      this.log(`Error loading template ${cacheKey}: ${error}`, 'error')
      return null
    }
  }

  private async fetchTemplateFromDatabase(industryCode: string, languageCode: string): Promise<IndustryTemplate | null> {
    const supabase = this.isServer ? await createServerClient() : createBrowserClient()
    
    const { data, error } = await supabase
      .from('industry_templates')
      .select('*')
      .eq('industry_code', industryCode)
      .eq('language_code', languageCode)
      .eq('is_active', true)
      .single()

    if (error) {
      this.log(`Database error fetching template: ${error.message}`, 'error')
      return null
    }

    return data as IndustryTemplate
  }

  private cacheTemplate(cacheKey: string, template: IndustryTemplate): void {
    // Implement cache size limit
    if (Object.keys(this.cache).length >= this.config.max_cache_size) {
      const oldestKey = Object.keys(this.cache)[0]
      delete this.cache[oldestKey]
    }

    this.cache[cacheKey] = {
      template,
      loaded_at: Date.now(),
      expires_at: Date.now() + (this.config.cache_ttl_seconds * 1000)
    }
  }

  // =====================================================
  // System Prompt Generation
  // =====================================================

  async renderMultilingualSystemPrompt(
    template: IndustryTemplate,
    businessData: BusinessData,
    options: SystemPromptOptions = {}
  ): Promise<string> {
    const {
      include_multilingual_instructions = true,
      include_emergency_detection = true,
      include_sms_integration = true,
      include_cultural_guidelines = true,
      custom_instructions = []
    } = options

    // Base system prompt from template
    let systemPrompt = template.template_config.system_prompt_template
      .replace('{business_name}', businessData.business_name)
      .replace('{business_phone}', businessData.business_phone)
      .replace('{business_address}', businessData.business_address)
      .replace('{business_email}', businessData.business_email)

    // Add multilingual instructions
    if (include_multilingual_instructions) {
      systemPrompt += this.generateMultilingualInstructions(template, businessData)
    }

    // Add emergency detection instructions
    if (include_emergency_detection) {
      systemPrompt += this.generateEmergencyDetectionInstructions(template)
    }

    // Add SMS integration instructions
    if (include_sms_integration) {
      systemPrompt += this.generateSMSIntegrationInstructions(template, businessData)
    }

    // Add cultural guidelines
    if (include_cultural_guidelines) {
      systemPrompt += this.generateCulturalGuidelines(template)
    }

    // Add custom instructions
    if (custom_instructions.length > 0) {
      systemPrompt += '\n\nCUSTOM INSTRUCTIONS:\n' + custom_instructions.join('\n')
    }

    return systemPrompt
  }

  private generateMultilingualInstructions(template: IndustryTemplate, businessData: BusinessData): string {
    const supportedLanguages = businessData.supported_languages || ['en', 'es']
    
    return `

LANGUAGE CAPABILITIES:
- You are fluent in English and Spanish
- Automatically detect and respond in the customer's language
- Use appropriate cultural communication styles for each language
- Switch languages seamlessly if customer changes language mid-conversation
- Supported languages: ${supportedLanguages.join(', ')}

SPANISH COMMUNICATION GUIDELINES:
- Use "usted" for formal situations (emergencies, first contact)
- Use "tú" if customer initiates informal tone
- Be patient and thorough - cultural preference for detailed explanations
- Emergency keywords in Spanish: ${template.emergency_patterns.keywords.es.join(', ')}

LANGUAGE DETECTION:
- Listen for language indicators in customer's speech
- If uncertain, ask: "¿Prefiere hablar en español o inglés?" / "Would you prefer to speak in English or Spanish?"
- Remember customer's language preference for the entire conversation`
  }

  private generateEmergencyDetectionInstructions(template: IndustryTemplate): string {
    return `

EMERGENCY DETECTION (MULTILINGUAL):
English keywords: ${template.emergency_patterns.keywords.en.join(', ')}
Spanish keywords: ${template.emergency_patterns.keywords.es.join(', ')}

URGENCY INDICATORS:
English: ${template.emergency_patterns.urgency_indicators.en.join(', ')}
Spanish: ${template.emergency_patterns.urgency_indicators.es.join(', ')}

ESCALATION TRIGGERS:
English: ${template.emergency_patterns.escalation_triggers.en.join(', ')}
Spanish: ${template.emergency_patterns.escalation_triggers.es.join(', ')}

If emergency detected:
1. Immediately assess urgency level (1-10)
2. Collect essential information (address, contact, description)
3. Provide reassurance in customer's language
4. Escalate to emergency contact if needed
5. Send SMS alerts if customer consents`
  }

  private generateSMSIntegrationInstructions(template: IndustryTemplate, businessData: BusinessData): string {
    if (!businessData.sms_enabled) {
      return ''
    }

    return `

SMS INTEGRATION:
- Always collect customer's preferred language for SMS communications
- Ask: "¿Prefiere recibir mensajes en español o inglés?" / "Would you prefer SMS in English or Spanish?"
- Use collected language preference for all follow-up SMS
- SMS templates available for:
  - Appointment confirmations
  - Appointment reminders
  - Emergency alerts
  - Status updates
  - Follow-up messages`
  }

  private generateCulturalGuidelines(template: IndustryTemplate): string {
    return `

CULTURAL COMMUNICATION GUIDELINES:

English Communication:
- Style: ${template.cultural_guidelines.communication_style.en}
- Formality: ${template.cultural_guidelines.formality_level.en}
- Urgency: ${template.cultural_guidelines.urgency_expression.en}
- Relationship: ${template.cultural_guidelines.relationship_building.en}

Spanish Communication:
- Style: ${template.cultural_guidelines.communication_style.es}
- Formality: ${template.cultural_guidelines.formality_level.es}
- Urgency: ${template.cultural_guidelines.urgency_expression.es}
- Relationship: ${template.cultural_guidelines.relationship_building.es}

Cultural Notes:
English: ${template.cultural_guidelines.cultural_notes.en.join('; ')}
Spanish: ${template.cultural_guidelines.cultural_notes.es.join('; ')}`
  }

  // =====================================================
  // Tool Generation
  // =====================================================

  async createMultilingualVapiTools(
    template: IndustryTemplate,
    businessData: BusinessData,
    options: ToolGenerationOptions = {}
  ): Promise<VapiTool[]> {
    const {
      include_emergency_detection = true,
      include_appointment_booking = true,
      include_sms_notifications = true,
      include_customer_management = true,
      custom_tools = []
    } = options

    const tools: VapiTool[] = []

    // Emergency detection tool
    if (include_emergency_detection) {
      tools.push(this.createEmergencyDetectionTool(template))
    }

    // Appointment booking tool
    if (include_appointment_booking) {
      tools.push(this.createAppointmentBookingTool(template, businessData))
    }

    // SMS notification tool
    if (include_sms_notifications && businessData.sms_enabled) {
      tools.push(this.createSMSNotificationTool(template))
    }

    // Customer management tool
    if (include_customer_management) {
      tools.push(this.createCustomerManagementTool(template))
    }

    // Add custom tools
    tools.push(...custom_tools)

    return tools
  }

  private createEmergencyDetectionTool(template: IndustryTemplate): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'check_emergency_multilingual',
        description: `Analyze urgency for ${template.display_name} issues in multiple languages`,
        parameters: {
          type: 'object',
          properties: {
            issue_description: {
              type: 'string',
              description: 'Detailed description of the issue reported by customer'
            },
            detected_language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Language detected from customer conversation'
            },
            urgency_indicators: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords or phrases that indicate urgency level'
            },
            cultural_context: {
              type: 'string',
              description: 'Cultural communication style detected from customer'
            },
            customer_phone: {
              type: 'string',
              description: 'Customer phone number for emergency contact'
            },
            service_address: {
              type: 'string',
              description: 'Address where service is needed'
            }
          },
          required: ['issue_description', 'detected_language', 'urgency_indicators']
        }
      }
    }
  }

  private createAppointmentBookingTool(template: IndustryTemplate, businessData: BusinessData): VapiTool {
    const appointmentTypes = Object.keys(template.appointment_types)
    const requiredFields = template.required_fields.customer_info

    return {
      type: 'function',
      function: {
        name: 'book_appointment_with_sms',
        description: `Schedule ${template.display_name} appointment with SMS confirmation`,
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string', description: 'Customer full name' },
            customer_phone: { type: 'string', description: 'Customer phone number' },
            customer_email: { type: 'string', description: 'Customer email address' },
            service_type: {
              type: 'string',
              enum: appointmentTypes,
              description: 'Type of service requested'
            },
            preferred_date: { type: 'string', description: 'Preferred appointment date' },
            preferred_time: { type: 'string', description: 'Preferred appointment time' },
            service_address: { type: 'string', description: 'Address where service is needed' },
            issue_description: { type: 'string', description: 'Description of the issue' },
            preferred_language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Customer preferred language for SMS'
            },
            sms_preference: {
              type: 'boolean',
              description: 'Customer wants SMS notifications'
            },
            cultural_formality: {
              type: 'string',
              enum: ['formal', 'informal'],
              description: 'Customer communication preference'
            },
            emergency_contact: { type: 'string', description: 'Emergency contact phone number' }
          },
          required: requiredFields.concat(['preferred_language', 'sms_preference'])
        }
      }
    }
  }

  private createSMSNotificationTool(template: IndustryTemplate): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'send_sms_notification',
        description: 'Send SMS notification to customer in their preferred language',
        parameters: {
          type: 'object',
          properties: {
            phone_number: { type: 'string', description: 'Recipient phone number' },
            message_type: {
              type: 'string',
              enum: ['confirmation', 'reminder', 'update', 'emergency', 'follow_up'],
              description: 'Type of SMS message to send'
            },
            language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Language for SMS message'
            },
            urgency_level: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'emergency'],
              description: 'Urgency level of the message'
            },
            customer_name: { type: 'string', description: 'Customer name for personalization' },
            appointment_date: { type: 'string', description: 'Appointment date' },
            appointment_time: { type: 'string', description: 'Appointment time' },
            service_address: { type: 'string', description: 'Service address' },
            technician_name: { type: 'string', description: 'Assigned technician name' }
          },
          required: ['phone_number', 'message_type', 'language']
        }
      }
    }
  }

  private createCustomerManagementTool(template: IndustryTemplate): VapiTool {
    return {
      type: 'function',
      function: {
        name: 'manage_customer_info',
        description: 'Collect and update customer information',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'update', 'retrieve'],
              description: 'Action to perform on customer data'
            },
            customer_id: { type: 'string', description: 'Customer ID if updating/retrieving' },
            customer_data: {
              type: 'object',
              description: 'Customer information to store or update',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
                address: { type: 'string' },
                preferred_language: { type: 'string', enum: ['en', 'es'] },
                sms_opt_in: { type: 'boolean' },
                emergency_contact: { type: 'string' }
              }
            }
          },
          required: ['action']
        }
      }
    }
  }

  // =====================================================
  // Template Validation
  // =====================================================

  validateTemplate(template: IndustryTemplate): TemplateValidationResult {
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
        if (!template.sms_templates[smsType as keyof SMSTemplates]) {
          warnings.push(`SMS template missing: ${smsType}`)
        }
      }
    }

    // Validate cultural guidelines
    if (template.cultural_guidelines) {
      const requiredGuidelines = ['communication_style', 'formality_level', 'urgency_expression']
      for (const guideline of requiredGuidelines) {
        if (!template.cultural_guidelines[guideline as keyof CulturalGuidelines]) {
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
  // Language Detection
  // =====================================================

  detectLanguage(text: string): LanguageDetectionResult {
    // Simple keyword-based detection
    const spanishIndicators = ['hola', 'gracias', 'por favor', 'disculpe', 'señor', 'señora', 'usted', 'tú']
    const englishIndicators = ['hello', 'thank you', 'please', 'excuse me', 'sir', 'madam', 'you']

    const textLower = text.toLowerCase()
    const spanishCount = spanishIndicators.filter(word => textLower.includes(word)).length
    const englishCount = englishIndicators.filter(word => textLower.includes(word)).length

    if (spanishCount > englishCount) {
      return {
        detected_language: 'es',
        confidence: spanishCount / (spanishCount + englishCount),
        fallback_used: false,
        detection_method: 'keyword_matching'
      }
    } else {
      return {
        detected_language: 'en',
        confidence: englishCount / (spanishCount + englishCount),
        fallback_used: false,
        detection_method: 'keyword_matching'
      }
    }
  }

  // =====================================================
  // Cache Management
  // =====================================================

  clearCache(): void {
    this.cache = {}
    this.log('Template cache cleared', 'info')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    }
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    if (this.shouldLog(level)) {
      console[level](`[TemplateEngine] ${message}`)
    }
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level as keyof typeof levels] >= levels[this.config.log_level]
  }

  // Get supported languages
  getSupportedLanguages(): string[] {
    return [...this.config.supported_languages]
  }

  // Check if language is supported
  isLanguageSupported(language: string): boolean {
    return this.config.supported_languages.includes(language)
  }
}
