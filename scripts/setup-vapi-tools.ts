/**
 * VAPI Tools Setup Script
 *
 * Purpose: Create reusable tools in VAPI that will be referenced by all assistants
 * Usage: npm run setup-vapi-tools
 *
 * This script should be run ONCE during initial setup or when adding new tools.
 * The tool IDs generated should be added to .env.local
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const VAPI_API_KEY = process.env.VAPI_API_KEY
const BASE_WEBHOOK_URL = process.env.VAPI_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL

if (!VAPI_API_KEY) {
  console.error('❌ VAPI_API_KEY not found in environment variables')
  console.error('   Please add VAPI_API_KEY to your .env.local file')
  process.exit(1)
}

if (!BASE_WEBHOOK_URL) {
  console.error('❌ No webhook URL configured')
  console.error('   Please add NEXT_PUBLIC_APP_URL or VAPI_WEBHOOK_URL to .env.local')
  process.exit(1)
}

interface ToolDefinition {
  name: string
  envVarName: string
  config: any
}

const tools: ToolDefinition[] = [
  {
    name: 'check_availability',
    envVarName: 'VAPI_CHECK_AVAILABILITY_TOOL_ID',
    config: {
      type: 'function',
      async: false,
      function: {
        name: 'check_availability',
        description: 'Check available appointment slots for a specific date and service type. ALWAYS call this BEFORE booking any appointment to ensure the time slot is available.',
        parameters: {
          type: 'object',
          properties: {
            requested_date: {
              type: 'string',
              description: 'Date to check availability in YYYY-MM-DD format (e.g., 2025-10-15)'
            },
            service_type: {
              type: 'string',
              enum: ['emergency', 'repair', 'maintenance', 'installation'],
              description: 'Type of service to check availability for'
            }
          },
          required: ['requested_date', 'service_type']
        }
      },
      server: {
        url: `${BASE_WEBHOOK_URL}/api/webhooks/vapi`,
        timeoutSeconds: 20
      },
      messages: [
        {
          type: 'request-start',
          content: 'Let me check what time slots are available...'
        },
        {
          type: 'request-complete',
          content: 'I found some available times for you.'
        },
        {
          type: 'request-failed',
          content: 'I had trouble checking availability. Let me try that again.'
        },
        {
          type: 'request-response-delayed',
          content: 'This is taking a bit longer than expected. One moment please...'
        }
      ]
    }
  },
  {
    name: 'book_appointment_with_sms',
    envVarName: 'VAPI_BOOK_APPOINTMENT_TOOL_ID',
    config: {
      type: 'function',
      async: false,
      function: {
        name: 'book_appointment_with_sms',
        description: 'Books an appointment for a customer and sends SMS confirmation. ONLY call this AFTER checking availability with check_availability and confirming ALL details with the customer.',
        parameters: {
          type: 'object',
          properties: {
            service_type: {
              type: 'string',
              enum: ['emergency', 'repair', 'maintenance', 'installation'],
              description: 'Type of service being booked'
            },
            scheduled_start_time: {
              type: 'string',
              description: 'Appointment date and time in ISO 8601 format (e.g., 2025-10-15T16:00:00)'
            },
            customer_name: {
              type: 'string',
              description: 'Customer\'s full name'
            },
            customer_phone: {
              type: 'string',
              description: 'Customer\'s phone number in E.164 format (e.g., +14099952315)'
            },
            customer_email: {
              type: 'string',
              description: 'Customer\'s email address (optional but recommended)'
            },
            address: {
              type: 'string',
              description: 'Complete service address where work will be performed'
            },
            preferred_language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Customer\'s preferred language for communication'
            },
            sms_preference: {
              type: 'boolean',
              description: 'Whether customer wants to receive SMS confirmations'
            },
            cultural_formality: {
              type: 'string',
              enum: ['formal', 'informal'],
              description: 'Preferred level of formality in communication'
            }
          },
          required: ['service_type', 'scheduled_start_time', 'customer_name', 'customer_phone', 'address']
        }
      },
      server: {
        url: `${BASE_WEBHOOK_URL}/api/webhooks/vapi`,
        timeoutSeconds: 20
      },
      messages: [
        {
          type: 'request-start',
          content: 'Booking your appointment now...'
        },
        {
          type: 'request-complete',
          content: 'Perfect! Your appointment has been confirmed.'
        },
        {
          type: 'request-failed',
          content: 'I apologize, I had trouble booking the appointment. Let me try again.'
        },
        {
          type: 'request-response-delayed',
          content: 'This is taking a bit longer than expected. Please hold on...'
        }
      ]
    }
  },
  {
    name: 'check_emergency_multilingual',
    envVarName: 'VAPI_EMERGENCY_CHECK_TOOL_ID',
    config: {
      type: 'function',
      async: false,
      function: {
        name: 'check_emergency_multilingual',
        description: 'Analyze the urgency level of a customer issue across multiple languages. Use this to determine if immediate emergency response is needed.',
        parameters: {
          type: 'object',
          properties: {
            issue_description: {
              type: 'string',
              description: 'Description of the customer\'s issue or problem'
            },
            detected_language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Language the customer is speaking'
            },
            urgency_indicators: {
              type: 'array',
              items: { type: 'string' },
              description: 'Keywords or phrases indicating urgency (e.g., emergency, urgent, gas leak)'
            },
            cultural_context: {
              type: 'string',
              description: 'Cultural communication style detected (e.g., direct, formal)'
            }
          },
          required: ['issue_description', 'detected_language']
        }
      },
      server: {
        url: `${BASE_WEBHOOK_URL}/api/webhooks/vapi`,
        timeoutSeconds: 20
      },
      messages: [
        {
          type: 'request-start',
          content: 'Let me assess the urgency of your situation...'
        },
        {
          type: 'request-complete',
          content: 'I\'ve evaluated your request.'
        },
        {
          type: 'request-failed',
          content: 'I had trouble processing that. Please describe your issue again.'
        }
      ]
    }
  },
  {
    name: 'send_sms_notification',
    envVarName: 'VAPI_SMS_NOTIFICATION_TOOL_ID',
    config: {
      type: 'function',
      async: false,
      function: {
        name: 'send_sms_notification',
        description: 'Send an SMS notification to a customer in their preferred language. Use for appointment reminders, updates, or important information.',
        parameters: {
          type: 'object',
          properties: {
            phone_number: {
              type: 'string',
              description: 'Recipient phone number in E.164 format'
            },
            message_type: {
              type: 'string',
              enum: ['appointment_confirmation', 'appointment_reminder', 'emergency_alert', 'general_notification'],
              description: 'Type of message being sent'
            },
            language: {
              type: 'string',
              enum: ['en', 'es'],
              description: 'Language for the SMS message'
            },
            urgency_level: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'emergency'],
              description: 'Urgency level of the notification'
            }
          },
          required: ['phone_number', 'message_type', 'language']
        }
      },
      server: {
        url: `${BASE_WEBHOOK_URL}/api/webhooks/vapi`,
        timeoutSeconds: 15
      },
      messages: [
        {
          type: 'request-start',
          content: 'Sending you a text message...'
        },
        {
          type: 'request-complete',
          content: 'I\'ve sent you a text message.'
        },
        {
          type: 'request-failed',
          content: 'I had trouble sending the message. I\'ll make a note for follow-up.'
        }
      ]
    }
  }
]

async function createTool(toolDef: ToolDefinition): Promise<{ id: string; name: string } | null> {
  try {
    console.log(`\n📝 Creating tool: ${toolDef.name}`)

    const response = await fetch('https://api.vapi.ai/tool', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toolDef.config)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`❌ Failed to create ${toolDef.name}:`, response.status, errorData)
      return null
    }

    const result = await response.json()
    console.log(`✅ Created ${toolDef.name} with ID: ${result.id}`)

    return {
      id: result.id,
      name: toolDef.name
    }
  } catch (error) {
    console.error(`❌ Error creating ${toolDef.name}:`, error)
    return null
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║       VAPI TOOLS SETUP - Multi-Tenant ServiceAI          ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Webhook URL: ${BASE_WEBHOOK_URL}/api/webhooks/vapi`)
  console.log('')
  console.log('This script will create 4 reusable tools in your VAPI account:')
  console.log('  1. check_availability - Check appointment slots')
  console.log('  2. book_appointment_with_sms - Book and confirm appointments')
  console.log('  3. check_emergency_multilingual - Emergency detection')
  console.log('  4. send_sms_notification - SMS messaging')
  console.log('')
  console.log('These tools will be reused by ALL assistants across ALL organizations.')
  console.log('')

  const createdTools: Array<{ envVar: string; toolId: string }> = []

  for (const toolDef of tools) {
    const result = await createTool(toolDef)
    if (result) {
      createdTools.push({
        envVar: toolDef.envVarName,
        toolId: result.id
      })
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('')
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║                    SETUP COMPLETE                         ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`✅ Successfully created ${createdTools.length}/${tools.length} tools`)
  console.log('')

  if (createdTools.length > 0) {
    console.log('📋 ADD THESE TO YOUR .env.local FILE:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    createdTools.forEach(tool => {
      console.log(`${tool.envVar}=${tool.toolId}`)
    })
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log('After adding these to .env.local:')
    console.log('  1. Restart your development server: npm run dev')
    console.log('  2. Test by creating a new assistant')
    console.log('  3. Make a test call to verify tools are working')
    console.log('')
  }

  if (createdTools.length < tools.length) {
    console.error('⚠️  Some tools failed to create. Check the errors above.')
    console.error('   You may need to delete any partially created tools and try again.')
    console.error('   Dashboard: https://dashboard.vapi.ai/tools')
  }
}

main().catch(console.error)
