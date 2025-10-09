// Template Engine Types for ServiceAI Multi-Language Platform
// Task 1.3: Template Engine Core

export interface IndustryTemplate {
  id: string
  industry_code: string
  language_code: string
  display_name: string
  template_config: TemplateConfig
  emergency_patterns: EmergencyPatterns
  appointment_types: AppointmentTypes
  required_fields: RequiredFields
  sms_templates: SMSTemplates
  cultural_guidelines: CulturalGuidelines
  integration_requirements: IntegrationRequirements
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateConfig {
  system_prompt_template: string
  greeting_template: string
  fallback_responses: {
    en: string[]
    es: string[]
  }
  conversation_flow: ConversationFlow
  business_hours: BusinessHours
  timezone_handling: TimezoneHandling
}

export interface EmergencyPatterns {
  keywords: {
    en: string[]
    es: string[]
  }
  urgency_indicators: {
    en: string[]
    es: string[]
  }
  context_patterns: {
    en: string[]
    es: string[]
  }
  escalation_triggers: {
    en: string[]
    es: string[]
  }
}

export interface AppointmentTypes {
  [key: string]: {
    display_name: {
      en: string
      es: string
    }
    duration_minutes: number
    priority: number
    same_day_available: boolean
    advance_booking_days: number
    required_fields: string[]
    description: {
      en: string
      es: string
    }
  }
}

export interface RequiredFields {
  customer_info: string[]
  service_details: string[]
  emergency_contact: string[]
  sms_preferences: string[]
  language_preference: string[]
}

export interface SMSTemplates {
  appointment_confirmation: {
    en: string
    es: string
  }
  appointment_reminder: {
    en: string
    es: string
  }
  emergency_alert: {
    en: string
    es: string
  }
  emergency_confirmation: {
    en: string
    es: string
  }
  status_update: {
    en: string
    es: string
  }
  follow_up: {
    en: string
    es: string
  }
}

export interface CulturalGuidelines {
  communication_style: {
    en: string
    es: string
  }
  formality_level: {
    en: string
    es: string
  }
  urgency_expression: {
    en: string
    es: string
  }
  relationship_building: {
    en: string
    es: string
  }
  cultural_notes: {
    en: string[]
    es: string[]
  }
}

export interface IntegrationRequirements {
  vapi_tools: VapiTool[]
  webhook_endpoints: string[]
  external_apis: ExternalAPI[]
  data_requirements: DataRequirement[]
}

export interface ConversationFlow {
  initial_greeting: {
    en: string
    es: string
  }
  language_detection: {
    en: string
    es: string
  }
  emergency_assessment: {
    en: string
    es: string
  }
  appointment_booking: {
    en: string
    es: string
  }
  information_collection: {
    en: string
    es: string
  }
  confirmation: {
    en: string
    es: string
  }
}

export interface BusinessHours {
  timezone: string
  weekdays: {
    open: string
    close: string
  }
  weekends: {
    open: string
    close: string
  }
  holidays: string[]
  emergency_hours: {
    available: boolean
    contact_method: string
  }
}

export interface TimezoneHandling {
  default_timezone: string
  supported_timezones: string[]
  daylight_saving: boolean
  timezone_detection: boolean
}

export interface VapiTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}

export interface ExternalAPI {
  name: string
  endpoint: string
  authentication: string
  rate_limit: number
  required: boolean
}

export interface DataRequirement {
  field_name: string
  data_type: string
  required: boolean
  validation_rules: string[]
  description: {
    en: string
    es: string
  }
}

// Template loading and caching types
export interface TemplateCache {
  [key: string]: {
    template: IndustryTemplate
    loaded_at: number
    expires_at: number
  }
}

export interface TemplateLoadOptions {
  use_cache?: boolean
  fallback_language?: string
  validate_required?: boolean
}

export interface TemplateValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missing_fields: string[]
}

// Business data types for template rendering
export interface BusinessData {
  business_name: string
  business_phone: string
  business_address: string
  business_email: string
  primary_language: string
  supported_languages: string[]
  timezone: string
  emergency_contact_phone: string
  emergency_contact_email: string
  sms_enabled: boolean
  email_notifications: boolean
  industry_specific: Record<string, any>
}

// System prompt generation types
export interface SystemPromptOptions {
  include_multilingual_instructions?: boolean
  include_emergency_detection?: boolean
  include_sms_integration?: boolean
  include_cultural_guidelines?: boolean
  custom_instructions?: string[]
}

// Tool generation types
export interface ToolGenerationOptions {
  include_emergency_detection?: boolean
  include_appointment_booking?: boolean
  include_sms_notifications?: boolean
  include_customer_management?: boolean
  custom_tools?: VapiTool[]
}

// Language detection types
export interface LanguageDetectionResult {
  detected_language: 'en' | 'es'
  confidence: number
  fallback_used: boolean
  detection_method: string
}

// Template engine configuration
export interface TemplateEngineConfig {
  supported_languages: string[]
  default_language: string
  cache_ttl_seconds: number
  max_cache_size: number
  enable_fallback: boolean
  validation_strict: boolean
  log_level: 'debug' | 'info' | 'warn' | 'error'
}
