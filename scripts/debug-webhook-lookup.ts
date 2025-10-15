#!/usr/bin/env tsx

/**
 * Script to debug the webhook organization lookup
 */

import { config } from 'dotenv'
import { createServiceRoleClient } from '../lib/supabase/server.js'

// Load environment variables
config({ path: '.env.local' })

const ASSISTANT_ID = 'a0ce61a7-2f98-493e-8483-d90337a84d0d'

async function debugWebhookLookup() {
  console.log('🔍 Debugging webhook organization lookup...')
  
  try {
    const supabase = createServiceRoleClient()
    
    console.log(`🔍 Looking up organization by assistant ID: ${ASSISTANT_ID}`)
    
    // Test the exact query from the webhook
    const { data, error } = await supabase
      .from('vapi_assistants')
      .select('organization_id, vapi_assistant_id, vapi_phone_number, is_active')
      .eq('vapi_assistant_id', ASSISTANT_ID)
      .eq('is_active', true)
      .single()
    
    console.log('📋 Query result:')
    console.log('  Data:', JSON.stringify(data, null, 2))
    console.log('  Error:', JSON.stringify(error, null, 2))
    
    if (error) {
      console.error(`❌ Database error:`, error)
    }
    
    if (!error && data) {
      console.log(`✅ Found organization: ${data.organization_id}`)
    } else {
      console.log(`❌ No organization found for assistant ID: ${ASSISTANT_ID}`)
    }
    
    // Also test without the is_active filter
    console.log('\n🔍 Testing without is_active filter...')
    const { data: data2, error: error2 } = await supabase
      .from('vapi_assistants')
      .select('organization_id, vapi_assistant_id, vapi_phone_number, is_active')
      .eq('vapi_assistant_id', ASSISTANT_ID)
      .single()
    
    console.log('📋 Query result (no is_active filter):')
    console.log('  Data:', JSON.stringify(data2, null, 2))
    console.log('  Error:', JSON.stringify(error2, null, 2))
    
    // List all assistants for this organization
    console.log('\n🔍 Listing all assistants for organization...')
    const { data: allAssistants, error: allError } = await supabase
      .from('vapi_assistants')
      .select('*')
      .eq('organization_id', 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2')
    
    console.log('📋 All assistants for organization:')
    console.log('  Data:', JSON.stringify(allAssistants, null, 2))
    console.log('  Error:', JSON.stringify(allError, null, 2))
    
  } catch (error) {
    console.error('❌ Error debugging webhook lookup:', error)
    throw error
  }
}

// Run the debug
debugWebhookLookup()
  .then(() => {
    console.log('🎉 Webhook lookup debug completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error)
    process.exit(1)
  })
