#!/usr/bin/env tsx

/**
 * Script to test the exact response format that Vapi expects
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testResponseFormat() {
  console.log('🧪 Testing response format for Vapi...')
  
  // Test the expected response format
  const expectedResponse = [
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
  
  console.log('📋 Expected response format:')
  console.log(JSON.stringify(expectedResponse, null, 2))
  
  // Test if this is valid JSON
  try {
    const jsonString = JSON.stringify(expectedResponse)
    const parsed = JSON.parse(jsonString)
    console.log('✅ Response format is valid JSON')
    console.log('✅ Response is an array:', Array.isArray(parsed))
    console.log('✅ First result has toolCallId:', 'toolCallId' in parsed[0])
    console.log('✅ First result has result field:', 'result' in parsed[0])
    
    // Test parsing the result field
    const resultData = JSON.parse(parsed[0].result)
    console.log('✅ Result field is valid JSON:', typeof resultData === 'object')
    console.log('✅ Result has available_slots:', 'available_slots' in resultData)
    
  } catch (error) {
    console.error('❌ Response format is invalid:', error)
  }
}

// Run the test
testResponseFormat()
  .then(() => {
    console.log('🎉 Response format test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })
