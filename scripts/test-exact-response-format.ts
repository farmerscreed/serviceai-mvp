#!/usr/bin/env tsx

/**
 * Script to test the exact response format that Vapi expects
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testExactResponseFormat() {
  console.log('🧪 Testing exact response format for Vapi...')
  
  // Test different response formats that Vapi might expect
  const formats = [
    {
      name: 'Current Format (Array of objects)',
      response: [
        {
          toolCallId: 'tool-call-123',
          result: JSON.stringify({
            requested_date: '2025-10-14',
            service_type: 'installation',
            available_slots: ['09:00:00', '14:00:00', '16:00:00'],
            total_slots: 3,
            message: 'I have 3 available time slots',
            business_hours: {
              start: '09:00:00',
              end: '17:00:00',
              slotDuration: 120
            }
          })
        }
      ]
    },
    {
      name: 'Alternative Format (Direct result)',
      response: {
        toolCallId: 'tool-call-123',
        result: JSON.stringify({
          requested_date: '2025-10-14',
          service_type: 'installation',
          available_slots: ['09:00:00', '14:00:00', '16:00:00'],
          total_slots: 3,
          message: 'I have 3 available time slots',
          business_hours: {
            start: '09:00:00',
            end: '17:00:00',
            slotDuration: 120
          }
        })
      }
    },
    {
      name: 'Simple Format (Just the data)',
      response: {
        requested_date: '2025-10-14',
        service_type: 'installation',
        available_slots: ['09:00:00', '14:00:00', '16:00:00'],
        total_slots: 3,
        message: 'I have 3 available time slots',
        business_hours: {
          start: '09:00:00',
          end: '17:00:00',
          slotDuration: 120
        }
      }
    }
  ]
  
  formats.forEach((format, index) => {
    console.log(`\n📋 Format ${index + 1}: ${format.name}`)
    console.log(JSON.stringify(format.response, null, 2))
    
    try {
      const jsonString = JSON.stringify(format.response)
      const parsed = JSON.parse(jsonString)
      console.log('✅ Valid JSON format')
      
      if (Array.isArray(parsed)) {
        console.log('✅ Is an array')
        if (parsed.length > 0 && 'toolCallId' in parsed[0] && 'result' in parsed[0]) {
          console.log('✅ Has correct structure (toolCallId, result)')
        } else {
          console.log('❌ Missing toolCallId or result fields')
        }
      } else if ('toolCallId' in parsed && 'result' in parsed) {
        console.log('✅ Single object with correct structure')
      } else {
        console.log('✅ Simple data format')
      }
      
    } catch (error) {
      console.log('❌ Invalid JSON format')
    }
  })
  
  // Based on Vapi documentation, the expected format should be:
  console.log('\n🎯 Expected Vapi Format (from documentation):')
  console.log('Array of objects with toolCallId and result fields')
  console.log('The result field should be a stringified JSON object')
}

// Run the test
testExactResponseFormat()
  .then(() => {
    console.log('🎉 Response format test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
