# 🧪 Vapi Appointment Booking - Testing Guide

**Date**: 2025-10-11
**Status**: ✅ **All Fixes Applied - Ready for Testing**

---

## 📋 What Was Fixed

### Issue #1: Database Schema Mismatch ✅ FIXED
- **Problem**: Webhook was using wrong field names that don't exist in database
- **Fix**: Corrected field mapping in `lib/webhooks/tool-call-handlers.ts`
  - `service_type` → `appointment_type`
  - `scheduled_start_time` → `scheduled_date` + `scheduled_time` (split into two fields)
  - Added `duration_minutes` calculation based on service type

### Issue #2: Vapi Response Format ✅ FIXED
- **Problem**: Webhook returned wrong format, Vapi couldn't parse it → showed "No result returned"
- **Fix**: Updated `lib/webhooks/multilingual-webhook-handler.ts` to return Vapi's expected format:
  ```json
  {
    "results": [
      {
        "toolCallId": "call_xxx",
        "result": "{\"appointment_id\":\"123\",...}",
        "error": null
      }
    ]
  }
  ```

### Issue #3: No Error Visibility ✅ FIXED
- **Problem**: Errors were silent, no way to debug
- **Fix**: Added comprehensive logging at every step with detailed error messages

---

## 🧪 How to Test

### Prerequisites
1. Ensure your dev server is running: `npm run dev`
2. Verify Twilio credentials are in `.env.local` (optional - SMS is non-blocking)
3. Have your Vapi AI assistant phone number ready

---

### Test 1: Basic Appointment Booking ✅

**What to Test**: Create an appointment via Vapi phone call

**Steps**:
1. Call your Vapi AI assistant phone number
2. Say: "I'd like to book an appointment"
3. Provide the following information:
   - **Name**: "Lawrence"
   - **Phone**: "+14099952315"
   - **Email**: "law@one.com"
   - **Service type**: "maintenance"
   - **Address**: "4515 Brumny Lane"
   - **Date/Time**: "Next Tuesday at 4pm"

**Expected Results**:

#### A. In Server Logs (Console)
You should see logs like this:
```
📅 Processing appointment booking for organization [org-id] in en
📋 Tool call arguments: {
  "service_type": "maintenance",
  "customer_name": "Lawrence",
  "customer_phone": "+14099952315",
  "customer_email": "law@one.com",
  "address": "4515 Brumny Lane",
  "scheduled_start_time": "2025-10-15T16:00:00",
  "sms_preference": true,
  "preferred_language": "en",
  "cultural_formality": "formal"
}
📅 Creating appointment: maintenance on 2025-10-15 at 16:00:00
✅ Appointment created successfully: [appointment-id]
✅ SMS confirmation sent to +14099952315
✅ Appointment booking completed successfully: [appointment-id]
🔧 Processing 1 tool calls in en
✅ Tool call book_appointment_with_sms: success
```

#### B. In Vapi Dashboard (Tool Response)
You should see:
```json
Tool Response
{
  "results": [
    {
      "toolCallId": "call_xxx",
      "result": "{\"appointment_id\":\"abc-123\",\"appointment_type\":\"maintenance\",\"scheduled_date\":\"2025-10-15\",\"scheduled_time\":\"16:00:00\",\"customer_name\":\"Lawrence\",\"sms_confirmation_sent\":true}"
    }
  ]
}
```

**NOT**:
```
Tool Response
No result returned.  ❌
```

#### C. In Database
Run this query:
```sql
SELECT
  id,
  organization_id,
  customer_name,
  customer_phone,
  customer_email,
  appointment_type,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  service_address,
  language_preference,
  status,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 1;
```

Expected result:
```
id: [uuid]
organization_id: [org-id]
customer_name: Lawrence
customer_phone: +14099952315
customer_email: law@one.com
appointment_type: maintenance
scheduled_date: 2025-10-15
scheduled_time: 16:00:00
duration_minutes: 60
service_address: 4515 Brumny Lane
language_preference: en
status: pending
```

#### D. AI Assistant Response
The AI should say something like:
> "Perfect! I've scheduled your maintenance appointment for Tuesday, October 15th at 4:00 PM at 4515 Brumny Lane. You'll receive a confirmation SMS shortly at +14099952315."

---

### Test 2: Different Service Types ✅

Test that duration is calculated correctly for each service type.

**Test Cases**:

| Service Type | Expected Duration | Test Date/Time |
|--------------|-------------------|----------------|
| emergency    | 120 minutes       | Tomorrow 10am  |
| repair       | 90 minutes        | Wednesday 2pm  |
| maintenance  | 60 minutes        | Friday 4pm     |
| installation | 180 minutes       | Next Monday 9am |

**For Each Service Type**:
1. Call and request appointment
2. Specify the service type
3. Check database: `duration_minutes` should match expected

**Example SQL Check**:
```sql
SELECT appointment_type, duration_minutes, scheduled_date, scheduled_time
FROM appointments
WHERE customer_name = 'Lawrence'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 3: Error Validation ✅

**What to Test**: Verify validation catches missing or invalid data

#### Test 3A: Missing Required Field
1. Call Vapi assistant
2. Start booking appointment
3. **Skip providing phone number** (or any required field)

**Expected**:
- Server logs: `❌ Validation failed: Missing required fields: customer_phone`
- Vapi shows error in tool response
- AI assistant asks for the missing information

#### Test 3B: Invalid Date Format
1. Call Vapi assistant
2. Provide all details but say "garbage date"

**Expected**:
- Server logs: `❌ Invalid date format: garbage date`
- Vapi shows error in tool response
- AI assistant asks for valid date/time

---

### Test 4: SMS Confirmation (Optional) ✅

**What to Test**: SMS is sent but doesn't block appointment creation

**Setup**: Ensure Twilio credentials are in `.env.local`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Test**:
1. Book appointment with valid phone number
2. Check if SMS is received

**Expected**:
- If Twilio configured: SMS received with appointment confirmation
- If Twilio NOT configured: Log shows `⚠️ SMS confirmation failed: [error]` but appointment still created

---

## 🔍 Troubleshooting

### Problem: "No result returned" still appears

**Check server logs for**:

#### A. Validation Error
```
❌ Validation failed: Missing required fields: [field_name]
```
→ **Fix**: Ensure Vapi assistant is providing all required fields

#### B. Database Error
```
❌ Database error creating appointment: [error message]
```
→ **Fix**: Check database schema, RLS policies, or constraints

#### C. Date Parsing Error
```
❌ Invalid date format: [date]
```
→ **Fix**: Ensure Vapi assistant is sending ISO 8601 datetime format

---

### Problem: Appointment created but user not notified

**Symptoms**:
- ✅ Database has appointment record
- ✅ Server logs show success
- ❌ AI doesn't tell user

**Fix**: Update Vapi assistant's system prompt:
```
When you successfully book an appointment, tell the customer:
"Great! I've booked your [service_type] appointment for [date] at [time] at [address].
You'll receive a confirmation SMS shortly at [phone]."
```

---

### Problem: Wrong duration_minutes in database

**Check**:
1. What service type was requested?
2. What duration is in database?

**Expected Mappings**:
- emergency → 120 minutes
- repair → 90 minutes
- maintenance → 60 minutes
- installation → 180 minutes
- default → 60 minutes

**Fix**: If duration is wrong, check `calculateDuration()` method in `lib/webhooks/tool-call-handlers.ts:400-414`

---

## 📊 Success Criteria

**All of these must be true**:
1. ✅ Server logs show "Appointment created successfully: [id]"
2. ✅ Vapi shows tool response with `appointment_id` and other details
3. ✅ Database has new appointment record with ALL correct fields
4. ✅ AI assistant tells user "Appointment booked successfully"
5. ✅ No "No result returned" message in Vapi

---

## 🔧 Quick Reference

### Files Modified
1. `lib/webhooks/tool-call-handlers.ts` (lines 131-261, 400-414)
2. `lib/webhooks/multilingual-webhook-handler.ts` (lines 216-278)

### Database Schema
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  appointment_type VARCHAR(50) NOT NULL,  -- ✅ NOT "service_type"
  scheduled_date DATE NOT NULL,           -- ✅ Separate from time
  scheduled_time TIME NOT NULL,           -- ✅ Separate from date
  duration_minutes INTEGER DEFAULT 60,    -- ✅ Required field
  service_address TEXT,
  language_preference VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Vapi Tool Definition
Ensure your Vapi assistant has this tool defined:
```json
{
  "name": "book_appointment_with_sms",
  "description": "Book an appointment and send SMS confirmation",
  "parameters": {
    "type": "object",
    "properties": {
      "service_type": {
        "type": "string",
        "enum": ["emergency", "repair", "maintenance", "installation"],
        "description": "Type of service requested"
      },
      "scheduled_start_time": {
        "type": "string",
        "format": "date-time",
        "description": "ISO 8601 datetime for appointment (e.g., 2025-10-15T16:00:00)"
      },
      "customer_name": {
        "type": "string",
        "description": "Customer's full name"
      },
      "customer_phone": {
        "type": "string",
        "description": "Customer's phone number in E.164 format (e.g., +14099952315)"
      },
      "customer_email": {
        "type": "string",
        "format": "email",
        "description": "Customer's email address (optional)"
      },
      "address": {
        "type": "string",
        "description": "Service address"
      },
      "preferred_language": {
        "type": "string",
        "enum": ["en", "es"],
        "default": "en",
        "description": "Customer's preferred language"
      },
      "sms_preference": {
        "type": "boolean",
        "default": true,
        "description": "Whether to send SMS confirmation"
      },
      "cultural_formality": {
        "type": "string",
        "enum": ["formal", "informal"],
        "default": "formal",
        "description": "Cultural formality preference"
      }
    },
    "required": [
      "service_type",
      "scheduled_start_time",
      "customer_name",
      "customer_phone",
      "address"
    ]
  }
}
```

---

## 📝 Testing Checklist

Use this checklist to verify everything works:

- [ ] Called Vapi assistant and requested appointment
- [ ] Provided all required information (name, phone, email, service type, address, date/time)
- [ ] Server logs show detailed appointment creation process
- [ ] Vapi dashboard shows tool response with appointment details (NOT "No result returned")
- [ ] Database has new appointment record with correct fields:
  - [ ] `appointment_type` populated
  - [ ] `scheduled_date` is valid DATE
  - [ ] `scheduled_time` is valid TIME
  - [ ] `duration_minutes` matches service type
  - [ ] `customer_name`, `customer_phone`, `customer_email` correct
  - [ ] `service_address` populated
  - [ ] `status` is 'pending'
- [ ] AI assistant confirmed booking to user
- [ ] Tested all 4 service types (emergency, repair, maintenance, installation)
- [ ] Tested validation: missing fields show error
- [ ] Tested validation: invalid date shows error
- [ ] SMS sent (if Twilio configured) or graceful failure logged

---

## ✅ Summary

**What's Fixed**:
- ✅ Database field mapping corrected
- ✅ Vapi response format corrected
- ✅ Date/time parsing implemented
- ✅ Duration calculation added
- ✅ Comprehensive error logging added
- ✅ Validation for all required fields

**What to Do**:
1. Make a test phone call
2. Watch server logs
3. Check Vapi dashboard
4. Verify database record
5. Report any issues with log excerpts

**Status**: Ready for testing! 🚀
