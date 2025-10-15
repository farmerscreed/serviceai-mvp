#!/usr/bin/env tsx

/**
 * Script to test the webhook response format
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testWebhookResponse() {
  console.log('🧪 Testing webhook response format...')
  
  // Simulate a tool call webhook payload
  const mockWebhookPayload = {
    type: 'tool-calls',
    call: {
      id: 'test-call-123',
      assistantId: 'a0ce61a7-2f98-493e-8483-d90337a84d0d'
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
    } catch (parseError) {
      console.log('📡 Response is not valid JSON')
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error)
  }
}

// Run the test
testWebhookResponse()
  .then(() => {
    console.log('🎉 Webhook response test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
