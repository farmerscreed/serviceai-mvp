#!/usr/bin/env tsx

/**
 * Script to check the current tool configuration of an existing assistant
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const ASSISTANT_ID = '0822d0d9-6f91-4650-b7b9-34c04c291b9a'

async function checkAssistantTools() {
  console.log('🔍 Checking assistant tool configuration...')
  
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
        if (tool.id) {
          console.log(`    Type: Tool ID Reference`)
          console.log(`    ID: ${tool.id}`)
        } else if (tool.function) {
          console.log(`    Type: Inline Definition`)
          console.log(`    Name: ${tool.function.name}`)
        }
      })
    } else {
      console.log('  No tools configured')
    }

    // Check if tools are using ID references or inline definitions
    const hasIdReferences = assistant.model?.tools?.some((tool: any) => tool.id)
    const hasInlineDefinitions = assistant.model?.tools?.some((tool: any) => tool.function)
    
    console.log('\n📊 Tool Configuration Analysis:')
    console.log(`  Uses ID References: ${hasIdReferences ? '✅ Yes' : '❌ No'}`)
    console.log(`  Uses Inline Definitions: ${hasInlineDefinitions ? '⚠️ Yes (Old Method)' : '✅ No'}`)
    
    if (hasInlineDefinitions) {
      console.log('\n⚠️ WARNING: Assistant is using the old inline tool definitions!')
      console.log('   This is why tools are not working properly.')
      console.log('   The assistant needs to be recreated with the new tool ID references.')
    } else if (hasIdReferences) {
      console.log('\n✅ GOOD: Assistant is using the new tool ID references!')
      console.log('   Tools should be working correctly.')
    }

  } catch (error) {
    console.error('❌ Error checking assistant:', error)
    throw error
  }
}

// Run the check
checkAssistantTools()
  .then(() => {
    console.log('🎉 Assistant tool check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Check failed:', error)
    process.exit(1)
  })
