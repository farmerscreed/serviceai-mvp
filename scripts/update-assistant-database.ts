#!/usr/bin/env tsx

/**
 * Script to update the assistant record in the database
 */

import { config } from 'dotenv'
import { createServiceRoleClient } from '../lib/supabase/server.js'

// Load environment variables
config({ path: '.env.local' })

const ORGANIZATION_ID = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'
const NEW_ASSISTANT_ID = 'a0ce61a7-2f98-493e-8483-d90337a84d0d'

async function updateAssistantDatabase() {
  console.log('🔄 Updating assistant record in database...')
  
  try {
    const supabase = createServiceRoleClient()
    
    // First, check what's currently in the database
    console.log('🔍 Checking current assistant records...')
    const { data: currentAssistants, error: selectError } = await supabase
      .from('vapi_assistants')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
    
    if (selectError) {
      console.error('❌ Error selecting assistants:', selectError)
      return
    }
    
    console.log('📋 Current assistants:', JSON.stringify(currentAssistants, null, 2))
    
    // Update the assistant record with the new ID
    console.log('🔄 Updating assistant record...')
    const { data: updatedAssistant, error: updateError } = await supabase
      .from('vapi_assistants')
      .update({ 
        vapi_assistant_id: NEW_ASSISTANT_ID,
        updated_at: new Date().toISOString(),
        business_data: {
          tools_updated: true,
          tools_count: 2,
          updated_at: new Date().toISOString()
        }
      })
      .eq('organization_id', ORGANIZATION_ID)
      .eq('industry_code', 'hvac')
      .eq('language_code', 'en')
      .select()
    
    if (updateError) {
      console.error('❌ Error updating assistant:', updateError)
      return
    }
    
    console.log('✅ Assistant record updated successfully!')
    console.log('📋 Updated assistant:', JSON.stringify(updatedAssistant, null, 2))
    
    // Verify the update
    console.log('🔍 Verifying update...')
    const { data: verifiedAssistant, error: verifyError } = await supabase
      .from('vapi_assistants')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('vapi_assistant_id', NEW_ASSISTANT_ID)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying assistant:', verifyError)
      return
    }
    
    console.log('✅ Verification successful!')
    console.log('📋 Verified assistant:', JSON.stringify(verifiedAssistant, null, 2))
    
  } catch (error) {
    console.error('❌ Error updating assistant database:', error)
    throw error
  }
}

// Run the update
updateAssistantDatabase()
  .then(() => {
    console.log('🎉 Assistant database update completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Update failed:', error)
    process.exit(1)
  })
