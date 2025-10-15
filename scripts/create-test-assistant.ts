#!/usr/bin/env tsx

/**
 * Script to create a new test assistant with updated tool configuration
 * This will test if the tool ID references are working correctly
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const ORGANIZATION_ID = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'

async function createTestAssistant() {
  console.log('🚀 Creating test assistant with updated tool configuration...')
  
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

  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))

  try {
    const response = await fetch('http://localhost:3000/api/assistants/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need proper authentication
        // For testing, we'll use the service role
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
    console.log('✅ Assistant created successfully!')
    console.log('📋 Response:', JSON.stringify(result, null, 2))

    if (result.success && result.assistant) {
      console.log(`🎉 New assistant ID: ${result.assistant.id}`)
      console.log(`📞 Phone number: ${result.assistant.phoneNumber}`)
      console.log('🔧 Tools should now be properly configured!')
    }

  } catch (error) {
    console.error('❌ Error creating assistant:', error)
    throw error
  }
}

// Run the creation
createTestAssistant()
  .then(() => {
    console.log('🎉 Test assistant creation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Creation failed:', error)
    process.exit(1)
  })
