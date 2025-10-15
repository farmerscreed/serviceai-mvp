#!/usr/bin/env tsx

/**
 * Script to recreate the assistant with the new tool configuration
 * This will delete the old assistant and create a new one with tool ID references
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const ORGANIZATION_ID = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'
const OLD_ASSISTANT_ID = '0822d0d9-6f91-4650-b7b9-34c04c291b9a'

async function recreateAssistant() {
  console.log('🔄 Recreating assistant with new tool configuration...')
  
  const VAPI_API_KEY = process.env.VAPI_API_KEY
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

  // Step 1: Delete the old assistant
  console.log('🗑️ Deleting old assistant...')
  try {
    const deleteResponse = await fetch(`https://api.vapi.ai/assistant/${OLD_ASSISTANT_ID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (deleteResponse.ok) {
      console.log('✅ Old assistant deleted successfully')
    } else {
      const errorText = await deleteResponse.text()
      console.log(`⚠️ Delete response: ${deleteResponse.status} ${errorText}`)
    }
  } catch (error) {
    console.log('⚠️ Error deleting old assistant (may not exist):', error)
  }

  // Step 2: Create new assistant using our API
  console.log('🚀 Creating new assistant...')
  
  const businessData = {
    business_name: 'Test HVAC Company',
    business_phone: '+14099952315',
    business_address: '14106 DAWN WHISTLE WAY',
    business_email: 'biebele@gmail.com',
    primary_language: 'en',
    supported_languages: ['en', 'es'],
    timezone: 'America/New_York',
    emergency_contact_phone: '+14099952315',
    emergency_contact_email: 'biebele@gmail.com',
    sms_enabled: true
  }

  const requestBody = {
    organizationId: ORGANIZATION_ID,
    industryCode: 'hvac',
    businessData: businessData,
    languagePreference: 'en'
  }

  try {
    const response = await fetch('http://localhost:3000/api/assistants/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API error:', errorText)
      throw new Error(`API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ New assistant created successfully!')
    console.log('📋 Response:', JSON.stringify(result, null, 2))

    if (result.success && result.assistant) {
      console.log(`🎉 New assistant ID: ${result.assistant.id}`)
      console.log(`📞 Phone number: ${result.assistant.phoneNumber}`)
      console.log('🔧 Assistant now uses tool ID references!')
      
      // Step 3: Verify the new assistant has correct tool configuration
      console.log('\n🔍 Verifying new assistant tool configuration...')
      await verifyAssistantTools(result.assistant.id)
    }

  } catch (error) {
    console.error('❌ Error creating new assistant:', error)
    throw error
  }
}

async function verifyAssistantTools(assistantId: string) {
  const VAPI_API_KEY = process.env.VAPI_API_KEY
  
  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to verify assistant: ${response.status}`)
    }

    const assistant = await response.json()
    
    console.log('\n🔧 New Assistant Tool Configuration:')
    if (assistant.model && assistant.model.tools) {
      console.log(`  Number of tools: ${assistant.model.tools.length}`)
      assistant.model.tools.forEach((tool: any, index: number) => {
        console.log(`  Tool ${index + 1}:`)
        if (tool.id) {
          console.log(`    Type: Tool ID Reference ✅`)
          console.log(`    ID: ${tool.id}`)
        } else if (tool.function) {
          console.log(`    Type: Inline Definition ❌`)
          console.log(`    Name: ${tool.function.name}`)
        }
      })
    }

    // Check if tools are using ID references
    const hasIdReferences = assistant.model?.tools?.some((tool: any) => tool.id)
    
    if (hasIdReferences) {
      console.log('\n✅ SUCCESS: New assistant is using tool ID references!')
      console.log('🎉 Tools should now work correctly!')
    } else {
      console.log('\n❌ ERROR: New assistant is still using inline definitions!')
      console.log('   Something went wrong with the assistant creation.')
    }

  } catch (error) {
    console.error('❌ Error verifying assistant:', error)
  }
}

// Run the recreation
recreateAssistant()
  .then(() => {
    console.log('🎉 Assistant recreation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Recreation failed:', error)
    process.exit(1)
  })
