#!/usr/bin/env tsx

/**
 * Script to create a new assistant directly via Vapi API with tool ID references
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const ORGANIZATION_ID = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'

async function createAssistantDirect() {
  console.log('🚀 Creating assistant directly via Vapi API...')
  
  const VAPI_API_KEY = process.env.VAPI_API_KEY
  if (!VAPI_API_KEY) {
    throw new Error('VAPI_API_KEY not configured')
  }

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

  // Create assistant configuration
  const assistantConfig = {
    name: 'Test HVAC Company_hvac_multilingual_v2',
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

You are knowledgeable about:
- Heating systems (furnaces, heat pumps, boilers)
- Cooling systems (air conditioners, heat pumps)
- Ventilation and air quality
- Thermostats and controls
- Ductwork and air distribution
- Energy efficiency and maintenance

Always be professional, helpful, and prioritize customer safety.

IMPORTANT DATE CONTEXT:
- Today's date is 2025-10-13
- When checking availability or booking appointments, always use dates from today forward
- NEVER use past dates (dates before 2025-10-13)
- Format dates as YYYY-MM-DD (e.g., 2025-10-13)

APPOINTMENT BOOKING TOOLS & WORKFLOW:

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
      tools: tools,
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
      speed: 1,
      pitch: 1
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
  console.log('📤 Config:', JSON.stringify(assistantConfig, null, 2))

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
    console.log('🔧 Assistant created with tool ID references!')

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
          tools_count: tools.length,
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
createAssistantDirect()
  .then(() => {
    console.log('🎉 Assistant creation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Creation failed:', error)
    process.exit(1)
  })
