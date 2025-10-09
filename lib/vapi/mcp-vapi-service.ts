/**
 * Vapi MCP Client Service
 * Production-ready integration using official Vapi MCP Server
 * 
 * Based on: https://docs.vapi.ai/sdk/mcp-server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export interface VapiAssistant {
  id: string
  name: string
  status: string
  createdAt: string
  phoneNumber?: string
}

export interface VapiPhoneNumber {
  id: string
  phoneNumber: string
  country: string
  areaCode?: string
}

export interface VapiCall {
  id: string
  status: string
  customer: {
    number: string
  }
  assistantId: string
  phoneNumberId: string
  createdAt: string
}

export interface CreateAssistantRequest {
  name: string
  model: {
    provider: string
    model: string
    messages: Array<{
      role: string
      content: string
    }>
  }
  voice: {
    provider: string
    voiceId: string
  }
  firstMessage: string
  serverUrl?: string
  transcriber?: {
    provider: string
    language: string
  }
}

export interface CreateCallRequest {
  assistantId: string
  phoneNumberId: string
  customer: {
    number: string
  }
  scheduledAt?: string
}

export class VapiMCPService {
  private client: Client
  private transport: StreamableHTTPClientTransport
  private connected: boolean = false

  constructor() {
    this.client = new Client({
      name: 'serviceai-vapi-client',
      version: '1.0.0'
    })

    const serverUrl = 'https://mcp.vapi.ai/mcp'
    const apiKey = process.env.VAPI_API_KEY

    if (!apiKey) {
      throw new Error('VAPI_API_KEY environment variable is required')
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`
    }

    const options = {
      requestInit: { headers }
    }

    this.transport = new StreamableHTTPClientTransport(
      new URL(serverUrl),
      options
    )
  }

  /**
   * Connect to Vapi MCP Server
   */
  async connect(): Promise<void> {
    if (this.connected) return

    try {
      console.log('🔗 Connecting to Vapi MCP server...')
      await this.client.connect(this.transport)
      this.connected = true
      console.log('✅ Connected to Vapi MCP server successfully')
    } catch (error) {
      console.error('❌ Failed to connect to Vapi MCP server:', error)
      throw new Error(`MCP connection failed: ${error}`)
    }
  }

  /**
   * Disconnect from Vapi MCP Server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return

    try {
      await this.client.close()
      this.connected = false
      console.log('🔌 Disconnected from Vapi MCP server')
    } catch (error) {
      console.error('❌ Error disconnecting from MCP server:', error)
    }
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect()
    }
  }

  /**
   * Parse tool response from MCP
   */
  private parseToolResponse(response: any): any {
    if (!response?.content) return response
    
    const textItem = response.content.find((item: any) => item.type === 'text')
    if (textItem?.text) {
      try {
        return JSON.parse(textItem.text)
      } catch {
        return textItem.text
      }
    }
    return response
  }

  /**
   * List all assistants
   */
  async listAssistants(): Promise<VapiAssistant[]> {
    await this.ensureConnected()
    
    try {
      console.log('📋 Listing assistants...')
      const response = await this.client.callTool({
        name: 'list_assistants',
        arguments: {}
      })
      
      const assistants = this.parseToolResponse(response)
      console.log(`✅ Found ${assistants?.length || 0} assistants`)
      return assistants || []
    } catch (error) {
      console.error('❌ Error listing assistants:', error)
      throw new Error(`Failed to list assistants: ${error}`)
    }
  }

  /**
   * Create a new assistant
   */
  async createAssistant(config: CreateAssistantRequest): Promise<VapiAssistant> {
    await this.ensureConnected()
    
    try {
      console.log('🤖 Creating assistant:', config.name)
      const response = await this.client.callTool({
        name: 'create_assistant',
        arguments: config as unknown as { [x: string]: unknown }
      })
      
      const assistant = this.parseToolResponse(response)
      console.log('✅ Assistant created:', assistant.id)
      return assistant
    } catch (error) {
      console.error('❌ Error creating assistant:', error)
      throw new Error(`Failed to create assistant: ${error}`)
    }
  }

  /**
   * Get assistant by ID
   */
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    await this.ensureConnected()
    
    try {
      console.log('🔍 Getting assistant:', assistantId)
      const response = await this.client.callTool({
        name: 'get_assistant',
        arguments: { assistantId }
      })
      
      const assistant = this.parseToolResponse(response)
      console.log('✅ Assistant retrieved:', assistant.id)
      return assistant
    } catch (error) {
      console.error('❌ Error getting assistant:', error)
      throw new Error(`Failed to get assistant: ${error}`)
    }
  }

  /**
   * List all phone numbers
   */
  async listPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    await this.ensureConnected()
    
    try {
      console.log('📞 Listing phone numbers...')
      const response = await this.client.callTool({
        name: 'list_phone_numbers',
        arguments: {}
      })
      
      const phoneNumbers = this.parseToolResponse(response)
      console.log(`✅ Found ${phoneNumbers?.length || 0} phone numbers`)
      return phoneNumbers || []
    } catch (error) {
      console.error('❌ Error listing phone numbers:', error)
      throw new Error(`Failed to list phone numbers: ${error}`)
    }
  }

  /**
   * Get phone number by ID
   */
  async getPhoneNumber(phoneNumberId: string): Promise<VapiPhoneNumber> {
    await this.ensureConnected()
    
    try {
      console.log('🔍 Getting phone number:', phoneNumberId)
      const response = await this.client.callTool({
        name: 'get_phone_number',
        arguments: { phoneNumberId }
      })
      
      const phoneNumber = this.parseToolResponse(response)
      console.log('✅ Phone number retrieved:', phoneNumber.id)
      return phoneNumber
    } catch (error) {
      console.error('❌ Error getting phone number:', error)
      throw new Error(`Failed to get phone number: ${error}`)
    }
  }

  /**
   * Create an outbound call
   */
  async createCall(config: CreateCallRequest): Promise<VapiCall> {
    await this.ensureConnected()
    
    try {
      console.log('📞 Creating call to:', config.customer.number)
      const response = await this.client.callTool({
        name: 'create_call',
        arguments: config as unknown as { [x: string]: unknown }
      })
      
      const call = this.parseToolResponse(response)
      console.log('✅ Call created:', call.id)
      return call
    } catch (error) {
      console.error('❌ Error creating call:', error)
      throw new Error(`Failed to create call: ${error}`)
    }
  }

  /**
   * List all calls
   */
  async listCalls(): Promise<VapiCall[]> {
    await this.ensureConnected()
    
    try {
      console.log('📋 Listing calls...')
      const response = await this.client.callTool({
        name: 'list_calls',
        arguments: {}
      })
      
      const calls = this.parseToolResponse(response)
      console.log(`✅ Found ${calls?.length || 0} calls`)
      return calls || []
    } catch (error) {
      console.error('❌ Error listing calls:', error)
      throw new Error(`Failed to list calls: ${error}`)
    }
  }

  /**
   * Get call by ID
   */
  async getCall(callId: string): Promise<VapiCall> {
    await this.ensureConnected()
    
    try {
      console.log('🔍 Getting call:', callId)
      const response = await this.client.callTool({
        name: 'get_call',
        arguments: { callId }
      })
      
      const call = this.parseToolResponse(response)
      console.log('✅ Call retrieved:', call.id)
      return call
    } catch (error) {
      console.error('❌ Error getting call:', error)
      throw new Error(`Failed to get call: ${error}`)
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any[]> {
    await this.ensureConnected()
    
    try {
      console.log('🔧 Listing available tools...')
      const response = await this.client.listTools()
      console.log(`✅ Found ${response.tools?.length || 0} tools`)
      return response.tools || []
    } catch (error) {
      console.error('❌ Error listing tools:', error)
      throw new Error(`Failed to list tools: ${error}`)
    }
  }
}

/**
 * Create a singleton instance of the Vapi MCP Service
 */
let mcpServiceInstance: VapiMCPService | null = null

export function createVapiMCPService(): VapiMCPService {
  if (!mcpServiceInstance) {
    mcpServiceInstance = new VapiMCPService()
  }
  return mcpServiceInstance
}

/**
 * Get the singleton instance
 */
export function getVapiMCPService(): VapiMCPService | null {
  return mcpServiceInstance
}

/**
 * Cleanup function to disconnect when needed
 */
export async function cleanupVapiMCP(): Promise<void> {
  if (mcpServiceInstance) {
    await mcpServiceInstance.disconnect()
    mcpServiceInstance = null
  }
}
