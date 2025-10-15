# Product Requirements Prompt (PRP): VAPI Appointment Booking Tools Integration

**Generated**: 2025-10-12
**Priority**: HIGH - Critical for appointment booking functionality
**Estimated Implementation Time**: 2-3 hours
**Confidence Score**: 9/10

---

## 📋 Executive Summary

This PRP defines the implementation requirements for fixing VAPI tool calling functionality in the ServiceAI multi-tenant platform. Currently, tools are defined inline (deprecated method) and cannot be properly called by the AI assistant. This implementation will:

1. Move from inline function definitions to reusable tool references
2. Add `check_availability` tool handler to prevent double-bookings
3. Update system prompts to guide proper tool usage across all business types
4. Ensure proper tool integration for every new assistant created
5. Implement proper webhook routing and multi-tenant tool handling

---

## 🎯 Context & Background

### Current State
- **Problem**: VAPI tools are defined inline in assistant configurations (deprecated approach)
- **Impact**: Tools cannot be called reliably; appointment bookings are failing
- **Root Cause**: Missing tool ID references and incomplete tool workflow implementation
- **Evidence**: User reports of "No result returned" errors when booking appointments

### Desired State
- Tools created once in VAPI, referenced by ID across all organizations
- Complete booking workflow: availability check → information gathering → confirmation → booking
- Proper multi-tenant tool routing through unified webhook endpoint
- Clear AI guidance in system prompts for proper tool usage sequencing

### Technical Foundation
- **Database**: Supabase with RLS policies
- **Authentication**: Service role client for webhook operations (bypasses RLS)
- **Webhook Architecture**: Unified multi-tenant endpoint at `/api/webhooks/vapi`
- **Organization Lookup**: By assistant ID, phone number, or call ID
- **Language Support**: English and Spanish (en/es)

---

## 🏗️ Architecture Overview

### Tool Creation Model
```
VAPI Account (once)
  ├── check_availability (Tool ID: env var)
  ├── book_appointment_with_sms (Tool ID: env var)
  ├── check_emergency_multilingual (Tool ID: env var)
  └── send_sms_notification (Tool ID: env var)

Organization Assistants (many)
  ├── Assistant 1 → References Tool IDs
  ├── Assistant 2 → References Tool IDs
  └── Assistant N → References Tool IDs

Webhook Routing
  └── /api/webhooks/vapi
      ├── Identifies organization from call data
      ├── Routes tool calls to handlers
      └── Returns results to VAPI
```

### Data Flow
```
1. AI decides to call tool
2. VAPI sends webhook to /api/webhooks/vapi
3. Webhook identifies organization
4. Handler processes tool call
5. Result returned to VAPI
6. AI presents result to customer
```

---

## 📐 Database Schema

### Existing Tables (No Changes Required)
- `appointments` - Already has correct schema
- `organizations` - Has industry_code for context
- `customer_configurations` - Links assistants to organizations
- `call_logs` - Tracks call history
- `sms_communications` - Logs SMS messages

### Schema Validation
```sql
-- Verify appointments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Expected columns:
-- appointment_type (text) ✓
-- scheduled_date (date) ✓
-- scheduled_time (time) ✓
-- duration_minutes (integer) ✓
-- All other required fields ✓
```

---

## 🔧 Implementation Requirements

### STEP 1: Add Check Availability Tool Handler

**File**: `lib/webhooks/tool-call-handlers.ts`
**Location**: Add after `handleAppointmentBooking()` method (line ~207)
**Lines of Code**: ~150

**Acceptance Criteria**:
- [ ] Method signature matches: `async handleAvailabilityCheck(organizationId, toolCall, language)`
- [ ] Validates required fields: `requested_date`, `service_type`
- [ ] Validates date format: `YYYY-MM-DD` regex pattern
- [ ] Queries existing appointments for that date
- [ ] Calculates available time slots (no conflicts)
- [ ] Returns bilingual messages based on language parameter
- [ ] Handles errors gracefully with clear error messages

**Algorithm**: Availability Calculation
```typescript
// Business hours: 9 AM - 5 PM
// Slot duration: Based on service type (60-180 min)
// For each possible slot:
//   Check if it overlaps with any booked appointment
//   If no overlap: Include in available slots
//   If overlap: Skip
```

**Helper Methods Required**:
- `calculateAvailableSlots()` - Main slot calculation logic
- `parseTimeToMinutes()` - Convert HH:MM:SS to minutes
- `calculateDuration()` - Already exists, reuse

---

### STEP 2: Update Webhook Handler Routing

**File**: `lib/webhooks/multilingual-webhook-handler.ts`
**Location**: In `handleToolCalls()` method switch statement (line ~287)
**Lines of Code**: ~5

**Acceptance Criteria**:
- [ ] New case added: `case 'check_availability':`
- [ ] Routes to `this.toolCallHandlers.handleAvailabilityCheck()`
- [ ] Passes correct parameters: `customerId, toolCall, language`
- [ ] Positioned BEFORE `book_appointment_with_sms` case

**Code Pattern**:
```typescript
switch (toolCall.function.name) {
  case 'check_emergency_multilingual':
    result = await this.toolCallHandlers.handleEmergencyCheck(customerId, toolCall, language)
    break

  case 'check_availability':  // NEW
    result = await this.toolCallHandlers.handleAvailabilityCheck(customerId, toolCall, language)
    break

  case 'book_appointment_with_sms':
    result = await this.toolCallHandlers.handleAppointmentBooking(customerId, toolCall, language)
    break
  // ... rest
}
```

---

### STEP 3: Update System Prompt Template

**File**: `lib/templates/template-service.ts`
**Location**: In `createVapiAssistantConfig()` method
**Lines of Code**: ~200

**Acceptance Criteria**:
- [ ] New section added: `appointmentBookingGuidance`
- [ ] Clearly defines 6-step booking workflow
- [ ] Lists both tools with descriptions and when to use them
- [ ] Includes critical rules (❌ NEVER / ✅ ALWAYS)
- [ ] Handles error scenarios
- [ ] Injected into EVERY assistant prompt automatically
- [ ] Works for all industry types (hvac, plumbing, electrical, etc.)

**Key Workflow Steps Defined in Prompt**:
1. Customer Request - Gather initial information
2. Check Availability (MANDATORY) - Call `check_availability`
3. Gather Information - Collect all required details
4. Confirm Details - Read back and get confirmation
5. Book Appointment - Call `book_appointment_with_sms`
6. Confirm to Customer - Acknowledge and inform about SMS

**Critical Rules to Enforce**:
```
❌ NEVER book without calling check_availability first
❌ NEVER book without customer confirmation
❌ NEVER skip collecting required information
✅ ALWAYS check availability before presenting times
✅ ALWAYS confirm details before booking
✅ ALWAYS tell customer they'll receive SMS
```

---

### STEP 4: Replace createMultilingualTools() Method

**File**: `lib/vapi/multilingual-vapi-service.ts`
**Location**: Replace entire `createMultilingualTools()` method
**Lines of Code**: ~60

**Acceptance Criteria**:
- [ ] Reads tool IDs from environment variables
- [ ] Returns tool references (not inline definitions)
- [ ] Includes all 4 tools: availability, booking, emergency, SMS
- [ ] Logs warnings for missing tool IDs
- [ ] Logs configuration status
- [ ] No inline `function` definitions

**Tool Reference Format**:
```typescript
{
  type: 'function',
  id: process.env.VAPI_CHECK_AVAILABILITY_TOOL_ID
}
```

**Validation Method Required**:
- `validateToolConfiguration()` - Check all tool IDs are set
- Called before assistant creation
- Logs clear warnings for missing tools

---

### STEP 5: Create Tool Setup Script

**File**: `scripts/setup-vapi-tools.ts` (NEW FILE)
**Lines of Code**: ~350

**Acceptance Criteria**:
- [ ] Creates 4 tools in VAPI via API
- [ ] Uses environment variables for webhook URL
- [ ] Defines proper tool schemas with parameters
- [ ] Includes user-friendly messages (request-start, request-complete, etc.)
- [ ] Outputs tool IDs in copy-paste format
- [ ] Handles API errors gracefully
- [ ] Validates VAPI_API_KEY exists

**Tool Definitions Required**:

1. **check_availability**
   - Parameters: `requested_date`, `service_type`
   - Async: false
   - Timeout: 20 seconds
   - Messages: "Let me check what time slots are available..."

2. **book_appointment_with_sms**
   - Parameters: 8 fields (name, phone, email, address, date, language, sms_preference, formality)
   - Async: false
   - Timeout: 20 seconds
   - Messages: "Booking your appointment now..."

3. **check_emergency_multilingual**
   - Parameters: issue_description, detected_language, urgency_indicators
   - Async: false
   - Timeout: 20 seconds
   - Messages: "Let me assess the urgency..."

4. **send_sms_notification**
   - Parameters: phone_number, message_type, language, urgency_level
   - Async: false
   - Timeout: 15 seconds
   - Messages: "Sending you a text message..."

---

### STEP 6: Update Environment Variables

**File**: `.env.example` or `env.template`
**Lines of Code**: ~6

**Acceptance Criteria**:
- [ ] Adds 4 new environment variables
- [ ] Includes clear comments about purpose
- [ ] References setup script for generation

**Variables to Add**:
```bash
# VAPI Tool IDs (created once, reused for all organizations)
# Run: npm run setup-vapi-tools to generate these
VAPI_CHECK_AVAILABILITY_TOOL_ID=
VAPI_BOOK_APPOINTMENT_TOOL_ID=
VAPI_EMERGENCY_CHECK_TOOL_ID=
VAPI_SMS_NOTIFICATION_TOOL_ID=
```

---

### STEP 7: Create Documentation

**File**: `docs/VAPI_TOOLS_SETUP.md` (NEW FILE)
**Lines of Code**: ~200

**Sections Required**:
- [ ] Overview and architecture
- [ ] Tool descriptions
- [ ] Setup process (step-by-step)
- [ ] Testing instructions
- [ ] Troubleshooting guide
- [ ] Maintenance procedures

---

### STEP 8: Add Package Scripts

**File**: `package.json`
**Lines of Code**: ~3

**Acceptance Criteria**:
- [ ] Adds `setup-vapi-tools` script
- [ ] Uses `npx tsx` to run TypeScript directly
- [ ] Can be run with: `npm run setup-vapi-tools`

```json
{
  "scripts": {
    "setup-vapi-tools": "npx tsx scripts/setup-vapi-tools.ts"
  }
}
```

---

## 🧪 Testing Requirements

### Test 1: Code Compilation
```bash
npm run build
```
**Expected**: No TypeScript errors

### Test 2: Tool Setup
```bash
npm run setup-vapi-tools
```
**Expected**:
- 4 tools created successfully
- Tool IDs printed to console
- No API errors

### Test 3: Environment Configuration
```bash
# After adding tool IDs to .env.local
npm run dev
```
**Expected**:
- Server starts without errors
- Logs show "Configured 4 tools for assistant"
- No warnings about missing tool IDs

### Test 4: Assistant Creation
```bash
# Create new assistant via API or UI
```
**Expected**:
- Assistant created successfully
- Logs show tool references (not inline definitions)
- System prompt includes booking guidance

### Test 5: Complete Booking Flow (End-to-End)

**Setup**:
- Use test phone number
- Call the assistant
- Follow complete booking workflow

**Test Script**:
```
User: "I need to book a maintenance appointment for next Tuesday"

Expected AI Behavior:
1. AI asks for service type (if not already mentioned)
2. AI calls check_availability with date and service type
3. AI presents available times: "I have openings at 9am, 2pm, and 4pm..."
4. User selects a time
5. AI collects: name, phone, email, address
6. AI confirms all details: "Let me confirm..."
7. User confirms
8. AI calls book_appointment_with_sms
9. AI confirms: "Perfect! Your appointment is confirmed..."
10. SMS received on phone
```

**Validation**:
```sql
-- Check appointment was created
SELECT * FROM appointments
WHERE customer_phone = '+1234567890'
ORDER BY created_at DESC LIMIT 1;

-- Expected fields:
-- appointment_type: 'maintenance'
-- scheduled_date: (next Tuesday)
-- scheduled_time: (selected time)
-- duration_minutes: 60
-- status: 'pending'
-- organization_id: (correct org)
```

### Test 6: Error Handling

**Test Case 6.1**: No Available Slots
```
User: "Book for December 25th"
Expected: AI offers alternative dates
```

**Test Case 6.2**: Invalid Date
```
User: "Book for yesterday"
Expected: AI explains invalid date and asks for valid date
```

**Test Case 6.3**: Missing Information
```
User: "Book now" (provides no details)
Expected: AI asks clarifying questions one by one
```

**Test Case 6.4**: Double Booking Attempt
```
Setup: Create appointment for 2pm on 2025-10-15
User: "Book for 2pm on October 15"
Expected: 2pm not in available slots list
```

### Test 7: Multi-Tenant Isolation

**Setup**: Create 2 test organizations with different assistants

**Test**:
```
Call Organization A: Book for 2pm October 15
Call Organization B: Book for 2pm October 15

Expected:
- Both appointments succeed
- Each org can see only their own appointment
- No cross-contamination in database
```

**Validation**:
```sql
-- Org A should see their appointment only
SELECT * FROM appointments WHERE organization_id = 'org_a_id';

-- Org B should see their appointment only
SELECT * FROM appointments WHERE organization_id = 'org_b_id';
```

---

## ✅ Validation Gates

### Gate 1: Code Quality
- [ ] All TypeScript compiles without errors
- [ ] No ESLint warnings in new code
- [ ] All methods have type annotations
- [ ] All helper methods have JSDoc comments

### Gate 2: Functionality
- [ ] `check_availability` tool handler returns correct available slots
- [ ] Slots correctly exclude already-booked times
- [ ] `book_appointment_with_sms` creates database record
- [ ] SMS confirmation logic executes (even if mock)
- [ ] Multi-tenant routing works correctly

### Gate 3: Integration
- [ ] Webhook receives and routes tool calls
- [ ] Organization lookup succeeds for all test cases
- [ ] Tool results return to VAPI in correct format
- [ ] AI receives and presents tool results correctly

### Gate 4: User Experience
- [ ] Complete booking flow works end-to-end
- [ ] AI follows 6-step workflow without skipping
- [ ] AI never books without checking availability
- [ ] Customer receives clear confirmation
- [ ] Error messages are user-friendly

### Gate 5: Documentation
- [ ] Setup instructions are clear and complete
- [ ] Troubleshooting guide covers common issues
- [ ] Code includes inline comments for complex logic
- [ ] Environment variables are documented

---

## 🎯 Success Criteria

### Primary Success Metrics
1. **Tool Creation**: All 4 tools created successfully in VAPI
2. **Assistant Creation**: New assistants reference tool IDs (not inline)
3. **Booking Success Rate**: 100% of valid booking attempts succeed
4. **Double-Booking Prevention**: 0% double-bookings occur
5. **Multi-Tenant Isolation**: 100% of bookings route to correct organization

### Secondary Success Metrics
1. **AI Workflow Compliance**: AI follows 6-step process in 95%+ of calls
2. **Error Handling**: All error scenarios handled gracefully
3. **Response Time**: Tool calls complete within 20 seconds
4. **SMS Delivery**: SMS confirmations sent for 100% of bookings (when enabled)

### Quality Metrics
1. **Code Coverage**: All new methods have clear test cases
2. **Documentation**: All features documented with examples
3. **Logging**: Clear log messages at each step for debugging
4. **Monitoring**: Ability to track tool call success/failure rates

---

## 🚨 Critical Implementation Notes

### 1. Tool IDs Are Account-Wide
- Create tools ONCE in VAPI
- All organizations share the same tool IDs
- Multi-tenancy handled by webhook routing, not separate tools

### 2. Database Authentication
- MUST use `createServiceRoleClient()` in tool handlers
- Webhooks don't have user authentication context
- Service role bypasses RLS for necessary operations

### 3. System Prompts Are Key
- AI won't follow workflow without explicit guidance
- Prompts must be injected for ALL industries
- Test prompts with various customer interaction styles

### 4. Error Handling Is Critical
- Tool failures shouldn't crash the assistant
- Provide fallback options when tools fail
- Log all errors for debugging

### 5. Test Thoroughly
- First few calls should be monitored live
- Check logs for each step of workflow
- Verify database records match expectations
- Test edge cases (no availability, invalid input, etc.)

---

## 📊 Implementation Checklist

### Phase 1: Core Implementation (90 minutes)
- [ ] Add `handleAvailabilityCheck()` to tool-call-handlers.ts
- [ ] Add helper methods: `calculateAvailableSlots()`, `parseTimeToMinutes()`
- [ ] Update webhook routing in multilingual-webhook-handler.ts
- [ ] Test compilation: `npm run build`

### Phase 2: Tool Configuration (45 minutes)
- [ ] Replace `createMultilingualTools()` in multilingual-vapi-service.ts
- [ ] Add `validateToolConfiguration()` method
- [ ] Update environment variable templates
- [ ] Create `scripts/setup-vapi-tools.ts`
- [ ] Test tool creation: `npm run setup-vapi-tools`

### Phase 3: System Prompts (30 minutes)
- [ ] Add `appointmentBookingGuidance` to template-service.ts
- [ ] Inject guidance into all assistant prompts
- [ ] Test assistant creation with updated prompts
- [ ] Verify prompt includes tool workflow

### Phase 4: Documentation (30 minutes)
- [ ] Create `docs/VAPI_TOOLS_SETUP.md`
- [ ] Update package.json scripts
- [ ] Add inline code comments
- [ ] Write troubleshooting guide

### Phase 5: Testing (45 minutes)
- [ ] Run all automated tests
- [ ] Perform end-to-end booking test
- [ ] Test error scenarios
- [ ] Test multi-tenant isolation
- [ ] Verify SMS confirmation flow

### Phase 6: Validation (15 minutes)
- [ ] Review all validation gates
- [ ] Check success criteria
- [ ] Verify database records
- [ ] Review logs for errors
- [ ] Confirm tool IDs in environment

**Total Estimated Time**: 3 hours 45 minutes

---

## 🔗 Related Documentation

- `Appoointment_Generation.md` - Original implementation guide
- `lib/webhooks/multilingual-webhook-handler.ts` - Existing webhook handler
- `lib/webhooks/tool-call-handlers.ts` - Existing tool call handlers
- `lib/vapi/multilingual-vapi-service.ts` - Assistant creation service
- `lib/templates/template-service.ts` - Template and prompt generation
- `docs/VAPI_INTEGRATION_GUIDE.md` - VAPI integration documentation
- `docs/MULTI_TENANT_VAPI_SETUP.md` - Multi-tenant architecture

---

## 📝 Implementation Notes for Agent

### Code Patterns to Follow

**1. Service Role Client Usage**:
```typescript
const supabase = createServiceRoleClient() // Always use this in tool handlers
```

**2. Error Handling Pattern**:
```typescript
try {
  // Tool logic
  return { success: true, data: result }
} catch (error: any) {
  console.error('❌ Error:', error)
  console.error('❌ Stack:', error.stack)
  return { success: false, error: error.message || String(error) }
}
```

**3. Logging Pattern**:
```typescript
console.log(`✅ Success message`)
console.error(`❌ Error message`)
console.warn(`⚠️ Warning message`)
console.log(`📅 Appointment-related message`)
console.log(`📱 SMS-related message`)
console.log(`🔧 Tool-related message`)
```

**4. Tool Result Format**:
```typescript
// Return to VAPI in this exact format
{
  toolCallId: toolCall.id,
  result: result.success ? JSON.stringify(result.data || {}) : undefined,
  error: result.success ? undefined : result.error
}
```

---

## 🎓 Learning Resources

### VAPI Tool Documentation
- Tool Creation API: https://docs.vapi.ai/api-reference/tools/create
- Tool Messages: https://docs.vapi.ai/tools/function-calling
- Tool Calling Guide: https://docs.vapi.ai/assistants/function-calling

### Codebase References
- Review `lib/webhooks/tool-call-handlers.ts` for existing patterns
- Study `handleAppointmentBooking()` method structure
- Check `handleEmergencyCheck()` for error handling approach
- Examine `multilingual-webhook-handler.ts` for routing logic

---

## 🏁 Next Steps After Implementation

1. **Run Setup Script**: Generate tool IDs in VAPI
2. **Update Environment**: Add tool IDs to .env.local
3. **Restart Application**: Ensure new configuration loads
4. **Create Test Assistant**: Verify tools are referenced correctly
5. **Make Test Call**: Complete full booking workflow
6. **Monitor Logs**: Watch for any errors or issues
7. **Verify Database**: Check appointment record created correctly
8. **Test SMS**: Confirm SMS confirmation received (if integrated)
9. **Test Multi-Tenant**: Create assistants for multiple orgs and test isolation
10. **Document Issues**: Record any problems for troubleshooting guide

---

## ⚡ Quick Start Commands

```bash
# 1. Build and verify no errors
npm run build

# 2. Create VAPI tools (run once)
npm run setup-vapi-tools

# 3. Add tool IDs to .env.local (copy from script output)
# VAPI_CHECK_AVAILABILITY_TOOL_ID=tool_xxx
# VAPI_BOOK_APPOINTMENT_TOOL_ID=tool_yyy
# ... (copy all 4)

# 4. Restart dev server
npm run dev

# 5. Test assistant creation (via API or UI)

# 6. Make test call and book appointment

# 7. Verify in database
# Connect to Supabase and check appointments table
```

---

**PRP Version**: 1.0
**Last Updated**: 2025-10-12
**Confidence Score**: 9/10
**Status**: Ready for Implementation

**Notes**: High confidence due to existing codebase patterns, clear requirements, and well-defined architecture. The 1-point deduction is due to potential need for SMS integration details which may require additional configuration beyond this PRP scope.
