# 🔧 Vapi Webhook Appointment Scheduling - Fixed

**Date**: 2025-10-11
**Status**: ✅ **FIXED AND READY FOR TESTING**

---

## 🎯 Problem Summary

**Issue**: Appointments scheduled via Vapi AI phone calls were failing silently with no error messages shown to users.

**Root Cause**: Schema mismatch between Vapi webhook handler and database schema.

---

## 🔍 Root Causes Identified

### **1. Wrong Field Names in Database Insert**

The `tool-call-handlers.ts` file was using incorrect field names that don't exist in the database:

| ❌ **Wrong (Old)**       | ✅ **Correct (Fixed)**     | **Why It Failed**                        |
|--------------------------|----------------------------|------------------------------------------|
| `service_type`           | `appointment_type`         | Column doesn't exist in DB               |
| `scheduled_start_time`   | `scheduled_date` + `scheduled_time` | DB has separate date/time columns |
| `scheduled_end_time`     | `duration_minutes`         | DB doesn't store end time, uses duration |

### **2. Missing Required Fields**

The database requires these NOT NULL fields:
- ✅ `organization_id` (was provided)
- ✅ `customer_name` (was provided)
- ✅ `customer_phone` (was provided)
- ❌ `appointment_type` (was sending as `service_type`)
- ❌ `scheduled_date` (was sending as `scheduled_start_time`)
- ❌ `scheduled_time` (was sending as `scheduled_start_time`)

### **3. No Error Logging**

- Errors were caught but not logged with details
- No stack traces
- No validation of input data
- Silent failures with no visibility

---

## ✅ Fixes Applied

### **Fix #1: Corrected Field Mapping**

**File**: `lib/webhooks/tool-call-handlers.ts` (lines 180-229)

**Changes**:
```typescript
// OLD (BROKEN)
const { data: appointment, error } = await supabase
  .from('appointments')
  .insert({
    organization_id: customerId,
    customer_name: args.customer_name,
    customer_phone: args.customer_phone,
    customer_email: args.customer_email,
    service_type: args.service_type,              // ❌ WRONG
    scheduled_start_time: args.scheduled_start_time,  // ❌ WRONG
    scheduled_end_time: this.calculateEndTime(...),   // ❌ WRONG
    status: 'pending',
    notes: `Language: ${language}, Formality: ${args.cultural_formality}`
  })

// NEW (FIXED)
// Parse scheduled_start_time into date and time components
const scheduledDateTime = new Date(args.scheduled_start_time)
const scheduled_date = scheduledDateTime.toISOString().split('T')[0] // YYYY-MM-DD
const scheduled_time = scheduledDateTime.toTimeString().split(' ')[0] // HH:MM:SS

const { data: appointment, error } = await supabase
  .from('appointments')
  .insert({
    organization_id: customerId,
    customer_name: args.customer_name,
    customer_phone: args.customer_phone,
    customer_email: args.customer_email,
    service_address: args.address,
    appointment_type: args.service_type,     // ✅ FIXED: renamed field
    scheduled_date: scheduled_date,          // ✅ FIXED: separate date
    scheduled_time: scheduled_time,          // ✅ FIXED: separate time
    duration_minutes: duration_minutes,      // ✅ ADDED: calculated from service type
    language_preference: args.preferred_language,
    status: 'pending',
    notes: `Language: ${language}, Formality: ${args.cultural_formality}`
  })
```

### **Fix #2: Added Duration Calculation**

**New Method**: `calculateDuration()` (lines 365-382)

```typescript
private calculateDuration(serviceType: string): number {
  switch (serviceType.toLowerCase()) {
    case 'emergency':
      return 120  // 2 hours
    case 'repair':
      return 90   // 1.5 hours
    case 'maintenance':
      return 60   // 1 hour
    case 'installation':
      return 180  // 3 hours
    default:
      return 60   // Default 1 hour
  }
}
```

### **Fix #3: Enhanced Error Handling & Logging**

**File**: `lib/webhooks/tool-call-handlers.ts` (lines 131-207)

**Improvements**:
1. **Detailed logging** of all incoming data
2. **Field-by-field validation** with specific error messages
3. **Date format validation** before database insert
4. **Stack trace logging** for debugging
5. **SMS failure handling** (doesn't block appointment creation)

**New Logging**:
```typescript
console.log(`📅 Processing appointment booking for organization ${customerId} in ${language}`)
console.log(`📋 Tool call arguments:`, JSON.stringify(toolCall.function.arguments, null, 2))

// ... validation ...

console.log(`📅 Creating appointment: ${args.service_type} on ${scheduled_date} at ${scheduled_time}`)

// ... create appointment ...

console.log(`✅ Appointment created successfully: ${appointment.id}`)
console.log(`✅ Appointment booking completed successfully: ${appointment.id}`)
```

**Error Handling**:
```typescript
// Detailed validation
const missingFields: string[] = []
if (!args.service_type) missingFields.push('service_type')
if (!args.scheduled_start_time) missingFields.push('scheduled_start_time')
if (!args.customer_name) missingFields.push('customer_name')
if (!args.customer_phone) missingFields.push('customer_phone')

if (missingFields.length > 0) {
  const errorMsg = `Missing required fields: ${missingFields.join(', ')}`
  console.error(`❌ Validation failed: ${errorMsg}`)
  return { success: false, error: errorMsg }
}

// Date validation
const scheduledDate = new Date(args.scheduled_start_time)
if (isNaN(scheduledDate.getTime())) {
  const errorMsg = `Invalid date format: ${args.scheduled_start_time}`
  console.error(`❌ ${errorMsg}`)
  return { success: false, error: errorMsg }
}
```

---

## 🧪 Testing Checklist

### **Before Testing**
- [x] Schema mismatch identified and documented
- [x] Field names corrected in code
- [x] Date/time parsing implemented
- [x] Duration calculation added
- [x] Error logging enhanced

### **Testing Steps**

#### **1. Test via Vapi Phone Call**
```
1. Call your Vapi AI assistant phone number
2. Request to schedule an appointment
3. Provide:
   - Service type (e.g., "emergency repair")
   - Date and time
   - Name and phone number
   - Address
4. Check server logs for:
   ✅ "📅 Processing appointment booking..."
   ✅ "📅 Creating appointment: emergency on YYYY-MM-DD at HH:MM:SS"
   ✅ "✅ Appointment created successfully: [id]"
   ✅ "✅ Appointment booking completed successfully: [id]"
```

#### **2. Verify in Database**
```sql
SELECT
  id,
  organization_id,
  customer_name,
  customer_phone,
  appointment_type,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  status,
  created_at
FROM appointments
ORDER BY created_at DESC
LIMIT 5;
```

Expected results:
- ✅ `appointment_type` has value (not null)
- ✅ `scheduled_date` is a valid date (YYYY-MM-DD)
- ✅ `scheduled_time` is a valid time (HH:MM:SS)
- ✅ `duration_minutes` is set based on service type
- ✅ `status` is 'pending'

#### **3. Check Logs for Errors**
```bash
# Check API logs
npm run dev

# Look for these patterns:
✅ "📅 Processing appointment booking..."
✅ "📅 Creating appointment..."
✅ "✅ Appointment created successfully..."

# OR error patterns:
❌ "❌ Validation failed..."
❌ "❌ Database error creating appointment..."
❌ "❌ Error handling appointment booking..."
```

#### **4. Test Error Scenarios**

**Test Missing Fields**:
- Call and skip providing name → Should return error message
- Skip phone number → Should return validation error
- Skip service type → Should return validation error

**Test Invalid Data**:
- Provide invalid date format → Should validate and reject
- Provide invalid phone number → Should handle gracefully

---

## 📊 What Changed - Summary

| Component | Before | After |
|-----------|--------|-------|
| **Field mapping** | Wrong names → DB errors | ✅ Correct names match DB |
| **Date handling** | Single datetime field | ✅ Separate date + time |
| **Duration** | Missing | ✅ Calculated from service type |
| **Error logging** | Silent failures | ✅ Detailed logs with stack traces |
| **Validation** | Basic checks | ✅ Field-by-field validation |
| **SMS handling** | Could block appointment | ✅ Non-blocking, graceful failure |

---

## 🔧 Files Modified

1. **`lib/webhooks/tool-call-handlers.ts`**
   - Lines 131-207: Enhanced `handleAppointmentBooking()`
   - Lines 180-229: Fixed `createAppointment()`
   - Lines 365-382: Added `calculateDuration()`
   - Lines 384-393: Updated `calculateEndTime()` (deprecated)

2. **`docs/APPOINTMENT_VAPI_WEBHOOK_FIX.md`** (NEW)
   - This documentation file

---

## 🚀 Deployment Notes

### **No Breaking Changes**
- Manual appointment creation (via UI) is **unchanged**
- Only Vapi webhook path was fixed
- Backward compatible with existing appointments

### **Environment Variables Required**
```env
# Twilio credentials (for SMS confirmations)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### **Database Schema** (No Changes Required)
The appointments table schema is already correct. No migrations needed.

---

## 🐛 Troubleshooting

### **Appointments Still Not Creating**

**Check 1: Verify webhook is being called**
```bash
# Look for this in logs:
"📅 Processing appointment booking for organization..."
```
If not appearing → Vapi webhook not configured correctly

**Check 2: Check for validation errors**
```bash
# Look for:
"❌ Validation failed: Missing required fields..."
"❌ Invalid date format..."
```
If appearing → Vapi assistant not providing all required data

**Check 3: Check database errors**
```bash
# Look for:
"❌ Database error creating appointment: [error message]"
```
If appearing → Could be RLS policy or constraint issue

**Check 4: Verify organization exists**
```sql
SELECT id, name FROM organizations WHERE id = 'your-org-id';
```
If no results → Organization ID mismatch

### **SMS Not Sending**

This is expected and **non-critical**. SMS failures don't block appointment creation.

Check logs for:
```
"⚠️ SMS confirmation failed: [error message]"
```

Common reasons:
- Twilio credentials not configured
- Invalid phone number format
- Twilio account not active

---

## ✅ Success Criteria

**Appointment creation is working when:**
1. ✅ Vapi phone call → appointment request → database record created
2. ✅ Logs show successful creation messages
3. ✅ Database has correct field values
4. ✅ No validation errors in logs
5. ✅ Manual appointments still work (unchanged)

---

## 📞 Next Steps

1. **Test via Vapi phone call** (primary test case)
2. **Monitor logs** during first test
3. **Verify database** records after successful test
4. **Report any errors** with log excerpts

---

**Status**: ✅ **Ready for testing**
**Confidence**: High - Root cause identified and fixed with detailed logging

All appointment scheduling via Vapi webhooks should now work correctly!
