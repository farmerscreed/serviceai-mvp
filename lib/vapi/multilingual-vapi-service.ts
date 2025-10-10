// Multilingual Vapi Service - Task 2.1
// Creates and manages Vapi.ai assistants with multi-language support

import { TemplateService } from '@/lib/templates/template-service'
import { createServerClient } from '@/lib/supabase/server'
import type { BusinessData, IndustryTemplate } from '@/lib/templates/types'
import { createDirectVapiClient, type VapiAssistant as DirectVapiAssistant } from './direct-vapi-client'

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
        serverUrl: webhookBaseUrl ? `${webhookBaseUrl}/api/webhooks/vapi/${organizationId}` : `https://app.serviceai.com/api/webhooks/vapi/${organizationId}`,
        firstMessage: template.template_config.greeting_template.replace(/{(\w+)}/g, (match, key) => (businessData as any)[key] || match)
      }

      const assistant = await this.vapiClient.assistants.create(assistantConfig)

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

      // 7. Store configuration with phone number
      await this.saveAssistantConfiguration(
        organizationId,
        industryCode,
        languagePreference,
        assistant.id,
        template.id,
        businessData,
        voiceConfig,
        phoneNumber
      )

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
   * MULTI-TENANT AWARE:
   * - Each organization can have its own phone number configuration
   * - Checks organization-specific settings first, then falls back to global config
   * 
   * PRIORITY ORDER (based on https://docs.vapi.ai/api-reference/phone-numbers/create):
   * 1. Organization's Twilio numbers (if configured per-org)
   * 2. Global Twilio fallback (if configured globally)
   * 3. FREE Vapi SIP number (up to 10 free numbers globally) - RECOMMENDED
   * 4. Organization's BYO SIP trunk (if configured per-org)
   * 5. Manual assignment via Vapi Dashboard
   */
  async provisionAndAssignNumber(params: {
    organizationId: string
    assistantId: string
    country?: string
    areaCode?: string
  }): Promise<{ phoneNumber: string; phoneNumberId: string } | null> {
    try {
      console.log('📞 Starting MULTI-TENANT phone number provisioning')
      console.log(`   Organization: ${params.organizationId}`)
      console.log(`   Assistant: ${params.assistantId}`)
      
      // Get organization-specific phone configuration from database
      const supabase = await createServerClient()
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('phone_provider, twilio_account_sid, twilio_auth_token, twilio_phone_numbers, byo_sip_credential_id')
        .eq('id', params.organizationId)
        .single()
      
      if (orgError) {
        console.warn('⚠️ Could not fetch organization config:', orgError.message)
      }
      
      console.log(`   Org phone provider: ${org?.phone_provider || 'not set'}`)
      
      // Get global fallback configuration from environment
      const globalTwilioSid = process.env.TWILIO_ACCOUNT_SID
      const globalTwilioToken = process.env.TWILIO_AUTH_TOKEN
      const globalTwilioPhone = process.env.TWILIO_PHONE_NUMBER
      const globalByoCredentialId = process.env.BYO_SIP_CREDENTIAL_ID
      
      // STRATEGY 1: Organization's own Twilio numbers (MULTI-TENANT)
      if (org?.twilio_account_sid && org?.twilio_auth_token && org?.twilio_phone_numbers?.length > 0) {
        console.log('📞 Strategy 1: Using ORGANIZATION-SPECIFIC Twilio numbers...')
        console.log(`   Organization has ${org.twilio_phone_numbers.length} Twilio number(s)`)
        
        // Find an available number from this organization's pool
        const availableNumber = await this.findAvailableOrgPhoneNumber(params.organizationId, org.twilio_phone_numbers)
        
        if (availableNumber) {
          try {
            const twilioNumberConfig = {
              provider: 'twilio' as const,
              number: availableNumber,
              twilioAccountSid: org.twilio_account_sid,
              twilioAuthToken: org.twilio_auth_token,
              assistantId: params.assistantId,
              name: `${org?.organization_name || 'Org'} Assistant ${params.assistantId.substring(0, 8)}`,
            }
            
            console.log('📞 Importing organization Twilio number:', availableNumber)
            const phoneNumber = await this.vapiClient!.phoneNumbers.create(twilioNumberConfig)
            
            console.log('✅ Organization Twilio number imported:', phoneNumber.number)
            console.log('💡 Using dedicated number from organization\'s Twilio account')
            
            // Track the assignment
            await this.trackPhoneNumberAssignment({
              organizationId: params.organizationId,
              assistantId: params.assistantId,
              phoneNumber: phoneNumber.number,
              phoneProvider: 'twilio',
              vapiPhoneNumberId: phoneNumber.id
            })
            
            // Persist to database
            await this.persistPhoneNumber(params.assistantId, phoneNumber.number, 'twilio')
            
            return { 
              phoneNumber: phoneNumber.number, 
              phoneNumberId: phoneNumber.id 
            }
          } catch (twilioError: any) {
            const errorMsg = twilioError?.message || String(twilioError)
            console.error('❌ Could not import organization Twilio number:', errorMsg)
            
            if (errorMsg.includes('already exists') || errorMsg.includes('already imported')) {
              console.warn('⚠️ This number is already imported - trying next available number...')
              // Continue to next strategy
            }
          }
        } else {
          console.warn('⚠️ All organization Twilio numbers are currently assigned')
          console.warn('💡 Add more numbers to this organization or use global fallback')
        }
      }

      // STRATEGY 2: Global Twilio fallback (for backward compatibility)
      if (globalTwilioSid && globalTwilioToken && globalTwilioPhone) {
        console.log('📞 Strategy 2: Using GLOBAL Twilio fallback...')
        console.warn('⚠️ WARNING: Using shared global Twilio number - not recommended for multi-tenant')
        console.warn('💡 BEST PRACTICE: Configure organization-specific Twilio numbers')
        
        try {
          const twilioNumberConfig = {
            provider: 'twilio' as const,
            number: globalTwilioPhone,
            twilioAccountSid: globalTwilioSid,
            twilioAuthToken: globalTwilioToken,
            assistantId: params.assistantId,
            name: `Assistant ${params.assistantId.substring(0, 8)}`,
          }
          
          console.log('📞 Importing global Twilio number:', globalTwilioPhone)
          const phoneNumber = await this.vapiClient!.phoneNumbers.create(twilioNumberConfig)
          
          console.log('✅ Global Twilio number imported:', phoneNumber.number)
          console.log('⚠️ This is a SHARED number - configure per-organization numbers for production')
          
          // Track the assignment
          await this.trackPhoneNumberAssignment({
            organizationId: params.organizationId,
            assistantId: params.assistantId,
            phoneNumber: phoneNumber.number,
            phoneProvider: 'twilio',
            vapiPhoneNumberId: phoneNumber.id
          })
          
          // Persist to database
          await this.persistPhoneNumber(params.assistantId, phoneNumber.number, 'twilio')
          
          return { 
            phoneNumber: phoneNumber.number, 
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

      // STRATEGY 3: Try to create a FREE Vapi SIP number (up to 10 free per account)
      console.log('📞 Strategy 3: Attempting to create FREE Vapi SIP number...')
      try {
        // According to Vapi docs, for Vapi SIP numbers we use provider: 'vapi'
        // The response will have a 'sipUri' field, not a 'number' field
        const vapiNumberConfig = {
          provider: 'vapi' as const,
          assistantId: params.assistantId,
          name: `Assistant ${params.assistantId.substring(0, 8)}`,
        }
        
        console.log('📞 Requesting FREE Vapi SIP number from Vapi API...')
        console.log('📞 Config:', JSON.stringify(vapiNumberConfig, null, 2))
        
        const phoneNumber = await this.vapiClient!.phoneNumbers.create(vapiNumberConfig)
        
        console.log('✅ FREE Vapi SIP number created and assigned:', phoneNumber.sipUri || phoneNumber.id)
        console.log('💰 This is a free SIP number from Vapi (up to 10 free numbers per account)')
        console.log('📞 Phone number response structure:', JSON.stringify(phoneNumber, null, 2))
        
        // Extract phone number - Vapi SIP numbers use 'sipUri' field
        const sipUri: string | undefined = phoneNumber.sipUri
        const phoneNumberId: string = phoneNumber.id

        // Track full assignment details; store compact display to satisfy DB varchar(20)
        await this.trackPhoneNumberAssignment({
          organizationId: params.organizationId,
          assistantId: params.assistantId,
          phoneNumber: sipUri || 'SIP',
          phoneProvider: 'vapi',
          vapiPhoneNumberId: phoneNumberId
        })

        const displayPhoneNumber = 'SIP'
        // Persist compact value in assistants table
        await this.persistPhoneNumber(params.assistantId, displayPhoneNumber, 'vapi')
        
        return { 
          phoneNumber: displayPhoneNumber,
          phoneNumberId: phoneNumberId 
        }
      } catch (vapiError: any) {
        const errorMsg = vapiError?.message || String(vapiError)
        console.warn('⚠️ Could not create free Vapi SIP number:', errorMsg)
        
        // Try alternative Vapi SIP number creation method
        console.log('📞 Strategy 1B: Trying alternative Vapi SIP number creation...')
        try {
          // Try without specifying provider (let Vapi choose)
          const altVapiConfig = {
            assistantId: params.assistantId,
            name: `Assistant ${params.assistantId.substring(0, 8)}`,
          }
          
          console.log('📞 Trying alternative config:', JSON.stringify(altVapiConfig, null, 2))
          const phoneNumber = await this.vapiClient!.phoneNumbers.create(altVapiConfig)
          
          console.log('✅ Alternative Vapi SIP number created:', phoneNumber.sipUri || phoneNumber.id)
          console.log('📞 Alternative response structure:', JSON.stringify(phoneNumber, null, 2))
          
          const sipUri: string | undefined = phoneNumber.sipUri
          const phoneNumberId: string = phoneNumber.id

          // Track full assignment details; store compact display to satisfy DB varchar(20)
          await this.trackPhoneNumberAssignment({
            organizationId: params.organizationId,
            assistantId: params.assistantId,
            phoneNumber: sipUri || 'SIP',
            phoneProvider: 'vapi',
            vapiPhoneNumberId: phoneNumberId
          })

          const displayPhoneNumber = 'SIP'
          await this.persistPhoneNumber(params.assistantId, displayPhoneNumber, 'vapi')
            return { 
            phoneNumber: displayPhoneNumber,
              phoneNumberId: phoneNumberId 
          }
        } catch (altError: any) {
          console.warn('⚠️ Alternative Vapi SIP creation also failed:', altError.message)
        }
        
        if (errorMsg.includes('limit') || errorMsg.includes('maximum') || errorMsg.includes('quota')) {
          console.warn('⚠️ Free Vapi number limit reached (maximum 10 free SIP numbers)')
          console.warn('💡 Falling back to Twilio strategy...')
        } else {
          console.warn('💡 Trying Twilio phone number providers...')
        }
      }
      
      // STRATEGY 4: Organization's BYO SIP Trunk (MULTI-TENANT)
      if (org?.byo_sip_credential_id) {
        console.log('📞 Strategy 4: Using ORGANIZATION-SPECIFIC BYO SIP trunk...')
        try {
          const byoNumberConfig = {
            provider: 'byo-phone-number' as const,
            credentialId: org.byo_sip_credential_id,
            assistantId: params.assistantId,
            name: `${org?.organization_name || 'Org'} Assistant ${params.assistantId.substring(0, 8)}`,
          }
          
          console.log('📞 Creating BYO phone number with org credential:', org.byo_sip_credential_id)
          const phoneNumber = await this.vapiClient!.phoneNumbers.create(byoNumberConfig)
          
          console.log('✅ Organization BYO number created:', phoneNumber.number || 'Custom SIP')
          console.log('💡 Using organization\'s custom SIP trunk configuration')
          
          // Track the assignment
          await this.trackPhoneNumberAssignment({
            organizationId: params.organizationId,
            assistantId: params.assistantId,
            phoneNumber: phoneNumber.number || 'BYO-SIP',
            phoneProvider: 'byo',
            vapiPhoneNumberId: phoneNumber.id
          })
          
          // Persist to database
          await this.persistPhoneNumber(params.assistantId, phoneNumber.number || 'BYO-SIP', 'byo')
          
          return { 
            phoneNumber: phoneNumber.number || 'BYO-SIP', 
            phoneNumberId: phoneNumber.id 
          }
        } catch (byoError: any) {
          console.error('❌ Could not create organization BYO phone number:', byoError?.message)
        }
      }
      
      // STRATEGY 5: Global BYO SIP Trunk fallback
      if (globalByoCredentialId) {
        console.log('📞 Strategy 5: Using GLOBAL BYO SIP trunk fallback...')
        console.warn('⚠️ WARNING: Using shared global BYO SIP - not recommended for multi-tenant')
        try {
          const byoNumberConfig = {
            provider: 'byo-phone-number' as const,
            credentialId: globalByoCredentialId,
            assistantId: params.assistantId,
            name: `Assistant ${params.assistantId.substring(0, 8)}`,
          }
          
          console.log('📞 Creating BYO phone number with global credential')
          const phoneNumber = await this.vapiClient!.phoneNumbers.create(byoNumberConfig)
          
          console.log('✅ Global BYO number created:', phoneNumber.number || 'Custom SIP')
          console.log('⚠️ This is a SHARED SIP trunk - configure per-organization for production')
          
          // Track the assignment
          await this.trackPhoneNumberAssignment({
            organizationId: params.organizationId,
            assistantId: params.assistantId,
            phoneNumber: phoneNumber.number || 'BYO-SIP',
            phoneProvider: 'byo',
            vapiPhoneNumberId: phoneNumber.id
          })
          
          // Persist to database
          await this.persistPhoneNumber(params.assistantId, phoneNumber.number || 'BYO-SIP', 'byo')
          
          return { 
            phoneNumber: phoneNumber.number || 'BYO-SIP', 
            phoneNumberId: phoneNumber.id 
          }
        } catch (byoError: any) {
          console.error('❌ Could not create global BYO phone number:', byoError?.message)
        }
      }
      
      // No phone number provisioned - provide comprehensive guidance
      console.warn('⚠️ Could not provision phone number automatically')
      console.warn('')
      console.warn('═══════════════════════════════════════════════════════════')
      console.warn('📋 PHONE NUMBER PROVISIONING OPTIONS')
      console.warn('═══════════════════════════════════════════════════════════')
      console.warn('')
      console.warn('1️⃣  FREE VAPI SIP NUMBERS (RECOMMENDED) ✨')
      console.warn('    • Get up to 10 FREE SIP numbers from Vapi')
      console.warn('    • No configuration needed - automatically attempted')
      console.warn('    • May have reached limit (check Vapi Dashboard)')
      console.warn('    • Manually create: https://dashboard.vapi.ai/phone-numbers')
      console.warn('')
      console.warn('2️⃣  IMPORT YOUR TWILIO NUMBER')
      console.warn('    • Buy number: https://console.twilio.com/us1/develop/phone-numbers/manage/search')
      console.warn('    • Add to .env.local:')
      console.warn('      TWILIO_ACCOUNT_SID=ACxxxxxxxxx')
      console.warn('      TWILIO_AUTH_TOKEN=xxxxxxxxx')
      console.warn('      TWILIO_PHONE_NUMBER=+15551234567')
      console.warn('    • Restart server: npm run dev')
      console.warn('')
      console.warn('3️⃣  BRING YOUR OWN SIP TRUNK')
      console.warn('    • Add SIP trunk credential in Vapi Dashboard')
      console.warn('    • Add to .env.local: BYO_SIP_CREDENTIAL_ID=your-credential-id')
      console.warn('    • Restart server: npm run dev')
      console.warn('')
      console.warn('4️⃣  MANUAL ASSIGNMENT')
      console.warn('    • Create/import numbers: https://dashboard.vapi.ai/phone-numbers')
      console.warn('    • Manually assign to assistants in Vapi Dashboard')
      console.warn('')
      console.warn('═══════════════════════════════════════════════════════════')
      
      return null
    } catch (error: any) {
      console.error('❌ Error provisioning phone number:', error)
      console.error('Error details:', error?.message || 'Unknown error')
      return null
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
   */
  private createMultilingualTools(template: IndustryTemplate, organizationId: string): any[] {
    const tools: any[] = []

    // Enhanced emergency detection tool with language support
    tools.push({
      type: 'function',
      function: {
        name: 'check_emergency_multilingual',
        description: `Analyze urgency for ${template.display_name} issues in multiple languages`,
        parameters: {
          type: 'object',
          properties: {
            issue_description: { type: 'string' },
            detected_language: { type: 'string', enum: ['en', 'es'] },
            urgency_indicators: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords in detected language'
            },
            cultural_context: {
              type: 'string',
              description: 'Cultural communication style detected'
            }
          },
          required: ['issue_description', 'detected_language']
        }
      }
    })

    // Enhanced appointment booking with SMS integration
    const appointmentTypes = Object.keys(template.appointment_types)
    tools.push({
      type: 'function',
      function: {
        name: 'book_appointment_with_sms',
        description: `Schedule ${template.display_name} appointment with SMS confirmation`,
        parameters: {
          type: 'object',
          properties: {
            service_type: { type: 'string', enum: appointmentTypes },
            scheduled_start_time: { type: 'string', format: 'date-time' },
            customer_name: { type: 'string' },
            customer_phone: { type: 'string' },
            customer_email: { type: 'string' },
            address: { type: 'string' },
            preferred_language: { type: 'string', enum: ['en', 'es'] },
            sms_preference: { type: 'boolean', description: 'Customer wants SMS notifications' },
            cultural_formality: { type: 'string', enum: ['formal', 'informal'] }
          },
          required: ['service_type', 'scheduled_start_time', 'customer_name', 'customer_phone', 'preferred_language']
        }
      }
    })

    // SMS communication tool
    tools.push({
      type: 'function',
      function: {
        name: 'send_sms_notification',
        description: 'Send SMS notification to customer in their preferred language',
        parameters: {
          type: 'object',
          properties: {
            phone_number: { type: 'string' },
            message_type: { type: 'string', enum: Object.keys(template.sms_templates) },
            language: { type: 'string', enum: ['en', 'es'] },
            urgency_level: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] }
          },
          required: ['phone_number', 'message_type', 'language']
        }
      }
    })

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
          // Integrate send_sms_notification tool
          {
            type: 'function',
            function: {
              name: 'send_sms_notification',
              description: 'Send an SMS notification to the user, e.g., with a signup link.',
              parameters: {
                type: 'object',
                properties: {
                  phone_number: { type: 'string', description: 'The recipient\'s phone number.' },
                  message_content: { type: 'string', description: 'The content of the SMS message.' }
                },
                required: ['phone_number', 'message_content']
              }
            }
          }
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
    if (language === 'es') {
      return {
        provider: 'azure',
        voiceId: region === 'mx' ? 'es-MX-DaliaNeural' : 'es-ES-ElviraNeural',
        speed: 1.0
      }
    } else {
      return {
        provider: 'azure',
        voiceId: 'en-US-AriaNeural', // English
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
        purchase: async ({ phoneNumberId }) => {
          console.log('💰 Creating/buying phone number for assistant...')
          // Create a new phone number via Vapi API
          try {
            const phoneNumber = await directClient.createPhoneNumber({
              provider: 'twilio', // or 'vonage'
              name: `Assistant Phone ${Date.now()}`
            })
            return {
              id: phoneNumber.id,
              number: phoneNumber.number
            }
          } catch (error) {
            console.error('Failed to create phone number:', error)
            // Fallback: return existing phone number if available
            try {
              const phoneNumber = await directClient.getPhoneNumber(phoneNumberId)
              return {
                id: phoneNumber.id,
                number: phoneNumber.number
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
              number: phoneNumber.number
            }
          } catch (error) {
            console.error('Failed to assign phone number:', error)
            // Get the phone number info anyway
            const phoneNumber = await directClient.getPhoneNumber(phoneNumberId)
            return {
              id: phoneNumber.id,
              number: phoneNumber.number
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
      const supabase = await createServerClient()
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
