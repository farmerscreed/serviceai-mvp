/**
 * Direct Vapi API Client
 * Production-ready integration using Vapi REST API
 * 
 * Based on: https://docs.vapi.ai/api-reference/assistants/create
 */

export interface VapiAssistant {
  id: string
  name: string
  model?: any
  voice?: any
  transcriber?: any
  firstMessage?: string
  serverUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateAssistantConfig {
  name: string
  model: {
    provider: string
    model: string
    messages: Array<{
      role: string
      content: string
    }>
    tools?: any[]
    temperature?: number
  }
  voice: {
    provider: string
    voiceId: string
  }
  transcriber?: {
    provider: string
    model?: string
    language?: string
  }
  firstMessage: string
  serverUrl?: string
}

export class DirectVapiClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      throw new Error('VAPI_API_KEY environment variable is required')
    }
    
    this.apiKey = apiKey
    this.baseUrl = process.env.NEXT_PUBLIC_VAPI_BASE_URL || 'https://api.vapi.ai'
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }
  }

  /**
   * Create a new assistant
   */
  async createAssistant(config: CreateAssistantConfig): Promise<VapiAssistant> {
    try {
      console.log('🚀 Creating Vapi assistant:', config.name)
      console.log('📡 Calling:', `${this.baseUrl}/assistant`)
      
      const response = await fetch(`${this.baseUrl}/assistant`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      })

      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        throw new Error(`Vapi API error (${response.status}): ${JSON.stringify(errorData)}`)
      }

      const assistant = await response.json()
      console.log('✅ Assistant created:', assistant.id)
      
      return assistant
    } catch (error) {
      console.error('❌ Error creating assistant:', error)
      throw error
    }
  }

  /**
   * List all assistants
   */
  async listAssistants(): Promise<VapiAssistant[]> {
    try {
      console.log('📋 Listing assistants...')
      
      const response = await fetch(`${this.baseUrl}/assistant`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const assistants = await response.json()
      console.log(`✅ Found ${assistants?.length || 0} assistants`)
      
      return assistants || []
    } catch (error) {
      console.error('❌ Error listing assistants:', error)
      throw error
    }
  }

  /**
   * Get assistant by ID
   */
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    try {
      console.log('🔍 Getting assistant:', assistantId)
      
      const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const assistant = await response.json()
      console.log('✅ Assistant retrieved:', assistant.id)
      
      return assistant
    } catch (error) {
      console.error('❌ Error getting assistant:', error)
      throw error
    }
  }

  /**
   * List phone numbers
   */
  async listPhoneNumbers(): Promise<any[]> {
    try {
      console.log('📞 Listing phone numbers...')
      
      const response = await fetch(`${this.baseUrl}/phone-number`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const phoneNumbers = await response.json()
      console.log(`✅ Found ${phoneNumbers?.length || 0} phone numbers`)
      
      return phoneNumbers || []
    } catch (error) {
      console.error('❌ Error listing phone numbers:', error)
      throw error
    }
  }

  /**
   * Get phone number by ID
   */
  async getPhoneNumber(phoneNumberId: string): Promise<any> {
    try {
      console.log('🔍 Getting phone number:', phoneNumberId)
      
      const response = await fetch(`${this.baseUrl}/phone-number/${phoneNumberId}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const phoneNumber = await response.json()
      console.log('✅ Phone number retrieved:', phoneNumber.id)
      
      return phoneNumber
    } catch (error) {
      console.error('❌ Error getting phone number:', error)
      throw error
    }
  }

  /**
   * Create/Buy a new phone number
   * Based on: https://docs.vapi.ai/api-reference/phone-numbers/create
   */
  async createPhoneNumber(config: {
    provider?: 'vapi' | 'twilio' | 'vonage' | 'telnyx'
    fallbackDestination?: {
      type: 'number'
      number: string
      message?: string
    }
    name?: string
    assistantId?: string
    squadId?: string
    serverUrl?: string
    serverUrlSecret?: string
  }): Promise<any> {
    try {
      console.log('📞 Creating/buying phone number...')
      
      const response = await fetch(`${this.baseUrl}/phone-number`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        console.error('❌ Response status:', response.status)
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()))
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const phoneNumber = await response.json()
      console.log('✅ Phone number created:', phoneNumber.sipUri || phoneNumber.number || phoneNumber.id)
      console.log('📞 Full phone number response:', JSON.stringify(phoneNumber, null, 2))
      
      // Validate that we have a phone number (Vapi SIP numbers use sipUri, others use number)
      if (!phoneNumber.sipUri && !phoneNumber.number && !phoneNumber.phone && !phoneNumber.id) {
        console.error('❌ No phone number found in response:', phoneNumber)
        throw new Error('Phone number not found in Vapi response')
      }
      
      return phoneNumber
    } catch (error) {
      console.error('❌ Error creating phone number:', error)
      throw error
    }
  }

  /**
   * Update phone number
   * Based on: https://docs.vapi.ai/api-reference/phone-numbers/update
   */
  async updatePhoneNumber(phoneNumberId: string, config: {
    fallbackDestination?: {
      type: 'number'
      number: string
      message?: string
    }
    name?: string
    assistantId?: string
    squadId?: string
    serverUrl?: string
    serverUrlSecret?: string
  }): Promise<any> {
    try {
      console.log('🔄 Updating phone number:', phoneNumberId)
      
      const response = await fetch(`${this.baseUrl}/phone-number/${phoneNumberId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const phoneNumber = await response.json()
      console.log('✅ Phone number updated:', phoneNumber.id)
      
      return phoneNumber
    } catch (error) {
      console.error('❌ Error updating phone number:', error)
      throw error
    }
  }

  /**
   * Delete phone number
   */
  async deletePhoneNumber(phoneNumberId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting phone number:', phoneNumberId)
      
      const response = await fetch(`${this.baseUrl}/phone-number/${phoneNumberId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      console.log('✅ Phone number deleted')
    } catch (error) {
      console.error('❌ Error deleting phone number:', error)
      throw error
    }
  }

  /**
   * Import Twilio phone number
   * For importing existing Twilio numbers
   */
  async importTwilioPhoneNumber(config: {
    twilioPhoneNumber: string
    twilioAccountSid: string
    twilioAuthToken: string
    name?: string
    assistantId?: string
  }): Promise<any> {
    try {
      console.log('📥 Importing Twilio phone number:', config.twilioPhoneNumber)
      
      const response = await fetch(`${this.baseUrl}/phone-number/import/twilio`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const phoneNumber = await response.json()
      console.log('✅ Twilio phone number imported:', phoneNumber.number)
      
      return phoneNumber
    } catch (error) {
      console.error('❌ Error importing Twilio phone number:', error)
      throw error
    }
  }

  /**
   * Create an outbound call
   * Based on: https://docs.vapi.ai/api-reference/outbound-call/create
   */
  async createOutboundCall(config: {
    assistantId: string
    phoneNumberId?: string
    customer: {
      number: string
      name?: string
    }
    metadata?: { [key: string]: any }
    // Add other relevant outbound call parameters as needed
  }): Promise<any> {
    try {
      console.log('📞 Initiating outbound call...')
      
      const response = await fetch(`${this.baseUrl}/outbound-call`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...config,
          voicemailDetection: {
            provider: 'google', // Use Google's voicemail detection
            maxAwaitSeconds: 30, // Wait up to 30 seconds for a beep
          },
          artifactPlan: {
            recordingEnabled: true, // Enable call recording
            recordingFormat: 'mp3', // Store recordings as MP3
            transcriptPlan: {
              enabled: true, // Enable transcript generation
            },
          },
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Vapi API error:', errorText)
        throw new Error(`Vapi API error (${response.status}): ${errorText}`)
      }

      const outboundCall = await response.json()
      console.log('✅ Outbound call created:', outboundCall.id)
      
      return outboundCall
    } catch (error) {
      console.error('❌ Error creating outbound call:', error)
      throw error
    }
  }
}

/**
 * Create a singleton instance
 */
let clientInstance: DirectVapiClient | null = null

export function createDirectVapiClient(): DirectVapiClient {
  if (!clientInstance) {
    clientInstance = new DirectVapiClient()
  }
  return clientInstance
}
