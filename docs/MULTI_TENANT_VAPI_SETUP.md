# 🏗️ Multi-Tenant Vapi Webhook Setup Guide

**Date**: 2025-10-12
**Status**: ✅ **READY FOR CONFIGURATION**

---

## 🎯 The Solution: Unified Webhook Endpoint

Instead of using different URLs for each organization, we use **ONE webhook URL** and identify the organization from the call data.

---

## 📋 How It Works

### Old Approach (❌ Doesn't Scale):
```
Organization A: https://your-domain.com/api/webhooks/vapi/org-a-id
Organization B: https://your-domain.com/api/webhooks/vapi/org-b-id
Organization C: https://your-domain.com/api/webhooks/vapi/org-c-id
```

### New Approach (✅ Multi-Tenant):
```
ALL Organizations: https://your-domain.com/api/webhooks/vapi
```

**How we identify the organization:**
1. Extract `assistant_id` from the webhook payload
2. Look up which organization owns that assistant in `customer_configurations` table
3. Process the webhook for that organization

---

## 🗄️ Database Setup

### Step 1: Verify Your Schema

You already have the right tables! Verify:

```sql
-- Check customer_configurations table
SELECT
  id,
  organization_id,
  vapi_assistant_id,
  vapi_phone_number,
  is_active
FROM customer_configurations
LIMIT 5;
```

### Step 2: Create Configuration for Each Organization

For each organization that uses Vapi, create a record:

```sql
INSERT INTO customer_configurations (
  organization_id,
  vapi_assistant_id,        -- The Vapi assistant ID
  vapi_phone_number,        -- Optional: Vapi phone number
  primary_language,
  is_active
) VALUES (
  'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2',  -- Your organization ID
  'YOUR_VAPI_ASSISTANT_ID_HERE',            -- Get this from Vapi dashboard
  '+1234567890',                             -- Optional
  'en',
  true
);
```

---

## 🔧 Setup Steps

### Step 1: Get Your Vapi Assistant ID

1. Go to [Vapi Dashboard](https://dashboard.vapi.ai/)
2. Click on your assistant
3. Copy the **Assistant ID** (looks like: `asst_xxxxxxxxxxxxx`)

### Step 2: Add Configuration to Database

Run this SQL (replace with your actual values):

```sql
INSERT INTO customer_configurations (
  organization_id,
  vapi_assistant_id,
  primary_language,
  secondary_languages,
  sms_preferences,
  custom_config,
  is_active
) VALUES (
  'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2',  -- Replace with your org ID
  'asst_xxxxxxxxxxxxx',                     -- Replace with your assistant ID from Vapi
  'en',
  ARRAY['es'],
  '{"enabled": true, "confirmation": true, "reminder": true}'::jsonb,
  '{}'::jsonb,
  true
);
```

### Step 3: Update ngrok (if testing locally)

Make sure ngrok is forwarding to port 3001:

```bash
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://xxxx-xxx-xxx.ngrok-free.app`)

### Step 4: Configure Vapi Server URL

1. Go to Vapi Dashboard → Your Assistant → Settings
2. Find **Server URL** field
3. Enter:
   ```
   https://your-ngrok-url.ngrok-free.app/api/webhooks/vapi
   ```
   OR for production:
   ```
   https://your-domain.com/api/webhooks/vapi
   ```

4. **Important**: NO organization ID in the URL!

---

## 🧪 Testing

### Test 1: Check Endpoint is Active

```bash
curl https://your-ngrok-url.ngrok-free.app/api/webhooks/vapi
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vapi webhook endpoint is active",
  "multiTenant": true,
  "identificationMethods": [
    "assistant_id (from customer_configurations.vapi_assistant_id)",
    "phone_number (from customer_configurations.vapi_phone_number)",
    "call_id (from call_logs.vapi_call_id)"
  ]
}
```

### Test 2: Make a Phone Call

1. Call your Vapi assistant phone number
2. Book an appointment
3. Watch your server logs

**Expected Server Logs:**
```
📞 Received webhook for call: call_xxxxxxxxxxxxx
📱 Phone number: +1234567890
🤖 Assistant ID: asst_xxxxxxxxxxxxx
🔍 Looking up organization by assistant ID: asst_xxxxxxxxxxxxx
✅ Found organization by assistant ID: d91e4aa4-914a-4d76-b5b7-2ee26e09b2a2
✅ Identified organization: d91e4aa4-914a-4d76-b5b7-2ee26e09b2a2
📥 Raw webhook data: {"message": {"type": "tool-calls", ...}}
🔧 Extracted 1 tool calls from webhook
📅 Processing appointment booking...
✅ Appointment created successfully
```

### Test 3: Verify Database

```sql
SELECT * FROM appointments
WHERE organization_id = 'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔐 How Organization Identification Works

The webhook handler tries **3 methods** in order:

### Method 1: Assistant ID (Primary) ✅
```typescript
// Extract from webhook
const assistantId = webhookData.message?.assistant?.id

// Lookup organization
SELECT organization_id
FROM customer_configurations
WHERE vapi_assistant_id = assistantId
  AND is_active = true
```

### Method 2: Phone Number (Backup) ✅
```typescript
// Extract from webhook
const phoneNumber = webhookData.message?.phoneNumber

// Lookup organization
SELECT organization_id
FROM customer_configurations
WHERE vapi_phone_number = phoneNumber
  AND is_active = true
```

### Method 3: Call ID (For Follow-up Webhooks) ✅
```typescript
// Extract from webhook
const callId = webhookData.message?.call?.id

// Lookup organization from existing call log
SELECT organization_id
FROM call_logs
WHERE vapi_call_id = callId
```

---

## 📊 Multi-Organization Example

### Organization A: HVAC Company
```sql
INSERT INTO customer_configurations (
  organization_id,
  vapi_assistant_id,
  primary_language,
  is_active
) VALUES (
  'd91e4aa4-914a-4d76-b5b7-2ee26e09b2a2',
  'asst_hvac_company_assistant',
  'en',
  true
);
```

### Organization B: Plumbing Company
```sql
INSERT INTO customer_configurations (
  organization_id,
  vapi_assistant_id,
  primary_language,
  is_active
) VALUES (
  '6d593c7a-b00f-47be-8f77-cc4d1231f706',
  'asst_plumbing_company_assistant',
  'es',
  true
);
```

### Both Use Same Webhook URL!
```
https://your-domain.com/api/webhooks/vapi
```

When a call comes in:
- HVAC call → Assistant `asst_hvac_company_assistant` → Routes to Org A
- Plumbing call → Assistant `asst_plumbing_company_assistant` → Routes to Org B

---

## ✅ Advantages of This Approach

1. **Scalable**: Add unlimited organizations without changing URLs
2. **Clean**: One webhook URL for all organizations
3. **Flexible**: Multiple identification methods (assistant ID, phone, call ID)
4. **Database-Driven**: Easy to add/remove organizations via database
5. **No URL Changes**: Organizations can change assistants without breaking webhooks

---

## 🚨 Important Notes

### For New Organizations:

1. Create organization in `organizations` table
2. Create Vapi assistant in Vapi dashboard
3. Add configuration to `customer_configurations` with `vapi_assistant_id`
4. Set Vapi Server URL to unified endpoint
5. Done! Webhooks will automatically route correctly

### For Existing Assistants:

If you already have Vapi assistants set up:
1. Find your assistant IDs in Vapi dashboard
2. Update `customer_configurations` table with those IDs
3. Update Server URL in Vapi to the unified endpoint
4. Test with a phone call

---

## 🔧 Troubleshooting

### Issue: "Organization not found for this assistant"

**Cause**: No matching record in `customer_configurations`

**Fix**:
```sql
-- Check what's in your configurations
SELECT * FROM customer_configurations WHERE is_active = true;

-- Add missing configuration
INSERT INTO customer_configurations (
  organization_id,
  vapi_assistant_id,
  primary_language,
  is_active
) VALUES (
  'your-org-id',
  'your-assistant-id-from-vapi',
  'en',
  true
);
```

### Issue: Still getting 404 errors

**Cause**: ngrok not pointing to correct port OR server not running

**Fix**:
1. Check server is running on port 3001
2. Restart ngrok: `ngrok http 3001`
3. Update Vapi Server URL with new ngrok URL

### Issue: Webhook works but appointment not created

**Cause**: Database field mapping or validation errors

**Fix**: Check server logs for specific error messages

---

## 📝 Quick Start Checklist

- [ ] Server running on port 3001: `npm run dev`
- [ ] ngrok running: `ngrok http 3001`
- [ ] Got Vapi assistant ID from dashboard
- [ ] Added configuration to `customer_configurations` table
- [ ] Updated Vapi Server URL to: `https://your-ngrok-url.ngrok-free.app/api/webhooks/vapi`
- [ ] Made test call
- [ ] Verified appointment created in database

---

## 🎯 Next Steps

1. **Set up your first organization** with the SQL above
2. **Update Vapi Server URL** to the unified endpoint
3. **Make a test call** and verify it works
4. **Add more organizations** as needed - just insert into `customer_configurations`!

---

**Status**: ✅ Code is ready, just needs configuration!
