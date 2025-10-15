# 🛠️ Developer Implementation Guide
## VAPI Tools Integration for Multi-Tenant App

**Target Developer**: Development Agent  
**Estimated Time**: 2-3 hours  
**Priority**: HIGH - Critical for appointment booking functionality  

---

## 📋 Overview

This guide implements proper VAPI tool calling for appointment booking across all organizations in the multi-tenant ServiceAI platform. Currently, tools are defined inline (deprecated method) and not properly callable by the AI. This update fixes that issue.

### What's Changing

1. ✅ Move from inline function definitions to reusable tool references
2. ✅ Add `check_availability` tool handler to prevent double-bookings
3. ✅ Update system prompts to guide tool usage for ALL business types
4. ✅ Ensure proper tool integration for every new assistant created

---

## 🎯 Implementation Steps

### STEP 1: Add Check Availability Endpoint

**File**: `app/api/appointments/available-slots/route.ts`

This endpoint is already partially implemented. Verify it returns available time slots properly.

**Expected Behavior**:
- Receives: `requested_date`, `service_type`, `organizationId`
- Returns: Array of available time slots
- Checks existing appointments to avoid conflicts

**If the file doesn't exist or needs updates**, implement:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    
    const { organizationId, requested_date, service_type } = body
    
    if (!organizationId || !requested_date) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, requested_date' },
        { status: 400 }
      )
    }
    
    // Get existing appointments for that date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('scheduled_time, duration_minutes')
      .eq('organization_id', organizationId)
      .eq('scheduled_date', requested_date)
      .not('status', 'in', '(cancelled,no_show)')
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }
    
    // Define business hours (make this configurable per org in future)
    const businessHours = {
      start: '09:00:00',
      end: '17:00:00',
      slotDuration: getDurationForServiceType(service_type)
    }
    
    // Calculate available slots
    const availableSlots = calculateAvailableSlots(
      businessHours,
      appointments || [],
      requested_date
    )
    
    return NextResponse.json({
      success: true,
      requested_date,
      service_type,
      available_slots: availableSlots,
      total_slots: availableSlots.length
    })
    
  } catch (error: any) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDurationForServiceType(serviceType: string): number {
  const durations: Record<string, number> = {
    'emergency': 120,
    'repair': 90,
    'maintenance': 60,
    'installation': 180
  }
  return durations[serviceType?.toLowerCase()] || 60
}

function calculateAvailableSlots(
  businessHours: { start: string; end: string; slotDuration: number },
  bookedAppointments: Array<{ scheduled_time: string; duration_minutes: number }>,
  date: string
): string[] {
  const slots: string[] = []
  const slotDuration = businessHours.slotDuration
  
  // Parse business hours
  const [startHour, startMin] = businessHours.start.split(':').map(Number)
  const [endHour, endMin] = businessHours.end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  // Generate all possible slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`
    
    // Check if this slot conflicts with any booked appointment
    const hasConflict = bookedAppointments.some(apt => {
      const aptTime = apt.scheduled_time
      const aptDuration = apt.duration_minutes
      const aptEndMinutes = parseTimeToMinutes(aptTime) + aptDuration
      const slotEndMinutes = minutes + slotDuration
      
      // Check for overlap
      return !(slotEndMinutes <= parseTimeToMinutes(aptTime) || minutes >= aptEndMinutes)
    })
    
    if (!hasConflict) {
      slots.push(timeSlot)
    }
  }
  
  return slots
}

function parseTimeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number)
  return hour * 60 + min
}
```

---

### STEP 2: Add Check Availability Tool Handler

**File**: `lib/webhooks/tool-call-handlers.ts`

**Location**: Add this method to the `ToolCallHandlers` class, right after `handleAppointmentBooking()`

```typescript
/**
 * Handle availability check tool call
 */
async handleAvailabilityCheck(
  organizationId: string,
  toolCall: { id: string; function: { name: string; arguments: any } },
  language: 'en' | 'es'
): Promise<ToolCallResult> {
  try {
    console.log(`📅 Checking availability for organization ${organizationId} in ${language}`)
    console.log(`📋 Tool call arguments:`, JSON.stringify(toolCall.function.arguments, null, 2))

    const args = toolCall.function.arguments

    // Validate required fields
    if (!args.requested_date || !args.service_type) {
      const errorMsg = 'Missing required fields: requested_date, service_type'
      console.error(`❌ Validation failed: ${errorMsg}`)
      return {
        success: false,
        error: errorMsg
      }
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(args.requested_date)) {
      const errorMsg = `Invalid date format: ${args.requested_date}. Expected YYYY-MM-DD`
      console.error(`❌ ${errorMsg}`)
      return {
        success: false,
        error: errorMsg
      }
    }

    const supabase = createServiceRoleClient()

    // Get existing appointments for that date
    const { data: appointments, error: dbError } = await supabase
      .from('appointments')
      .select('scheduled_time, duration_minutes')
      .eq('organization_id', organizationId)
      .eq('scheduled_date', args.requested_date)
      .not('status', 'in', '(cancelled,no_show)')

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return {
        success: false,
        error: `Database error: ${dbError.message}`
      }
    }

    // Define business hours
    const businessHours = {
      start: '09:00:00',
      end: '17:00:00',
      slotDuration: this.calculateDuration(args.service_type)
    }

    // Calculate available slots
    const availableSlots = this.calculateAvailableSlots(
      businessHours,
      appointments || [],
      args.requested_date
    )

    console.log(`✅ Found ${availableSlots.length} available slots for ${args.requested_date}`)

    // Format message based on language
    const message = language === 'es'
      ? availableSlots.length > 0
        ? `Tengo ${availableSlots.length} horarios disponibles`
        : 'No hay disponibilidad en esta fecha'
      : availableSlots.length > 0
        ? `I have ${availableSlots.length} available time slots`
        : 'No availability on this date'

    return {
      success: true,
      data: {
        requested_date: args.requested_date,
        service_type: args.service_type,
        available_slots: availableSlots,
        total_slots: availableSlots.length,
        message: message,
        business_hours: businessHours
      }
    }

  } catch (error: any) {
    console.error('❌ Error checking availability:', error)
    console.error('❌ Error stack:', error.stack)
    return {
      success: false,
      error: error.message || String(error)
    }
  }
}

/**
 * Calculate available time slots avoiding conflicts
 */
private calculateAvailableSlots(
  businessHours: { start: string; end: string; slotDuration: number },
  bookedAppointments: Array<{ scheduled_time: string; duration_minutes: number }>,
  date: string
): string[] {
  const slots: string[] = []
  const slotDuration = businessHours.slotDuration

  // Parse business hours
  const [startHour, startMin] = businessHours.start.split(':').map(Number)
  const [endHour, endMin] = businessHours.end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Generate all possible slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeSlot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`

    // Check if this slot conflicts with any booked appointment
    const hasConflict = bookedAppointments.some(apt => {
      const aptMinutes = this.parseTimeToMinutes(apt.scheduled_time)
      const aptDuration = apt.duration_minutes
      const aptEndMinutes = aptMinutes + aptDuration
      const slotEndMinutes = minutes + slotDuration

      // Check for overlap
      return !(slotEndMinutes <= aptMinutes || minutes >= aptEndMinutes)
    })

    if (!hasConflict) {
      slots.push(timeSlot)
    }
  }

  return slots
}

/**
 * Convert time string to minutes since midnight
 */
private parseTimeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number)
  return hour * 60 + min
}
```

---

### STEP 3: Update Webhook Handler to Route check_availability

**File**: `lib/webhooks/multilingual-webhook-handler.ts`

**Location**: In the `handleToolCalls()` method, add the new case

**Find this section** (around line 250):

```typescript
switch (toolCall.function.name) {
  case 'check_emergency_multilingual':
    result = await this.toolCallHandlers.handleEmergencyCheck(customerId, toolCall, language)
    break

  case 'book_appointment_with_sms':
    result = await this.toolCallHandlers.handleAppointmentBooking(customerId, toolCall, language)
    break

  case 'send_sms_notification':
    result = await this.toolCallHandlers.handleSMSNotification(customerId, toolCall, language)
    break

  default:
    result = {
      success: false,
      error: `Unknown tool call: ${toolCall.function.name}`
    }
}
```

**Add this new case** BEFORE `book_appointment_with_sms`:

```typescript
switch (toolCall.function.name) {
  case 'check_emergency_multilingual':
    result = await this.toolCallHandlers.handleEmergencyCheck(customerId, toolCall, language)
    break

  case 'check_availability':  // ADD THIS CASE
    result = await this.toolCallHandlers.handleAvailabilityCheck(customerId, toolCall, language)
    break

  case 'book_appointment_with_sms':
    result = await this.toolCallHandlers.handleAppointmentBooking(customerId, toolCall, language)
    break

  case 'send_sms_notification':
    result = await this.toolCallHandlers.handleSMSNotification(customerId, toolCall, language)
    break

  default:
    result = {
      success: false,
      error: `Unknown tool call: ${toolCall.function.name}`
    }
}
```

---

### STEP 4: Update System Prompt Template

**File**: `lib/templates/template-service.ts`

**Location**: In the `createVapiAssistantConfig()` method

This is the most critical change - it must be added to ALL assistant prompts regardless of business type.

**Find where the system prompt is constructed** (should be around line 100-200). You'll see something like:

```typescript
const systemPrompt = `You are an AI assistant for ${businessData.business_name}...`
```

**Add this section** to the prompt (AFTER the main business description but BEFORE the language capabilities section):

```typescript
const appointmentBookingGuidance = `

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
`

// Then include it in the final prompt construction
const systemPrompt = `You are an AI assistant for ${businessData.business_name}...

${appointmentBookingGuidance}

LANGUAGE CAPABILITIES:
...
`
```

**Important**: Make sure this `appointmentBookingGuidance` is added to EVERY assistant prompt, regardless of industry. This should be injected automatically in the prompt generation logic.

---

### STEP 5: Update createMultilingualTools() Method

**File**: `lib/vapi/multilingual-vapi-service.ts`

**Location**: Replace the entire `createMultilingualTools()` method

**Current implementation** uses inline function definitions (deprecated).

**New implementation** references tool IDs that will be created manually:

```typescript
/**
 * Create multilingual tools for Vapi assistant
 * UPDATED: Uses reusable tool references instead of inline definitions
 */
private createMultilingualTools(template: IndustryTemplate, organizationId: string): any[] {
  // Get pre-created tool IDs from environment variables
  // These tools are created ONCE and reused for all organizations
  const CHECK_AVAILABILITY_TOOL_ID = process.env.VAPI_CHECK_AVAILABILITY_TOOL_ID
  const BOOK_APPOINTMENT_TOOL_ID = process.env.VAPI_BOOK_APPOINTMENT_TOOL_ID
  const EMERGENCY_CHECK_TOOL_ID = process.env.VAPI_EMERGENCY_CHECK_TOOL_ID
  const SMS_NOTIFICATION_TOOL_ID = process.env.VAPI_SMS_NOTIFICATION_TOOL_ID

  const tools: any[] = []

  // Emergency detection tool
  if (EMERGENCY_CHECK_TOOL_ID) {
    tools.push({
      type: 'function',
      id: EMERGENCY_CHECK_TOOL_ID
    })
  } else {
    console.warn('⚠️ VAPI_EMERGENCY_CHECK_TOOL_ID not configured - emergency detection disabled')
  }

  // Check availability tool (NEW - CRITICAL for appointment booking)
  if (CHECK_AVAILABILITY_TOOL_ID) {
    tools.push({
      type: 'function',
      id: CHECK_AVAILABILITY_TOOL_ID
    })
  } else {
    console.error('❌ VAPI_CHECK_AVAILABILITY_TOOL_ID not configured - availability checking disabled')
    console.error('   This tool is REQUIRED for appointment booking to work correctly')
  }

  // Book appointment tool
  if (BOOK_APPOINTMENT_TOOL_ID) {
    tools.push({
      type: 'function',
      id: BOOK_APPOINTMENT_TOOL_ID
    })
  } else {
    console.error('❌ VAPI_BOOK_APPOINTMENT_TOOL_ID not configured - appointment booking disabled')
  }

  // SMS notification tool
  if (SMS_NOTIFICATION_TOOL_ID) {
    tools.push({
      type: 'function',
      id: SMS_NOTIFICATION_TOOL_ID
    })
  } else {
    console.warn('⚠️ VAPI_SMS_NOTIFICATION_TOOL_ID not configured - SMS notifications disabled')
  }

  // Log configuration status
  console.log(`🔧 Configured ${tools.length} tools for assistant`)
  if (tools.length < 4) {
    console.warn(`⚠️ Some tools are missing. Expected 4, got ${tools.length}`)
    console.warn('   Check that all VAPI_*_TOOL_ID environment variables are set')
  }

  return tools
}
```

**Also add a helper method** to validate tool configuration:

```typescript
/**
 * Validate that all required tool IDs are configured
 * Call this during assistant creation to catch configuration issues early
 */
private validateToolConfiguration(): { isValid: boolean; missingTools: string[] } {
  const requiredTools = {
    'VAPI_CHECK_AVAILABILITY_TOOL_ID': process.env.VAPI_CHECK_AVAILABILITY_TOOL_ID,
    'VAPI_BOOK_APPOINTMENT_TOOL_ID': process.env.VAPI_BOOK_APPOINTMENT_TOOL_ID,
    'VAPI_EMERGENCY_CHECK_TOOL_ID': process.env.VAPI_EMERGENCY_CHECK_TOOL_ID,
    'VAPI_SMS_NOTIFICATION_TOOL_ID': process.env.VAPI_SMS_NOTIFICATION_TOOL_ID
  }

  const missingTools = Object.entries(requiredTools)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  return {
    isValid: missingTools.length === 0,
    missingTools
  }
}
```

**Call this validation** in `createMultilingualAssistant()` (add after line 95):

```typescript
// Validate tool configuration before creating assistant
const toolValidation = this.validateToolConfiguration()
if (!toolValidation.isValid) {
  console.error('❌ Tool configuration incomplete. Missing tools:')
  toolValidation.missingTools.forEach(tool => console.error(`   - ${tool}`))
  console.error('   Assistant will be created but some features will not work')
  console.error('   Run the manual setup script to create tools')
}
```

---

### STEP 6: Add Environment Variables Template

**File**: `env.template`

**Add these new variables**:

```bash
# Vapi Tool IDs (created once, reused for all organizations)
# Run scripts/setup-vapi-tools.ts to generate these
VAPI_CHECK_AVAILABILITY_TOOL_ID=
VAPI_BOOK_APPOINTMENT_TOOL_ID=
VAPI_EMERGENCY_CHECK_TOOL_ID=
VAPI_SMS_NOTIFICATION_TOOL_ID=
```

---

### STEP 7: Create Tool Setup Script

**File**: `scripts/setup-vapi-tools.ts` (NEW FILE)

This script will be run manually by the admin to create tools in VAPI.

```typescript
/**
 * VAPI Tools Setup Script
 * 
 * Purpose: Create reusable tools in VAPI that will be referenced by all assistants
 * Usage: npx tsx scripts/setup-vapi-tools.ts
 * 
 * This script should be run ONCE during initial setup or when adding new tools.
 * The tool IDs generated should be added to .env.local
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const VAPI_API_KEY = process.env.VAPI_API_KEY
const BASE_WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VAPI_WEBHOOK_URL

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
              format: 'date',
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
              format: 'date-time',
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
              format: 'email',
              description: 'Customer\'s email address (optional but recommended)'
            },
            address: {
              type: 'string',
              description: 'Complete service address where work will be performed'
            },
            preferred_language: {
              type: 'string',
              enum: ['en', 'es'],
              default: 'en',
              description: 'Customer\'s preferred language for communication'
            },
            sms_preference: {
              type: 'boolean',
              default: true,
              description: 'Whether customer wants to receive SMS confirmations'
            },
            cultural_formality: {
              type: 'string',
              enum: ['formal', 'informal'],
              default: 'formal',
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
              default: 'medium',
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
```

---

### STEP 8: Update Package Scripts

**File**: `package.json`

**Add this script**:

```json
{
  "scripts": {
    "setup-vapi-tools": "npx tsx scripts/setup-vapi-tools.ts"
  }
}
```

---

### STEP 9: Create Documentation

**File**: `docs/VAPI_TOOLS_SETUP.md` (NEW FILE)

```markdown
# VAPI Tools Setup Documentation

## Overview

This document explains how appointment booking tools are configured in the ServiceAI multi-tenant platform.

## Architecture

### Tool Creation Model
- Tools are created ONCE in VAPI
- Tool IDs are stored in environment variables
- All assistants reference the same tool IDs
- Webhooks route to organization-specific handlers

### Why This Approach?
1. **Reusability**: One tool definition serves all organizations
2. **Maintainability**: Update tool configuration in one place
3. **Cost Efficiency**: No per-organization tool limits
4. **Consistency**: All assistants have identical capabilities

## Available Tools

### 1. check_availability
- **Purpose**: Check available appointment time slots
- **Usage**: Called before booking to prevent double-bookings
- **Parameters**: requested_date, service_type
- **Returns**: List of available time slots

### 2. book_appointment_with_sms
- **Purpose**: Book appointment and send SMS confirmation
- **Usage**: Called after availability check and customer confirmation
- **Parameters**: Full appointment details (name, phone, address, etc.)
- **Returns**: Appointment ID and confirmation

### 3. check_emergency_multilingual
- **Purpose**: Analyze urgency of customer issues
- **Usage**: Automatically called when urgency keywords detected
- **Parameters**: issue_description, detected_language
- **Returns**: Urgency score and recommendations

### 4. send_sms_notification
- **Purpose**: Send SMS messages to customers
- **Usage**: Reminders, updates, notifications
- **Parameters**: phone_number, message_type, language
- **Returns**: Message ID and delivery status

## Setup Process

### Initial Setup (Run Once)
1. Ensure VAPI_API_KEY is in .env.local
2. Run: `npm run setup-vapi-tools`
3. Copy generated tool IDs to .env.local
4. Restart application

### For New Installations
1. Request tool IDs from admin/DevOps
2. Add to .env.local
3. Start application

## Environment Variables

```bash
VAPI_CHECK_AVAILABILITY_TOOL_ID=tool_xxx
VAPI_BOOK_APPOINTMENT_TOOL_ID=tool_yyy
VAPI_EMERGENCY_CHECK_TOOL_ID=tool_zzz
VAPI_SMS_NOTIFICATION_TOOL_ID=tool_aaa
```

## Testing

### Test Availability Check
1. Call assistant
2. Say: "I'd like to book an appointment for tomorrow"
3. Assistant should call check_availability
4. Verify available times are presented

### Test Appointment Booking
1. After availability check
2. Select a time
3. Provide all required information
4. Assistant should call book_appointment_with_sms
5. Verify appointment in database
6. Verify SMS received

## Troubleshooting

### Tools Not Working
- Check environment variables are set
- Verify tool IDs exist in VAPI dashboard
- Check webhook URL is correct and accessible
- Review server logs for tool call errors

### "Tool not found" Errors
- Tool ID may have been deleted
- Run setup script again to recreate
- Update environment variables

### Appointments Not Booking
- Check database permissions
- Verify organization exists
- Check for validation errors in logs
- Ensure required fields are provided

## Maintenance

### Updating Tool Definitions
1. Update configuration in setup script
2. Delete old tools in VAPI dashboard
3. Run setup script to create new versions
4. Update environment variables
5. Restart application

### Monitoring
- Track tool call success rates
- Monitor response times
- Review error logs regularly
- Check SMS delivery rates
```

---

## 🧪 Testing Instructions

### Test 1: Verify Code Changes Compile
```bash
npm run build
```

Expected: No TypeScript errors

### Test 2: Run Tool Setup Script
```bash
npm run setup-vapi-tools
```

Expected: 4 tool IDs generated

### Test 3: Create Test Assistant
```bash
# Use your existing assistant creation endpoint
# Verify logs show tools are configured correctly
```

### Test 4: Make Test Call
1. Call the assistant
2. Say: "I need to book a maintenance appointment for next Tuesday"
3. Expected flow:
   - AI asks for more details
   - AI calls `check_availability`
   - AI presents available times
   - You select a time
   - AI collects your information
   - AI calls `book_appointment_with_sms`
   - Appointment created in database
   - SMS sent to your phone
   - AI confirms booking

### Test 5: Verify Database
```sql
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;
```

Expected: New appointment with correct details

---

## 🔍 Validation Checklist

- [ ] All code changes compile without errors
- [ ] Tool setup script runs successfully
- [ ] 4 tool IDs added to `.env.local`
- [ ] Application restarts without errors
- [ ] New assistants show tools in logs
- [ ] Test call can check availability
- [ ] Test call can book appointment
- [ ] Appointment appears in database
- [ ] SMS confirmation is sent
- [ ] Works for multiple organizations

---

## 📝 Summary of Changes

### Files Modified
1. `app/api/appointments/available-slots/route.ts` - Availability checking endpoint
2. `lib/webhooks/tool-call-handlers.ts` - Added availability handler
3. `lib/webhooks/multilingual-webhook-handler.ts` - Added routing for new tool
4. `lib/templates/template-service.ts` - Added tool usage guidance to prompts
5. `lib/vapi/multilingual-vapi-service.ts` - Changed to tool ID references
6. `env.template` - Added tool ID variables
7. `package.json` - Added setup script

### Files Created
1. `scripts/setup-vapi-tools.ts` - Tool creation script
2. `docs/VAPI_TOOLS_SETUP.md` - Documentation

### Total Estimated Time
- Code changes: 1-2 hours
- Testing: 30 minutes
- Documentation review: 15 minutes

---

## 🚨 Critical Notes

1. **Tool IDs are account-wide**: Don't create separate tools per organization
2. **Webhook routing is automatic**: Your existing organization lookup handles multi-tenancy
3. **System prompts are key**: The AI won't use tools properly without clear guidance
4. **Test thoroughly**: Book multiple appointments to verify no double-bookings occur
5. **Monitor logs**: First few calls should be monitored for tool call issues

---

## ❓ Questions or Issues?

If you encounter any issues during implementation:
1. Check the logs for specific error messages
2. Verify all environment variables are set
3. Ensure VAPI API key has correct permissions
4. Review the troubleshooting section in `docs/VAPI_TOOLS_SETUP.md`
5. Test with a simple call flow before complex scenarios