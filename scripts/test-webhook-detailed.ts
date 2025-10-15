#!/usr/bin/env tsx

/**
 * Script to test the webhook with detailed debugging
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testWebhookDetailed() {
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

  console.log('📤 Sending webhook payload...')
  console.log('📤 Payload:', JSON.stringify(mockWebhookPayload, null, 2))

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
      
      // Check if it matches the expected Vapi format
      if (responseJson.results && Array.isArray(responseJson.results)) {
        console.log('✅ Response has "results" array (correct Vapi format)')
        
        if (responseJson.results.length > 0) {
          const firstResult = responseJson.results[0]
          if ('toolCallId' in firstResult && 'result' in firstResult) {
            console.log('✅ First result has correct structure (toolCallId, result)')
            
            // Test parsing the result field
            try {
              const resultData = JSON.parse(firstResult.result)
              console.log('✅ Result field is valid JSON:', typeof resultData === 'object')
              console.log('✅ Result data:', JSON.stringify(resultData, null, 2))
            } catch (parseError) {
              console.log('❌ Result field is not valid JSON')
            }
          } else {
            console.log('❌ First result missing toolCallId or result fields')
          }
        } else {
          console.log('❌ Results array is empty')
        }
      } else {
        console.log('❌ Response does not have "results" array (incorrect format)')
      }
      
    } catch (parseError) {
      console.log('📡 Response is not valid JSON')
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error)
  }
}

// Run the test
testWebhookDetailed()
  .then(() => {
    console.log('🎉 Detailed webhook test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
