#!/usr/bin/env tsx

/**
 * Script to create a simple assistant with inline tool definitions
 * This will test if the basic tool functionality works
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const ORGANIZATION_ID = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'

async function createSimpleAssistant() {
  console.log('🚀 Creating simple assistant with inline tool definitions...')
  
  const VAPI_API_KEY = process.env.VAPI_API_KEY
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

  // Create assistant configuration with inline tool definitions
  const assistantConfig = {
    name: 'Test HVAC Company_hvac_multilingual_v3',
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for Test HVAC Company, a professional HVAC and climate control service company. 

Your role is to:
- Answer customer calls professionally and helpfully
- Assess HVAC issues and determine urgency levels
- Schedule appointments for repairs, maintenance, and installations
- Provide emergency assistance for urgent heating/cooling problems
- Collect customer information and service requirements
- Send SMS confirmations and reminders

Business Information:
- Company: Test HVAC Company
- Phone: 14099952315
- Address: 14106 DAWN WHISTLE WAY
- Email: biebele@gmail.com

IMPORTANT DATE CONTEXT:
- Today's date is 2025-10-13
- When checking availability or booking appointments, always use dates from today forward
- NEVER use past dates (dates before 2025-10-13)
- Format dates as YYYY-MM-DD (e.g., 2025-10-13)

APPOINTMENT BOOKING WORKFLOW:

You have access to these functions during calls:

1. check_availability
   - Purpose: Check available appointment slots before booking
   - When to use: ALWAYS use this FIRST when customer wants an appointment
   - Parameters needed: requested_date (YYYY-MM-DD), service_type
   - Response: List of available time slots

2. book_appointment_with_sms
   - Purpose: Book the appointment and send SMS confirmation
   - When to use: ONLY after checking availability and confirming details
   - Parameters needed: All customer information (name, phone, address, etc.)
   - Response: Confirmation with appointment ID

CRITICAL BOOKING WORKFLOW - FOLLOW THIS SEQUENCE:

Step 1: Customer Request
   - Customer says they want to book an appointment
   - Ask what type of service they need
   - Ask for their preferred date

Step 2: Check Availability (MANDATORY)
   - Call check_availability with requested_date and service_type
   - Wait for response with available time slots
   - Present available options to customer in conversational way
   - Example: "I have openings at 9am, 2pm, and 4pm. Which works best for you?"

Step 3: Gather Information
   - After customer selects a time, collect:
     * Full name
     * Phone number (verify format)
     * Email address (optional but recommended)
     * Complete service address
     * Any special requirements

Step 4: Confirm Details
   - Repeat all details back to customer
   - Example: "Let me confirm: [Service type] on [date] at [time] for [name] at [address]. Is this correct?"
   - Wait for customer confirmation

Step 5: Book Appointment
   - Only after customer confirms, call book_appointment_with_sms
   - Provide ALL required parameters
   - Wait for booking confirmation

Step 6: Confirm to Customer
   - Tell customer: "Perfect! Your appointment is confirmed for [date] at [time]."
   - Tell customer: "You'll receive a confirmation text message shortly at [phone number]."
   - Provide any additional relevant information

CRITICAL RULES:
❌ NEVER book without calling check_availability first
❌ NEVER book without customer confirmation of all details
❌ NEVER skip collecting required information
✅ ALWAYS check availability before presenting time options
✅ ALWAYS confirm details before booking
✅ ALWAYS tell customer they'll receive SMS confirmation

ERROR HANDLING:
- If check_availability returns no slots: Offer alternative dates
- If booking fails: Apologize and offer to try again or take manual reservation
- If customer provides invalid information: Politely ask for correction

LANGUAGE CAPABILITIES:
- You are fluent in English and Spanish
- Automatically detect and respond in the customer's language
- Use appropriate cultural communication styles for each language
- Switch languages seamlessly if customer changes language mid-conversation
- Supported languages: en, es

EMERGENCY DETECTION (MULTILINGUAL):
English keywords: no heat, no heating, furnace not working, heater broken, no cooling, no air conditioning, AC not working, air conditioner broken, gas smell, gas leak, carbon monoxide, CO detector, furnace out, heater out, AC out, cooling out, emergency, urgent, asap, immediately, freezing, too hot, too cold, temperature, pilot light, flame, smoke, burning smell
Spanish keywords: sin calefacción, no calienta, horno no funciona, calentador roto, sin aire, sin refrigeración, aire acondicionado no funciona, AC roto, olor a gas, fuga de gas, monóxido de carbono, detector de CO, horno descompuesto, calentador descompuesto, AC descompuesto, emergencia, urgente, inmediatamente, ya, congelando, muy caliente, muy frío, temperatura, piloto, llama, humo, olor a quemado

If emergency detected:
1. Immediately assess urgency level (1-10)
2. Collect essential information (address, contact, description)
3. Provide reassurance in customer's language
4. Escalate to emergency contact if needed
5. Send SMS alerts if customer consents`
        }
      ],
      tools: [
        {
          type: 'function',
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
            url: 'https://cce36ecd6b18.ngrok-free.app/api/webhooks/vapi',
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
        },
        {
          type: 'function',
          function: {
            name: 'book_appointment_with_sms',
            description: 'Book an appointment and send SMS confirmation to the customer. Only use this AFTER checking availability and confirming all details with the customer.',
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
                  format: 'date-time',
                  description: 'Start time of the appointment in ISO format'
                },
                customer_name: {
                  type: 'string',
                  description: 'Full name of the customer'
                },
                customer_phone: {
                  type: 'string',
                  description: 'Customer phone number'
                },
                customer_email: {
                  type: 'string',
                  description: 'Customer email address (optional)'
                },
                address: {
                  type: 'string',
                  description: 'Complete service address'
                },
                preferred_language: {
                  type: 'string',
                  enum: ['en', 'es'],
                  description: 'Customer preferred language'
                },
                sms_preference: {
                  type: 'boolean',
                  description: 'Whether customer wants SMS notifications'
                }
              },
              required: ['service_type', 'scheduled_start_time', 'customer_name', 'customer_phone', 'address', 'preferred_language']
            }
          },
          server: {
            url: 'https://cce36ecd6b18.ngrok-free.app/api/webhooks/vapi',
            timeoutSeconds: 20
          },
          messages: [
            {
              type: 'request-start',
              content: 'I\'m booking your appointment now...'
            },
            {
              type: 'request-complete',
              content: 'Your appointment has been confirmed!'
            },
            {
              type: 'request-failed',
              content: 'I had trouble booking your appointment. Let me try that again.'
            }
          ]
        }
      ],
      temperature: 0.7
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'multi'
    },
    voice: {
      provider: 'vapi',
      voiceId: 'Paige',
      speed: 1
    },
    serverUrl: 'https://cce36ecd6b18.ngrok-free.app/api/webhooks/vapi',
    serverMessages: [
      'status-update',
      'tool-calls',
      'speech-update',
      'hang',
      'function-call',
      'end-of-call-report'
    ],
    firstMessage: 'Hello! Thank you for calling Test HVAC Company. This is our AI assistant. I\'m here to help you with your HVAC needs. How can I assist you today?'
  }

  console.log('📤 Creating assistant via Vapi API...')

  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assistantConfig)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Vapi API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Assistant created successfully!')
    console.log('📋 Response:', JSON.stringify(result, null, 2))

    console.log(`🎉 New assistant ID: ${result.id}`)
    console.log(`📞 Phone number: ${result.phoneNumber}`)
    console.log('🔧 Assistant created with inline tool definitions!')

    // Update database record
    const { createServiceRoleClient } = await import('../lib/supabase/server.js')
    const supabase = createServiceRoleClient()
    
    const { error: dbError } = await supabase
      .from('vapi_assistants')
      .update({ 
        vapi_assistant_id: result.id,
        updated_at: new Date().toISOString(),
        business_data: {
          ...result.business_data,
          tools_updated: true,
          tools_count: 2,
          updated_at: new Date().toISOString()
        }
      })
      .eq('organization_id', ORGANIZATION_ID)
      .eq('industry_code', 'hvac')
      .eq('language_code', 'en')

    if (dbError) {
      console.error('⚠️ Database update error:', dbError)
    } else {
      console.log('✅ Database record updated')
    }

  } catch (error) {
    console.error('❌ Error creating assistant:', error)
    throw error
  }
}

// Run the creation
createSimpleAssistant()
  .then(() => {
    console.log('🎉 Assistant creation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Creation failed:', error)
    process.exit(1)
  })
