// Template Testing Framework
// Task 1.4: Industry Template Definitions

import { TemplateService } from './template-service'
import { TemplateLoader } from './template-loader'
import type { IndustryTemplate, BusinessData } from './types'

export class TemplateTestingFramework {
  private templateService: TemplateService
  private templateLoader: TemplateLoader

  constructor(isServer: boolean = true) {
    this.templateService = new TemplateService(undefined, isServer)
    this.templateLoader = new TemplateLoader(isServer)
  }

  // =====================================================
  // Template Loading Tests
  // =====================================================

  /**
   * Test template loading for all industries and languages
   */
  async testTemplateLoading(): Promise<{
    passed: number
    failed: number
    results: Record<string, { success: boolean; error?: string }>
  }> {
    const industries = ['hvac', 'plumbing', 'electrical']
    const languages = ['en', 'es']
    const results: Record<string, { success: boolean; error?: string }> = {}
    let passed = 0
    let failed = 0

    for (const industry of industries) {
      for (const language of languages) {
        const key = `${industry}_${language}`
        try {
          const template = await this.templateService.getTemplate(industry, language)
          if (template) {
            results[key] = { success: true }
            passed++
          } else {
            results[key] = { success: false, error: 'Template not found' }
            failed++
          }
        } catch (error) {
          results[key] = { success: false, error: String(error) }
          failed++
        }
      }
    }

    return { passed, failed, results }
  }

  /**
   * Test language fallback functionality
   */
  async testLanguageFallback(): Promise<{
    success: boolean
    results: Record<string, { fallback_used: boolean; template_found: boolean }>
  }> {
    const industries = ['hvac', 'plumbing', 'electrical']
    const results: Record<string, { fallback_used: boolean; template_found: boolean }> = {}
    let allSuccess = true

    for (const industry of industries) {
      try {
        // Try to load Spanish template (should work)
        const spanishTemplate = await this.templateService.getTemplate(industry, 'es')
        results[`${industry}_es`] = {
          fallback_used: false,
          template_found: !!spanishTemplate
        }

        // Try to load non-existent language (should fallback to English)
        const fallbackTemplate = await this.templateService.getTemplate(industry, 'fr') // French not supported
        results[`${industry}_fallback`] = {
          fallback_used: true,
          template_found: !!fallbackTemplate
        }

        if (!spanishTemplate || !fallbackTemplate) {
          allSuccess = false
        }
      } catch (error) {
        results[`${industry}_error`] = {
          fallback_used: false,
          template_found: false
        }
        allSuccess = false
      }
    }

    return { success: allSuccess, results }
  }

  // =====================================================
  // System Prompt Generation Tests
  // =====================================================

  /**
   * Test system prompt generation for all templates
   */
  async testSystemPromptGeneration(): Promise<{
    passed: number
    failed: number
    results: Record<string, { success: boolean; prompt_length: number; error?: string }>
  }> {
    const industries = ['hvac', 'plumbing', 'electrical']
    const languages = ['en', 'es']
    const businessData = this.getSampleBusinessData()
    const results: Record<string, { success: boolean; prompt_length: number; error?: string }> = {}
    let passed = 0
    let failed = 0

    for (const industry of industries) {
      for (const language of languages) {
        const key = `${industry}_${language}`
        try {
          const template = await this.templateService.getTemplate(industry, language)
          if (!template) {
            results[key] = { success: false, prompt_length: 0, error: 'Template not found' }
            failed++
            continue
          }

          const systemPrompt = await this.templateService.createVapiAssistantConfig(
            industry,
            language,
            businessData
          )

          if (systemPrompt.systemPrompt && systemPrompt.systemPrompt.length > 100) {
            results[key] = { success: true, prompt_length: systemPrompt.systemPrompt.length }
            passed++
          } else {
            results[key] = { success: false, prompt_length: systemPrompt.systemPrompt?.length || 0, error: 'Prompt too short' }
            failed++
          }
        } catch (error) {
          results[key] = { success: false, prompt_length: 0, error: String(error) }
          failed++
        }
      }
    }

    return { passed, failed, results }
  }

  // =====================================================
  // Tool Generation Tests
  // =====================================================

  /**
   * Test tool generation for all templates
   */
  async testToolGeneration(): Promise<{
    passed: number
    failed: number
    results: Record<string, { success: boolean; tool_count: number; error?: string }>
  }> {
    const industries = ['hvac', 'plumbing', 'electrical']
    const languages = ['en', 'es']
    const businessData = this.getSampleBusinessData()
    const results: Record<string, { success: boolean; tool_count: number; error?: string }> = {}
    let passed = 0
    let failed = 0

    for (const industry of industries) {
      for (const language of languages) {
        const key = `${industry}_${language}`
        try {
          const template = await this.templateService.getTemplate(industry, language)
          if (!template) {
            results[key] = { success: false, tool_count: 0, error: 'Template not found' }
            failed++
            continue
          }

          const vapiConfig = await this.templateService.createVapiAssistantConfig(
            industry,
            language,
            businessData
          )

          if (vapiConfig.tools && vapiConfig.tools.length >= 3) {
            results[key] = { success: true, tool_count: vapiConfig.tools.length }
            passed++
          } else {
            results[key] = { success: false, tool_count: vapiConfig.tools?.length || 0, error: 'Insufficient tools generated' }
            failed++
          }
        } catch (error) {
          results[key] = { success: false, tool_count: 0, error: String(error) }
          failed++
        }
      }
    }

    return { passed, failed, results }
  }

  // =====================================================
  // SMS Template Tests
  // =====================================================

  /**
   * Test SMS template rendering
   */
  async testSMSTemplateRendering(): Promise<{
    passed: number
    failed: number
    results: Record<string, { success: boolean; rendered_length: number; error?: string }>
  }> {
    const industries = ['hvac', 'plumbing', 'electrical']
    const languages = ['en', 'es']
    const messageTypes = ['appointment_confirmation', 'appointment_reminder', 'emergency_alert']
    const sampleVariables = {
      name: 'John Doe',
      date: 'January 15, 2024',
      time: '2:00 PM',
      address: '123 Main St, City, State 12345',
      business_phone: '(555) 123-4567'
    }
    const results: Record<string, { success: boolean; rendered_length: number; error?: string }> = {}
    let passed = 0
    let failed = 0

    for (const industry of industries) {
      for (const language of languages) {
        for (const messageType of messageTypes) {
          const key = `${industry}_${language}_${messageType}`
          try {
            const smsTemplate = await this.templateService.getSMSTemplate(
              industry,
              language,
              messageType,
              sampleVariables
            )

            if (smsTemplate && smsTemplate.length > 10) {
              results[key] = { success: true, rendered_length: smsTemplate.length }
              passed++
            } else {
              results[key] = { success: false, rendered_length: smsTemplate?.length || 0, error: 'SMS template not found or too short' }
              failed++
            }
          } catch (error) {
            results[key] = { success: false, rendered_length: 0, error: String(error) }
            failed++
          }
        }
      }
    }

    return { passed, failed, results }
  }

  // =====================================================
  // Emergency Keywords Tests
  // =====================================================

  /**
   * Test emergency keyword detection
   */
  async testEmergencyKeywords(): Promise<{
    passed: number
    failed: number
    results: Record<string, { success: boolean; keyword_count: number; error?: string }>
  }> {
    const industries = ['hvac', 'plumbing', 'electrical']
    const languages = ['en', 'es']
    const results: Record<string, { success: boolean; keyword_count: number; error?: string }> = {}
    let passed = 0
    let failed = 0

    for (const industry of industries) {
      for (const language of languages) {
        const key = `${industry}_${language}`
        try {
          const keywords = await this.templateService.getEmergencyKeywords(industry, language)

          if (keywords && keywords.length >= 10) {
            results[key] = { success: true, keyword_count: keywords.length }
            passed++
          } else {
            results[key] = { success: false, keyword_count: keywords?.length || 0, error: 'Insufficient emergency keywords' }
            failed++
          }
        } catch (error) {
          results[key] = { success: false, keyword_count: 0, error: String(error) }
          failed++
        }
      }
    }

    return { passed, failed, results }
  }

  // =====================================================
  // Language Detection Tests
  // =====================================================

  /**
   * Test language detection functionality
   */
  testLanguageDetection(): {
    passed: number
    failed: number
    results: Record<string, { success: boolean; detected_language: string; confidence: number }>
  } {
    const testCases = [
      { text: 'Hello, I need help with my HVAC system', expected: 'en' },
      { text: 'Hola, necesito ayuda con mi sistema de HVAC', expected: 'es' },
      { text: 'My furnace is not working', expected: 'en' },
      { text: 'Mi horno no está funcionando', expected: 'es' },
      { text: 'Emergency! No heat!', expected: 'en' },
      { text: '¡Emergencia! ¡Sin calefacción!', expected: 'es' }
    ]

    const results: Record<string, { success: boolean; detected_language: string; confidence: number }> = {}
    let passed = 0
    let failed = 0

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      const key = `test_${i}`
      
      try {
        const detection = this.templateService.detectLanguage(testCase.text)
        const success = detection.detected_language === testCase.expected

        results[key] = {
          success,
          detected_language: detection.detected_language,
          confidence: detection.confidence
        }

        if (success) {
          passed++
        } else {
          failed++
        }
      } catch (error) {
        results[key] = {
          success: false,
          detected_language: 'unknown',
          confidence: 0
        }
        failed++
      }
    }

    return { passed, failed, results }
  }

  // =====================================================
  // Comprehensive Test Suite
  // =====================================================

  /**
   * Run all tests and generate comprehensive report
   */
  async runAllTests(): Promise<{
    overall_success: boolean
    total_tests: number
    passed_tests: number
    failed_tests: number
    test_results: {
      template_loading: any
      language_fallback: any
      system_prompts: any
      tool_generation: any
      sms_templates: any
      emergency_keywords: any
      language_detection: any
    }
  }> {
    console.log('🧪 Starting comprehensive template testing...')

    const templateLoading = await this.testTemplateLoading()
    const languageFallback = await this.testLanguageFallback()
    const systemPrompts = await this.testSystemPromptGeneration()
    const toolGeneration = await this.testToolGeneration()
    const smsTemplates = await this.testSMSTemplateRendering()
    const emergencyKeywords = await this.testEmergencyKeywords()
    const languageDetection = this.testLanguageDetection()

    const totalTests = templateLoading.passed + templateLoading.failed +
                      systemPrompts.passed + systemPrompts.failed +
                      toolGeneration.passed + toolGeneration.failed +
                      smsTemplates.passed + smsTemplates.failed +
                      emergencyKeywords.passed + emergencyKeywords.failed +
                      languageDetection.passed + languageDetection.failed

    const passedTests = templateLoading.passed + systemPrompts.passed +
                       toolGeneration.passed + smsTemplates.passed +
                       emergencyKeywords.passed + languageDetection.passed

    const failedTests = totalTests - passedTests
    const overallSuccess = failedTests === 0

    console.log(`✅ Tests completed: ${passedTests}/${totalTests} passed`)

    return {
      overall_success: overallSuccess,
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: failedTests,
      test_results: {
        template_loading: templateLoading,
        language_fallback: languageFallback,
        system_prompts: systemPrompts,
        tool_generation: toolGeneration,
        sms_templates: smsTemplates,
        emergency_keywords: emergencyKeywords,
        language_detection: languageDetection
      }
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private getSampleBusinessData(): BusinessData {
    return {
      business_name: 'Test HVAC Company',
      business_phone: '(555) 123-4567',
      business_address: '123 Main St, City, State 12345',
      business_email: 'info@testhvac.com',
      primary_language: 'en',
      supported_languages: ['en', 'es'],
      timezone: 'America/New_York',
      emergency_contact_phone: '(555) 987-6543',
      emergency_contact_email: 'emergency@testhvac.com',
      sms_enabled: true,
      email_notifications: true,
      industry_specific: {}
    }
  }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create a server-side testing framework
 */
export function createServerTemplateTesting() {
  return new TemplateTestingFramework(true)
}

/**
 * Create a client-side testing framework
 */
export function createClientTemplateTesting() {
  return new TemplateTestingFramework(false)
}
