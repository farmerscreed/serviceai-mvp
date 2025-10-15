#!/usr/bin/env tsx

/**
 * Script to test the webhook with detailed debugging
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testWebhookWithDebug() {
  console.log('🧪 Testing webhook with detailed debugging...')
  
  const ASSISTANT_ID = 'a0ce61a7-2f98-493e-8483-d90337a84d0d'
  
  // Simulate a tool call webhook payload
  const mockWebhookPayload = {
    type: 'tool-calls',
    call: {
      id: 'test-call-123',
      assistantId: ASSISTANT_ID
    },
    toolCallList: [
      {
        id: 'tool-call-123',
        function: {
          name: 'check_availability',
          arguments: {
            service_type: 'installation',
            requested_date: '2025-10-14'
          }
        }
      }
    ]
  }

  console.log('📤 Sending webhook payload:')
  console.log(JSON.stringify(mockWebhookPayload, null, 2))

  try {
    const response = await fetch('http://localhost:3000/api/webhooks/vapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vapi-signature': 'test-signature'
      },
      body: JSON.stringify(mockWebhookPayload)
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📡 Response body:', responseText)

    try {
      const responseJson = JSON.parse(responseText)
      console.log('📡 Parsed response:', JSON.stringify(responseJson, null, 2))
      
      // Check if it's the expected format for Vapi
      if (Array.isArray(responseJson)) {
        console.log('✅ Response is an array (correct format for Vapi tool calls)')
        responseJson.forEach((result, index) => {
          console.log(`  Result ${index + 1}:`, JSON.stringify(result, null, 2))
        })
      } else {
        console.log('❌ Response is not an array (incorrect format for Vapi tool calls)')
      }
      
    } catch (parseError) {
      console.log('📡 Response is not valid JSON')
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error)
  }
}

// Run the test
testWebhookWithDebug()
  .then(() => {
    console.log('🎉 Webhook test with debug completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
