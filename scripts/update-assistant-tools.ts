#!/usr/bin/env tsx

/**
 * Script to update existing Vapi assistant with new tool configuration
 * This fixes the issue where assistants were using inline tool definitions
 * instead of tool ID references
 */

import { config } from 'dotenv'
import { createServiceRoleClient } from '../lib/supabase/server.js'

// Load environment variables
config({ path: '.env.local' })

const ASSISTANT_ID = '0822d0d9-6f91-4650-b7b9-34c04c291b9a'
const ORGANIZATION_ID = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'

async function updateAssistantTools() {
  console.log('🔧 Updating Vapi assistant with new tool configuration...')
  
  // Get tool IDs from environment
  const CHECK_AVAILABILITY_TOOL_ID = process.env.VAPI_CHECK_AVAILABILITY_TOOL_ID
  const BOOK_APPOINTMENT_TOOL_ID = process.env.VAPI_BOOK_APPOINTMENT_TOOL_ID
  const EMERGENCY_CHECK_TOOL_ID = process.env.VAPI_EMERGENCY_CHECK_TOOL_ID
  const SMS_NOTIFICATION_TOOL_ID = process.env.VAPI_SMS_NOTIFICATION_TOOL_ID

  console.log('📋 Tool IDs:')
  console.log(`  CHECK_AVAILABILITY: ${CHECK_AVAILABILITY_TOOL_ID}`)
  console.log(`  BOOK_APPOINTMENT: ${BOOK_APPOINTMENT_TOOL_ID}`)
  console.log(`  EMERGENCY_CHECK: ${EMERGENCY_CHECK_TOOL_ID}`)
  console.log(`  SMS_NOTIFICATION: ${SMS_NOTIFICATION_TOOL_ID}`)

  // Build tools array using tool ID references
  const tools: any[] = []

  if (EMERGENCY_CHECK_TOOL_ID) {
    tools.push({
      type: 'function',
      id: EMERGENCY_CHECK_TOOL_ID
    })
  }

  if (CHECK_AVAILABILITY_TOOL_ID) {
    tools.push({
      type: 'function',
      id: CHECK_AVAILABILITY_TOOL_ID
    })
  }

  if (BOOK_APPOINTMENT_TOOL_ID) {
    tools.push({
      type: 'function',
      id: BOOK_APPOINTMENT_TOOL_ID
    })
  }

  if (SMS_NOTIFICATION_TOOL_ID) {
    tools.push({
      type: 'function',
      id: SMS_NOTIFICATION_TOOL_ID
    })
  }

  console.log(`🔧 Configured ${tools.length} tools for assistant`)

  // Update assistant via Vapi API
  const VAPI_API_KEY = process.env.VAPI_API_KEY
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

  const updatePayload = {
    tools: tools
  }

  console.log('📤 Updating assistant via Vapi API...')
  console.log('📤 Payload:', JSON.stringify(updatePayload, null, 2))

  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vapi API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Assistant updated successfully!')
    console.log('📋 Response:', JSON.stringify(result, null, 2))

    // Update database record
    const supabase = createServiceRoleClient()
    const { error: dbError } = await supabase
      .from('vapi_assistants')
      .update({ 
        updated_at: new Date().toISOString(),
        // Store tool configuration in metadata for reference
        business_data: {
          ...result.business_data,
          tools_updated: true,
          tools_count: tools.length,
          updated_at: new Date().toISOString()
        }
      })
      .eq('vapi_assistant_id', ASSISTANT_ID)

    if (dbError) {
      console.error('⚠️ Database update error:', dbError)
    } else {
      console.log('✅ Database record updated')
    }

  } catch (error) {
    console.error('❌ Error updating assistant:', error)
    throw error
  }
}

// Run the update
updateAssistantTools()
  .then(() => {
    console.log('🎉 Assistant tools update completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Update failed:', error)
    process.exit(1)
  })
