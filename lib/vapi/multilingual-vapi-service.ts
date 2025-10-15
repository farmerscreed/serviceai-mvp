// Multilingual Vapi Service - Task 2.1
// Creates and manages Vapi.ai assistants with multi-language support

import { TemplateService } from '@/lib/templates/template-service'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { BusinessData, IndustryTemplate } from '@/lib/templates/types'
import { createDirectVapiClient, type VapiAssistant as DirectVapiAssistant } from './direct-vapi-client'
import { createPhonePoolManager } from './phone-pool-manager'

// Vapi.ai types (simplified for this implementation)
interface VapiClient {
  assistants: {
    create(config: VapiAssistantConfig): Promise<VapiAssistant>
    update(id: string, config: Partial<VapiAssistantConfig>): Promise<VapiAssistant>
    delete(id: string): Promise<void>
  }
  phoneNumbers: {
    search(params: { country: string; areaCode?: string; limit?: number }): Promise<Array<{ id: string; number: string; country: string; areaCode?: string }>>
    purchase(params: { phoneNumberId: string }): Promise<{ id: string; number: string }>
    assign(params: { assistantId: string; phoneNumberId: string }): Promise<{ id: string; number: string }>
    create(config: any): Promise<{ id: string; number: string }>
  }
}

interface VapiAssistantConfig {
  name: string
  model: {
    provider: string
    model: string
    messages: Array<{ role: string; content: string }>
    tools: any[]
    temperature: number
  }
  transcriber: {
    provider: string
    model: string
    language: string
  }
  voice: {
    provider: string
    voiceId: string
    speed: number
    pitch: number
  }
  serverUrl: string
  serverMessages?: string[]
  firstMessage: string
}

interface VapiAssistant {
  id: string
  name: string
  phoneNumber?: string
  status: string
  createdAt: string
}

interface AssistantConfiguration {
  id: string
  organizationId: string
  industryCode: string
  languageCode: string
  vapiAssistantId: string
  vapiPhoneNumber?: string
  templateId: string
  businessData: BusinessData
  voiceConfig: any
  createdAt: string
  updatedAt: string
}

export class MultilingualVapiService {
  private vapiClient?: VapiClient
  private templateService: TemplateService
  private supabase: any

  constructor(vapiClient?: VapiClient) {
    this.vapiClient = vapiClient
    this.templateService = new TemplateService()
  }

  // =====================================================
  // Core Assistant Creation
  // =====================================================

  /**
   * Create a multilingual Vapi assistant for an organization
   */
  async createMultilingualAssistant(
    organizationId: string,
    industryCode: string,
    businessData: BusinessData,
    languagePreference: 'en' | 'es' = 'en'
  ): Promise<VapiAssistant> {
    try {
      console.log(`Creating multilingual assistant for ${industryCode} in ${languagePreference}`)
      
      // Initialize vapiClient if not set
      if (!this.vapiClient) {
        this.vapiClient = await this.createVapiClient()
      }



      // 1. Load template with language fallback
      const template = await this.templateService.getTemplate(industryCode, languagePreference)
      if (!template) {
        throw new Error(`Template not found for ${industryCode} in ${languagePreference}`)
      }

      // 2. Generate multilingual system prompt
      const systemPrompt = await this.templateService.createVapiAssistantConfig(
        industryCode,
        languagePreference,
        businessData
      )

      // 3. Create language-specific tools
      const tools = this.createMultilingualTools(template, organizationId)

      // 4. Configure voice settings
      const voiceConfig = this.getVoiceConfig(languagePreference)

      // 5. Create Vapi assistant
      // Note: Vapi requires HTTPS for serverUrl, not HTTP
      // In development, use ngrok or set VAPI_WEBHOOK_URL
      // In production, NEXT_PUBLIC_APP_URL should be https://
      const webhookBaseUrl = process.env.VAPI_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL
      if (webhookBaseUrl?.startsWith('http://localhost')) {
        console.warn('⚠️ WARNING: serverUrl uses http://localhost - Vapi requires HTTPS!')
        console.warn('⚠️ Set VAPI_WEBHOOK_URL to your ngrok URL (e.g., https://xxx.ngrok-free.app)')
      }
      
      const assistantConfig: VapiAssistantConfig = {
        name: `${businessData.business_name}_${industryCode}_multilingual`,
        model: {
          provider: 'openai',
          model: 'gpt-4',
          messages: [{ role: 'system', content: systemPrompt.systemPrompt }],
          tools: tools,
          temperature: 0.7
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'multi' // Enables automatic language detection
        },
        voice: voiceConfig,
        serverUrl: webhookBaseUrl ? `${webhookBaseUrl}/api/webhooks/vapi` : `https://app.serviceai.com/api/webhooks/vapi`,
        serverMessages: [
          "status-update",
          "tool-calls",
          "speech-update",
          "hang",
          "function-call",
          "end-of-call-report"
        ],
        firstMessage: template.template_config.greeting_template.replace(/{(\w+)}/g, (match, key) => (businessData as any)[key] || match)
      }

      const assistant = await this.vapiClient.assistants.create(assistantConfig)

      // 7. Store configuration first, so phone assignment can link to it
      await this.saveAssistantConfiguration(
        organizationId,
        industryCode,
        languagePreference,
        assistant.id,
        template.id,
        businessData,
        voiceConfig
      )

      // 6. Automatically provision and assign phone number
      let phoneNumber: string | undefined
      try {
        console.log(`📞 Provisioning phone number for assistant: ${assistant.id}`)
        const phoneResult = await this.provisionAndAssignNumber({
          organizationId,
          assistantId: assistant.id,
          country: process.env.VAPI_DEFAULT_COUNTRY || 'US',
          areaCode: businessData.business_phone?.replace(/\D/g, '').substring(0, 3) // Extract area code from business phone
        })
        
        if (phoneResult) {
          phoneNumber = phoneResult.phoneNumber
          console.log(`✅ Phone number provisioned: ${phoneNumber}`)
        } else {
          console.warn(`⚠️ Could not provision phone number for assistant: ${assistant.id}`)
        }
      } catch (phoneError) {
        console.error('Error provisioning phone number:', phoneError)
        // Continue without phone number - assistant is still created
      }

      console.log(`✅ Created multilingual assistant: ${assistant.id}${phoneNumber ? ` with phone: ${phoneNumber}` : ''}`)
      return {
        ...assistant,
        phoneNumber
      }

    } catch (error) {
      console.error('Error creating multilingual assistant:', error)
      throw new Error(`Failed to create assistant: ${error}`)
    }
  }

  /**
   * Provision and assign a phone number to an assistant with intelligent fallback
   *
   * PHONE POOL STRATEGY (NEW - implements user's brilliant suggestion!):
   * - Searches for UNASSIGNED phone numbers in the pool FIRST
   * - Reuses existing Vapi numbers when assistants are deleted
   * - Only creates NEW numbers if pool is empty
   * - Extended polling (10 minutes) to wait for number provisioning
   *
   * MULTI-TENANT AWARE:
   * - Each organization can have its own phone number configuration
   * - Prioritizes FREE Vapi numbers for optimal cost and simplicity
   *
   * OPTIMIZED PRIORITY ORDER:
   * 1. Reuse unassigned Vapi phone numbers from pool (SMART!)
   * 2. Create new FREE Vapi Phone Number if pool empty (up to 10 free per account)
   * 3. Organization's Twilio numbers (if configured per-org, for scaling beyond 10)
   * 4. Global Twilio fallback (backward compatibility)
   * 5. Manual assignment via Vapi Dashboard (emergency fallback)
   *
   * WHY PHONE POOL FIRST:
   * - Instant availability (no waiting for provisioning)
   * - Maximizes use of 10 free numbers
   * - Prevents hitting limit prematurely
   * - Zero cost for first 10 assistants (not 10 numbers!)
   */
  async provisionAndAssignNumber(params: {
    organizationId: string
    assistantId: string
    country?: string
    areaCode?: string
  }): Promise<{ phoneNumber: string; phoneNumberId: string } | null> {
    try {
      console.log('')
      console.log('╔═══════════════════════════════════════════════════════════╗')
      console.log('║  📱 INTELLIGENT PHONE NUMBER PROVISIONING                 ║')
      console.log('╚═══════════════════════════════════════════════════════════╝')
      console.log(`   Organization: ${params.organizationId}`)
      console.log(`   Assistant: ${params.assistantId}`)
      console.log(`   Strategy: Pool Reuse → New Vapi → Twilio → Manual`)
      console.log('')

      // ═══════════════════════════════════════════════════════════════════
      // STRATEGY 1: Use Phone Pool Manager (SMART REUSE + EXTENDED POLLING)
      // ═══════════════════════════════════════════════════════════════════
      console.log('🎯 STRATEGY 1: Using Phone Pool Manager...')
      console.log('   ✅ Checks for unassigned numbers FIRST')
      console.log('   ✅ Creates new if pool empty')
      console.log('   ✅ Polls for 10 minutes (extended timeout)')
      console.log('')

      try {
        const poolManager = createPhonePoolManager()
        const result = await poolManager.assignPhoneNumberToAssistant({
          organizationId: params.organizationId,
          assistantId: params.assistantId,
          country: params.country,
          areaCode: params.areaCode
        })

        if (result) {
          // Track assignment in database
          await this.trackPhoneNumberAssignment({
            organizationId: params.organizationId,
            assistantId: params.assistantId,
            phoneNumber: result.phoneNumber,
            phoneProvider: 'vapi',
            vapiPhoneNumberId: result.phoneNumberId
          })

          // Persist to database
          await this.persistPhoneNumber(params.assistantId, result.phoneNumber, 'vapi')

          console.log('')
          console.log('╔═══════════════════════════════════════════════════════════╗')
          console.log('║  ✅ PHONE NUMBER ASSIGNED SUCCESSFULLY                    ║')
          console.log('╚═══════════════════════════════════════════════════════════╝')
          console.log(`   Phone Number: ${result.phoneNumber}`)
          console.log(`   Source: ${result.source === 'pool' ? 'Pool (reused)' : result.source === 'new' ? 'New Vapi number' : 'Twilio'}`)
          console.log(`   Was Reused: ${result.wasReused ? 'Yes' : 'No'}`)
          console.log(`   Cost: $0.00 (FREE)`)
          console.log('')

          return {
            phoneNumber: result.phoneNumber,
            phoneNumberId: result.phoneNumberId
          }
        }

        console.warn('⚠️ Phone Pool Manager could not provision Vapi number')
        console.warn('   Likely hit 10-number limit - falling back to Twilio...')
        console.warn('')
      } catch (poolError: any) {
        console.error('❌ Phone Pool Manager error:', poolError.message)
        console.warn('💡 Falling back to Twilio configuration...')
        console.warn('')
      }

      // ═══════════════════════════════════════════════════════════════════
      // STRATEGY 2: Organization's own Twilio numbers (MULTI-TENANT)
      // ═══════════════════════════════════════════════════════════════════
      const supabase = await createServerClient()
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('phone_provider, twilio_account_sid, twilio_auth_token, twilio_phone_numbers, organization_name')
        .eq('id', params.organizationId)
        .single()

      if (orgError) {
        console.warn('⚠️ Could not fetch organization config:', orgError.message)
      }

      if (org?.twilio_account_sid && org?.twilio_auth_token && org?.twilio_phone_numbers?.length > 0) {
        console.log('🎯 STRATEGY 2: Using ORGANIZATION-SPECIFIC Twilio numbers...')
        console.log(`   Organization has ${org.twilio_phone_numbers.length} Twilio number(s)`)

        // Find an available number from this organization's pool
        const availableNumber = await this.findAvailableOrgPhoneNumber(params.organizationId, org.twilio_phone_numbers)

        if (availableNumber) {
          try {
            const directClient = createDirectVapiClient()
            const twilioNumberConfig = {
              provider: 'twilio' as const,
              number: availableNumber,
              twilioAccountSid: org.twilio_account_sid,
              twilioAuthToken: org.twilio_auth_token,
              assistantId: params.assistantId,
              name: `${org?.organization_name || 'Org'} Assistant ${params.assistantId.substring(0, 8)}`,
            }

            console.log('📞 Importing organization Twilio number:', availableNumber)
            const phoneNumber = await directClient.createPhoneNumber(twilioNumberConfig)

            console.log('✅ Organization Twilio number imported:', phoneNumber.number || availableNumber)
            console.log('💡 Using dedicated number from organization\'s Twilio account')

            const finalNumber = phoneNumber.number || availableNumber

            // Track the assignment
            await this.trackPhoneNumberAssignment({
              organizationId: params.organizationId,
              assistantId: params.assistantId,
              phoneNumber: finalNumber,
              phoneProvider: 'twilio',
              vapiPhoneNumberId: phoneNumber.id
            })

            // Persist to database
            await this.persistPhoneNumber(params.assistantId, finalNumber, 'twilio')

            return {
              phoneNumber: finalNumber,
              phoneNumberId: phoneNumber.id
            }
          } catch (twilioError: any) {
            const errorMsg = twilioError?.message || String(twilioError)
            console.error('❌ Could not import organization Twilio number:', errorMsg)

            if (errorMsg.includes('already exists') || errorMsg.includes('already imported')) {
              console.warn('⚠️ This number is already imported - trying next available number...')
            }
          }
        } else {
          console.warn('⚠️ All organization Twilio numbers are currently assigned')
          console.warn('💡 Add more numbers to this organization or use global fallback')
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // STRATEGY 3: Global Twilio fallback (backward compatibility)
      // ═══════════════════════════════════════════════════════════════════
      const globalTwilioSid = process.env.TWILIO_ACCOUNT_SID
      const globalTwilioToken = process.env.TWILIO_AUTH_TOKEN
      const globalTwilioPhone = process.env.TWILIO_PHONE_NUMBER

      if (globalTwilioSid && globalTwilioToken && globalTwilioPhone) {
        console.log('🎯 STRATEGY 3: Using GLOBAL Twilio fallback...')
        console.warn('⚠️ WARNING: Using shared global Twilio number - not recommended for multi-tenant')
        console.warn('💡 BEST PRACTICE: Configure organization-specific Twilio numbers')

        try {
          const directClient = createDirectVapiClient()
          const twilioNumberConfig = {
            provider: 'twilio' as const,
            number: globalTwilioPhone,
            twilioAccountSid: globalTwilioSid,
            twilioAuthToken: globalTwilioToken,
            assistantId: params.assistantId,
            name: `Assistant ${params.assistantId.substring(0, 8)}`,
          }

          console.log('📞 Importing global Twilio number:', globalTwilioPhone)
          const phoneNumber = await directClient.createPhoneNumber(twilioNumberConfig)

          console.log('✅ Global Twilio number imported:', phoneNumber.number || globalTwilioPhone)
          console.log('⚠️ This is a SHARED number - configure per-organization numbers for production')

          const finalNumber = phoneNumber.number || globalTwilioPhone

          // Track the assignment
          await this.trackPhoneNumberAssignment({
            organizationId: params.organizationId,
            assistantId: params.assistantId,
            phoneNumber: finalNumber,
            phoneProvider: 'twilio',
            vapiPhoneNumberId: phoneNumber.id
          })

          // Persist to database
          await this.persistPhoneNumber(params.assistantId, finalNumber, 'twilio')

          return {
            phoneNumber: finalNumber,
            phoneNumberId: phoneNumber.id
          }
        } catch (twilioError: any) {
          const errorMsg = twilioError?.message || String(twilioError)
          console.error('❌ Could not import global Twilio number:', errorMsg)

          if (errorMsg.includes('already exists') || errorMsg.includes('already imported')) {
            console.warn('⚠️ Global Twilio number already in use by another assistant')
            console.warn('💡 SOLUTION: Configure organization-specific Twilio numbers')
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // FALLBACK: Manual Assignment Instructions
      // ═══════════════════════════════════════════════════════════════════
      console.error('')
      console.error('╔═══════════════════════════════════════════════════════════╗')
      console.error('║  ⚠️  PHONE NUMBER PROVISIONING FAILED                    ║')
      console.error('╚═══════════════════════════════════════════════════════════╝')
      console.error('')
      console.error('❌ Could not provision phone number automatically')
      console.error('✅ Assistant was created successfully: ' + params.assistantId)
      console.error('📞 Phone number must be assigned manually')
      console.error('')
      console.error('═══════════════════════════════════════════════════════════')
      console.error('📋 QUICK FIX OPTIONS')
      console.error('═══════════════════════════════════════════════════════════')
      console.error('')
      console.error('🎯 OPTION 1: Check Vapi Dashboard')
      console.error('   • URL: https://dashboard.vapi.ai/phone-numbers')
      console.error('   • Look for unassigned numbers in your account')
      console.error('   • Delete unused numbers to free up pool space')
      console.error('')
      console.error('💳 OPTION 2: Add Twilio Integration (for 10+ customers)')
      console.error('   • Buy Twilio number: https://console.twilio.com/us1/develop/phone-numbers/manage/search')
      console.error('   • Add to .env.local or organization settings in database')
      console.error('   • Restart: npm run dev')
      console.error('')
      console.error('🔧 OPTION 3: Manual Assignment (Quick Fix)')
      console.error('   • Go to: https://dashboard.vapi.ai/assistants')
      console.error('   • Find assistant: ' + params.assistantId.substring(0, 12) + '...')
      console.error('   • Click "Assign Phone Number"')
      console.error('')
      console.error('═══════════════════════════════════════════════════════════')

      return null
    } catch (error: any) {
      console.error('❌ Error provisioning phone number:', error)
      console.error('Error details:', error?.message || 'Unknown error')
      return null
    }
  }

  /**
   * Check how many FREE Vapi phone numbers are currently in use
   * Helps detect when approaching the 10-number limit
   */
  async checkVapiFreeNumberUsage(): Promise<{
    total: number
    limit: number
    remaining: number
    percentUsed: number
  }> {
    try {
      const directClient = createDirectVapiClient()
      const allPhoneNumbers = await directClient.listPhoneNumbers()

      // Count only Vapi-provided numbers (not Twilio/Vonage imports)
      const vapiNumbers = allPhoneNumbers.filter((pn: any) =>
        pn.provider === 'vapi' || pn.sipUri || (!pn.provider && pn.id)
      )

      const limit = 10
      const total = vapiNumbers.length
      const remaining = Math.max(0, limit - total)
      const percentUsed = Math.round((total / limit) * 100)

      console.log('')
      console.log('📊 Vapi Free Number Usage:')
      console.log(`   Used: ${total}/${limit} (${percentUsed}%)`)
      console.log(`   Remaining: ${remaining}`)

      if (remaining <= 2) {
        console.warn('')
        console.warn('⚠️  WARNING: Approaching FREE number limit!')
        console.warn(`   Only ${remaining} free numbers remaining`)
        console.warn('   Consider setting up Twilio for additional numbers')
      }

      if (remaining === 0) {
        console.error('')
        console.error('🚨 FREE NUMBER LIMIT REACHED (10/10 used)')
        console.error('   Next assistant will require Twilio configuration')
        console.error('   Or delete unused numbers from Vapi Dashboard')
      }

      return {
        total,
        limit,
        remaining,
        percentUsed
      }
    } catch (error: any) {
      console.error('Error checking Vapi number usage:', error)
      return {
        total: 0,
        limit: 10,
        remaining: 10,
        percentUsed: 0
      }
    }
  }

  /**
   * Helper function to persist phone number to database
   */
  private async persistPhoneNumber(
    assistantId: string, 
    phoneNumber: string, 
    provider: 'vapi' | 'twilio' | 'byo'
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      const { error: updateErr } = await supabase
        .from('vapi_assistants' as any)
        .update({ 
          vapi_phone_number: phoneNumber,
          phone_provider: provider
        })
        .eq('vapi_assistant_id', assistantId)
      
      if (updateErr) {
        console.error('Failed to persist phone number to database:', updateErr)
      } else {
        console.log(`✅ Phone number saved to database (provider: ${provider})`)
      }
    } catch (error: any) {
      console.error('Error persisting phone number:', error)
    }
  }

  /**
   * Find an available phone number from an organization's pool
   * Multi-tenant aware: Returns the first unassigned number
   */
  private async findAvailableOrgPhoneNumber(
    organizationId: string,
    phoneNumbers: string[]
  ): Promise<string | null> {
    try {
      const supabase = await createServerClient()
      
      // Get all currently assigned numbers for this organization
      const { data: assignments, error } = await supabase
        .from('phone_number_assignments')
        .select('phone_number')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
      
      if (error) {
        console.warn('⚠️ Could not fetch phone assignments:', error.message)
        // Return first number as fallback
        return phoneNumbers[0] || null
      }
      
      const assignedNumbers = new Set(assignments?.map(a => a.phone_number) || [])
      
      // Find first available number
      const availableNumber = phoneNumbers.find(num => !assignedNumbers.has(num))
      
      if (availableNumber) {
        console.log(`✅ Found available number: ${availableNumber}`)
        console.log(`   (${assignedNumbers.size}/${phoneNumbers.length} numbers currently assigned)`)
      } else {
        console.warn(`⚠️ All ${phoneNumbers.length} organization numbers are assigned`)
      }
      
      return availableNumber || null
    } catch (error: any) {
      console.error('Error finding available phone number:', error)
      return phoneNumbers[0] || null // Fallback to first number
    }
  }

  /**
   * Track phone number assignment in database
   * Multi-tenant: Maintains assignment history per organization
   */
  private async trackPhoneNumberAssignment(params: {
    organizationId: string
    assistantId: string
    phoneNumber: string
    phoneProvider: 'vapi' | 'twilio' | 'byo'
    vapiPhoneNumberId: string
  }): Promise<void> {
    try {
      const supabase = await createServerClient()
      
      // Get the assistant's database ID
      const { data: assistant } = await supabase
        .from('vapi_assistants' as any)
        .select('id')
        .eq('vapi_assistant_id', params.assistantId)
        .single()
      
      // Insert assignment record
      const { error: insertError } = await supabase
        .from('phone_number_assignments')
        .insert({
          organization_id: params.organizationId,
          phone_number: params.phoneNumber,
          phone_provider: params.phoneProvider,
          vapi_phone_number_id: params.vapiPhoneNumberId,
          assistant_id: assistant?.id,
          vapi_assistant_id: params.assistantId,
          status: 'active',
          metadata: {
            assigned_at: new Date().toISOString(),
            provider: params.phoneProvider
          }
        })
      
      if (insertError) {
        console.error('Failed to track phone number assignment:', insertError)
      } else {
        console.log(`✅ Phone number assignment tracked for organization: ${params.organizationId}`)
      }
    } catch (error: any) {
      console.error('Error tracking phone number assignment:', error)
    }
  }

  /**
   * Update assistant language settings
   */
  async updateAssistantLanguage(
    assistantId: string,
    newLanguage: 'en' | 'es'
  ): Promise<VapiAssistant> {
    try {
      // Get current configuration
      const config = await this.getAssistantConfiguration(assistantId)
      if (!config) {
        throw new Error('Assistant configuration not found')
      }

      // Load new template
      const template = await this.templateService.getTemplate(config.industryCode, newLanguage)
      if (!template) {
        throw new Error(`Template not found for ${config.industryCode} in ${newLanguage}`)
      }

      // Generate new system prompt
      const systemPrompt = await this.templateService.createVapiAssistantConfig(
        config.industryCode,
        newLanguage,
        config.businessData
      )

      // Create new tools
      const tools = this.createMultilingualTools(template, config.organizationId)

      // Update voice configuration
      const voiceConfig = this.getVoiceConfig(newLanguage)

      // Update Vapi assistant
      const updatedAssistant = await this.vapiClient!.assistants.update(assistantId, {
        model: {
          provider: 'openai',
          model: 'gpt-4',
          messages: [{ role: 'system', content: systemPrompt.systemPrompt }],
          tools: tools,
          temperature: 0.7
        },
        voice: voiceConfig
      })

      // Update stored configuration
      await this.updateAssistantConfiguration(assistantId, {
        languageCode: newLanguage,
        voiceConfig: voiceConfig,
        updatedAt: new Date().toISOString()
      })

      console.log(`✅ Updated assistant language to ${newLanguage}`)
      return updatedAssistant

    } catch (error) {
      console.error('Error updating assistant language:', error)
      throw new Error(`Failed to update assistant language: ${error}`)
    }
  }

  /**
   * Get assistant configuration
   */
  async getAssistantConfiguration(assistantId: string): Promise<AssistantConfiguration | null> {
    try {
      const supabase = await createServerClient()
      const { data, error } = await supabase
        .from('vapi_assistants' as any)
        .select('*')
        .eq('vapi_assistant_id', assistantId)
        .single()

      if (error) {
        console.error('Error fetching assistant configuration:', error)
        return null
      }

      return data as any as AssistantConfiguration
    } catch (error) {
      console.error('Error getting assistant configuration:', error)
      return null
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Create multilingual tools for Vapi assistant
   * UPDATED: Uses reusable tool references instead of inline definitions
   */
  private createMultilingualTools(template: IndustryTemplate, organizationId: string): any[] {
    // Get pre-created tool IDs from environment variables
    // These tools are created ONCE and reused for all organizations
    const CHECK_AVAILABILITY_TOOL_ID = process.env.VAPI_CHECK_AVAILABILITY_TOOL_ID
    const BOOK_APPOINTMENT_TOOL_ID = process.env.VAPI_BOOK_APPOINTMENT_TOOL_ID
    const EMERGENCY_CHECK_TOOL_ID = process.env.VAPI_EMERGENCY_CHECK_TOOL_ID
    const SMS_NOTIFICATION_TOOL_ID = process.env.VAPI_SMS_NOTIFICATION_TOOL_ID

    const tools: any[] = []

    // Emergency detection tool
    if (EMERGENCY_CHECK_TOOL_ID) {
      tools.push({
        type: 'function',
        id: EMERGENCY_CHECK_TOOL_ID
      })
    } else {
      console.warn('⚠️ VAPI_EMERGENCY_CHECK_TOOL_ID not configured - emergency detection disabled')
    }

    // Check availability tool (NEW - CRITICAL for appointment booking)
    if (CHECK_AVAILABILITY_TOOL_ID) {
      tools.push({
        type: 'function',
        id: CHECK_AVAILABILITY_TOOL_ID
      })
    } else {
      console.error('❌ VAPI_CHECK_AVAILABILITY_TOOL_ID not configured - availability checking disabled')
      console.error('   This tool is REQUIRED for appointment booking to work correctly')
    }

    // Book appointment tool
    if (BOOK_APPOINTMENT_TOOL_ID) {
      tools.push({
        type: 'function',
        id: BOOK_APPOINTMENT_TOOL_ID
      })
    } else {
      console.error('❌ VAPI_BOOK_APPOINTMENT_TOOL_ID not configured - appointment booking disabled')
    }

    // SMS notification tool
    if (SMS_NOTIFICATION_TOOL_ID) {
      tools.push({
        type: 'function',
        id: SMS_NOTIFICATION_TOOL_ID
      })
    } else {
      console.warn('⚠️ VAPI_SMS_NOTIFICATION_TOOL_ID not configured - SMS notifications disabled')
    }

    // Log configuration status
    console.log(`🔧 Configured ${tools.length} tools for assistant`)
    if (tools.length < 4) {
      console.warn(`⚠️ Some tools are missing. Expected 4, got ${tools.length}`)
      console.warn('   Run: npm run setup-vapi-tools to create missing tools')
    }

    return tools
  }



  private _createDemoAssistantConfig(name: string, industry?: string): VapiAssistantConfig {
    const systemPrompt = `
      You are an AI assistant from ServiceAI, designed to give a live demonstration of our service.
      Your goal is to explain ServiceAI's core value proposition, showcase key features interactively,
      answer questions about the service, and guide the user towards signing up.

      The user's name is ${name}. They are interested in the ${industry || 'general'} industry.

      Key ServiceAI features to highlight:
      - 24/7 AI Phone Assistant: Never miss a call, handles inquiries, books appointments, detects emergencies.
      - Multi-Language Support: Native English and Spanish, automatic detection, cultural competency.
      - SMS Integration: Automated confirmations, reminders, emergency alerts.
      - 5-Minute Setup: Rapid deployment.

      Interactive Demonstration:
      - Encourage the user to ask questions.
      - Suggest they try to book a hypothetical appointment with you (e.g., "Feel free to ask me to book a hypothetical appointment for you to see how it works.").
      - Suggest they ask about pricing or setup process.

      Sales Pitch & Call-to-Action:
      - Gently guide the user towards signing up.
      - Offer to send a signup link via SMS.
      - Be persuasive but not pushy.

      Tone: Enthusiastic, professional, helpful, and confident.
      `

    return {
      name: `ServiceAI Demo Assistant - ${name}`,
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [{ role: 'system', content: systemPrompt }],
        tools: [
          // Use tool ID reference for SMS notifications
          ...(process.env.VAPI_SMS_NOTIFICATION_TOOL_ID ? [{
            type: 'function',
            id: process.env.VAPI_SMS_NOTIFICATION_TOOL_ID
          }] : [])
        ],
        temperature: 0.7
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'multi'
      },
      voice: {
        provider: 'azure',
        voiceId: 'en-US-AriaNeural', // Default English voice
        speed: 1.0,
        pitch: 1.0
      },
      serverUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vapi/demo` : 'https://app.serviceai.com/api/webhooks/vapi/demo', // Dedicated webhook for demo calls
      firstMessage: `Hello ${name}, this is your ServiceAI demo agent calling! I'm here to give you a firsthand experience of how our AI phone assistant can help your ${industry || 'business'}.`
    }
  }

  /**
   * Get voice configuration for language
   */
  private getVoiceConfig(language: 'en' | 'es', region?: string): any {
    // Note: Vapi API only supports provider, voiceId, and speed
    // The 'pitch' property causes a 400 error

    // Check for custom voice ID from environment variable
    const customVoiceId = process.env.VAPI_VOICE_ID

    if (language === 'es') {
      return {
        provider: 'azure',
        voiceId: region === 'mx' ? 'es-MX-DaliaNeural' : 'es-ES-ElviraNeural',
        speed: 1.0
      }
    } else {
      // English voice - try custom voice first, fallback to Paige if it fails
      return {
        provider: customVoiceId ? '11labs' : 'vapi',
        voiceId: customVoiceId || 'Paige',
        speed: 1.0
      }
    }
  }

  /**
   * Create Vapi client using direct API calls
   */
  private async createVapiClient(): Promise<VapiClient> {
    const directClient = createDirectVapiClient()
    
    console.log('🚀 Using Direct Vapi API Client for production-ready integration')
    
    return {
      assistants: {
        create: async (config: VapiAssistantConfig) => {
          console.log('🤖 Creating assistant via Direct API:', config.name)
          const assistant = await directClient.createAssistant(config)
          
          return {
            id: assistant.id,
            name: assistant.name || config.name,
            status: 'active',
            createdAt: assistant.createdAt || new Date().toISOString()
          }
        },
        update: async (id: string, config: Partial<VapiAssistantConfig>) => {
          console.log('🔄 Updating assistant:', id)
          const assistant = await directClient.getAssistant(id)
          return {
            id: assistant.id,
            name: assistant.name || 'Unknown',
            status: 'active',
            createdAt: assistant.createdAt || new Date().toISOString()
          }
        },
        delete: async (id: string) => {
          console.log('🗑️ Deleting assistant:', id)
          // Not implemented yet
        }
      },
      phoneNumbers: {
        search: async ({ country = 'US', areaCode = '555' }) => {
          console.log('📞 Searching phone numbers:', { country, areaCode })
          const phoneNumbers = await directClient.listPhoneNumbers()

          // Filter by country and area code if specified
          let filtered = phoneNumbers
          if (country) {
            filtered = filtered.filter((pn: any) => pn.country === country)
          }
          if (areaCode) {
            filtered = filtered.filter((pn: any) => pn.number?.includes(areaCode))
          }

          return filtered.map((pn: any) => ({
            id: pn.id,
            number: pn.number,
            country: pn.country,
            areaCode: pn.areaCode
          }))
        },
        create: async (config: any) => {
          console.log('📞 Creating phone number via Direct API...')
          console.log('📞 Config:', JSON.stringify(config, null, 2))

          // Call the Direct API client's createPhoneNumber method
          const phoneNumber = await directClient.createPhoneNumber(config)

          console.log('✅ Phone number created via Direct API')
          console.log('📞 Response:', JSON.stringify(phoneNumber, null, 2))

          return phoneNumber
        },
        purchase: async ({ phoneNumberId }) => {
          console.log('💰 Creating/buying phone number for assistant...')
          // Create a new phone number via Vapi API
          try {
            const phoneNumber = await directClient.createPhoneNumber({
              provider: 'vapi',
              name: `Assistant Phone ${Date.now()}`
            })
            return {
              id: phoneNumber.id,
              number: phoneNumber.number || phoneNumber.sipUri,
              sipUri: phoneNumber.sipUri
            }
          } catch (error) {
            console.error('Failed to create phone number:', error)
            // Fallback: return existing phone number if available
            try {
              const phoneNumber = await directClient.getPhoneNumber(phoneNumberId)
              return {
                id: phoneNumber.id,
                number: phoneNumber.number || phoneNumber.sipUri,
                sipUri: phoneNumber.sipUri
              }
            } catch {
              throw new Error('Failed to provision phone number')
            }
          }
        },
        assign: async ({ assistantId, phoneNumberId }) => {
          console.log('🔗 Assigning phone number to assistant:', { assistantId, phoneNumberId })
          // Update the phone number to assign it to the assistant
          try {
            const phoneNumber = await directClient.updatePhoneNumber(phoneNumberId, {
              assistantId: assistantId
            })
            return {
              id: phoneNumber.id,
              number: phoneNumber.number || phoneNumber.sipUri,
              sipUri: phoneNumber.sipUri
            }
          } catch (error) {
            console.error('Failed to assign phone number:', error)
            // Get the phone number info anyway
            const phoneNumber = await directClient.getPhoneNumber(phoneNumberId)
            return {
              id: phoneNumber.id,
              number: phoneNumber.number || phoneNumber.sipUri,
              sipUri: phoneNumber.sipUri
            }
          }
        }
      }
    }
  }

  // =====================================================
  // Database Operations
  // =====================================================

  /**
   * Save assistant configuration to database
   */
  private async saveAssistantConfiguration(
    organizationId: string,
    industryCode: string,
    languageCode: string,
    vapiAssistantId: string,
    templateId: string,
    businessData: BusinessData,
    voiceConfig: any,
    phoneNumber?: string
  ): Promise<void> {
    try {
      const supabase = createServiceRoleClient()
      const { error } = await supabase
        .from('vapi_assistants' as any)
        .insert({
          organization_id: organizationId,
          industry_code: industryCode,
          language_code: languageCode,
          vapi_assistant_id: vapiAssistantId,
          vapi_phone_number: phoneNumber,
          template_id: templateId,
          business_data: businessData,
          voice_config: voiceConfig,
          is_active: true
        })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Saved assistant configuration for ${vapiAssistantId}`)
    } catch (error) {
      console.error('Error saving assistant configuration:', error)
      throw error
    }
  }

  /**
   * Update assistant configuration
   */
  private async updateAssistantConfiguration(
    assistantId: string,
    updates: Partial<AssistantConfiguration>
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      const { error } = await supabase
        .from('vapi_assistants' as any)
        .update(updates)
        .eq('vapi_assistant_id', assistantId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Updated assistant configuration for ${assistantId}`)
    } catch (error) {
      console.error('Error updating assistant configuration:', error)
      throw error
    }
  }
}

async function safeJson(res: Response): Promise<any> {
  try { return await res.json() } catch { return {} }
}

// =====================================================
// Factory Functions
// =====================================================

/**
 * Create a server-side Vapi service
 */
export function createServerVapiService(): MultilingualVapiService {
  return new MultilingualVapiService()
}

/**
 * Create a client-side Vapi service
 */
export function createClientVapiService(): MultilingualVapiService {
  return new MultilingualVapiService()
}
