#!/usr/bin/env tsx

/**
 * Script to verify that the tools are working correctly
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const ASSISTANT_ID = 'a0ce61a7-2f98-493e-8483-d90337a84d0d'

async function verifyToolsWorking() {
  console.log('🔍 Verifying that tools are working correctly...')
  
  const VAPI_API_KEY = process.env.VAPI_API_KEY
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vapi API error: ${response.status} ${errorText}`)
    }

    const assistant = await response.json()
    console.log('✅ Assistant retrieved successfully!')
    console.log('📋 Assistant details:')
    console.log(`  ID: ${assistant.id}`)
    console.log(`  Name: ${assistant.name}`)
    console.log(`  Phone: ${assistant.phoneNumber}`)
    console.log(`  Status: ${assistant.status}`)
    
    console.log('\n🔧 Tool Configuration:')
    if (assistant.model && assistant.model.tools) {
      console.log(`  Number of tools: ${assistant.model.tools.length}`)
      assistant.model.tools.forEach((tool: any, index: number) => {
        console.log(`  Tool ${index + 1}:`)
        console.log(`    Name: ${tool.function?.name || 'Unknown'}`)
        console.log(`    Type: ${tool.type}`)
        console.log(`    Server URL: ${tool.server?.url || 'Not configured'}`)
      })
    } else {
      console.log('  No tools configured')
    }

    // Check if tools are properly configured
    const hasCheckAvailability = assistant.model?.tools?.some((tool: any) => tool.function?.name === 'check_availability')
    const hasBookAppointment = assistant.model?.tools?.some((tool: any) => tool.function?.name === 'book_appointment_with_sms')
    
    console.log('\n📊 Tool Status Analysis:')
    console.log(`  check_availability tool: ${hasCheckAvailability ? '✅ Present' : '❌ Missing'}`)
    console.log(`  book_appointment_with_sms tool: ${hasBookAppointment ? '✅ Present' : '❌ Missing'}`)
    
    if (hasCheckAvailability && hasBookAppointment) {
      console.log('\n🎉 SUCCESS: Both required tools are properly configured!')
      console.log('   The assistant should be able to:')
      console.log('   - Check availability for appointments')
      console.log('   - Book appointments with SMS confirmation')
      console.log('   - Handle the complete booking workflow')
    } else {
      console.log('\n❌ ERROR: Some required tools are missing!')
      console.log('   The assistant will not be able to handle appointments properly.')
    }

    // Check webhook configuration
    console.log('\n🌐 Webhook Configuration:')
    console.log(`  Server URL: ${assistant.serverUrl || 'Not configured'}`)
    console.log(`  Server Messages: ${assistant.serverMessages?.join(', ') || 'Not configured'}`)
    
    if (assistant.serverUrl) {
      console.log('✅ Webhook URL is configured')
    } else {
      console.log('❌ Webhook URL is missing - tools will not work!')
    }

  } catch (error) {
    console.error('❌ Error verifying assistant:', error)
    throw error
  }
}

// Run the verification
verifyToolsWorking()
  .then(() => {
    console.log('🎉 Tool verification completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error)
    process.exit(1)
  })
