# Why You're Seeing "Vapi-SIP" Instead of a Real Phone Number

## TL;DR

**What's happening:** Vapi's API is returning a `sipUri` field instead of a traditional `number` field, and our code was only saving "Vapi-SIP" as a placeholder.

**What you should get:** A real US phone number like `+15551234567` that customers can call.

**The fix:** Updated code now properly extracts and displays the actual phone number from Vapi's response.

---

## 📱 Understanding Vapi Phone Number Types

### What Vapi's FREE Numbers Should Provide

According to Vapi's official documentation:

> **Free US national phone numbers**
> - Up to 10 FREE phone numbers per account
> - Traditional US phone numbers (e.g., +15551234567)
> - Random number with user-selected area code
> - Takes ~2 minutes to activate

### What the API Actually Returns

When you call `POST /phone-number` with `provider: "vapi"`, the response includes:

```json
{
  "id": "phone_abc123xyz",
  "provider": "vapi",
  "number": "+15551234567",      // ← This is what you want!
  "sipUri": "sip:123@vapi.ai",   // ← Technical routing URI
  "status": "active",
  "assistantId": "asst_xyz789",
  "orgId": "org_456def",
  "createdAt": "2025-10-10T21:44:58Z",
  "updatedAt": "2025-10-10T21:44:58Z"
}
```

**Both fields are provided:**
- `number`: The actual phone number customers call
- `sipUri`: Internal SIP routing (used by Vapi infrastructure)

---

## 🔍 Why You Saw "Vapi-SIP"

### The Original Code Issue

In `lib/vapi/multilingual-vapi-service.ts`, the code was:

```typescript
// ❌ OLD CODE
const displayPhoneNumber = phoneNumber.number || 'Vapi-SIP'
await this.persistPhoneNumber(params.assistantId, displayPhoneNumber, 'vapi')
```

**Problem:** If `phoneNumber.number` was `undefined` or empty, it defaulted to the hardcoded string `"Vapi-SIP"`.

### Why This Might Happen

1. **Vapi API Response Variation**
   - Some Vapi responses might prioritize `sipUri` over `number`
   - The `number` field might be in a different part of the response
   - API might be returning it but our code wasn't logging it

2. **Activation Delay**
   - Vapi docs say numbers take "a couple minutes" to activate
   - The `number` field might be populated AFTER initial creation
   - Initial response might only have `sipUri` while PSTN number provisions

3. **Account Configuration**
   - Some Vapi account types might only get SIP URIs
   - Free tier limitations might affect number type
   - Geographic restrictions might apply

---

## ✅ The Fix

### What Changed

```typescript
// ✅ NEW CODE
const actualPhoneNumber: string | undefined = phoneNumber.number
const sipUri: string | undefined = phoneNumber.sipUri
const phoneNumberId: string = phoneNumber.id

// Prefer real phone number, fallback to SIP URI, last resort to ID
const displayPhoneNumber = actualPhoneNumber || sipUri || `Vapi-${phoneNumberId.substring(0, 8)}`

// Log the full API response for debugging
console.log('📞 Full API Response:', JSON.stringify(phoneNumber, null, 2))
console.log('📞 Phone Number:', phoneNumber.number || 'Not provided')
console.log('📞 SIP URI:', phoneNumber.sipUri || 'Not provided')

// Warn if no traditional number provided
if (!actualPhoneNumber) {
  console.warn('⚠️  WARNING: Vapi returned SIP URI but no traditional phone number')
  console.warn('   Check Vapi Dashboard: https://dashboard.vapi.ai/phone-numbers')
}
```

### Benefits

✅ **Better logging** - See exactly what Vapi returns
✅ **Proper fallback** - Uses actual SIP URI instead of placeholder
✅ **Clear warnings** - Know when something unusual happens
✅ **Debugging info** - Full API response logged for troubleshooting

---

## 📞 How Customers Can Call Your Assistant

### Scenario 1: You Have a Real Phone Number ✅

**What you see in database:** `+15551234567`

**How customers call:**
```
Dial: +1-555-123-4567
→ Connects to your Vapi assistant
→ Works like a normal phone call
```

**This is the expected/ideal scenario.**

### Scenario 2: You Only Have a SIP URI

**What you see in database:** `sip:abc123@vapi.ai`

**How customers call:**
- **Option A:** Use a SIP client app (like Zoiper, Linphone)
- **Option B:** Check Vapi Dashboard for an assigned phone number
- **Option C:** Vapi might assign a phone number after activation completes

**This is unusual but technically works.**

### Scenario 3: You See "Vapi-SIP" Placeholder (Old Behavior)

**What you see in database:** `Vapi-SIP`

**Problem:** This is just a placeholder, not a real phone number or SIP URI

**Solution:**
1. Check console logs for the actual phone number
2. Look up the assistant in Vapi Dashboard
3. The real number exists in Vapi, just not saved to your database

---

## 🔧 Troubleshooting

### Step 1: Check Console Logs

When you create a new assistant, look for:

```
✅ SUCCESS! FREE Vapi phone number created!
📞 Full API Response: { ... full JSON response ... }
📞 Phone Number: +15551234567  ← This is what you want!
📞 SIP URI: sip:123@vapi.ai
```

**What to look for:**
- Is `Phone Number` showing a real number?
- Or is it showing "Not provided"?

### Step 2: Check Vapi Dashboard

1. Go to: https://dashboard.vapi.ai/phone-numbers
2. Find your recently created phone number
3. Look for the "Number" column
4. You should see something like `+1 (555) 123-4567`

### Step 3: Check Database

```sql
SELECT
  vapi_assistant_id,
  vapi_phone_number,
  phone_provider,
  created_at
FROM vapi_assistants
ORDER BY created_at DESC
LIMIT 5;
```

**What to expect:**
- `vapi_phone_number`: Should be `+15551234567` or similar
- `phone_provider`: Should be `vapi`

### Step 4: If You Still See "Vapi-SIP"

This means the Vapi API is NOT returning the `number` field. Possible reasons:

1. **Activation delay** - Wait 2-5 minutes and check Dashboard
2. **Account limitation** - Your Vapi account might be SIP-only
3. **API change** - Vapi might have changed their response format
4. **Geographic restriction** - Some regions might only get SIP

**Solution:** Contact Vapi support or manually assign a number via Dashboard.

---

## 🎯 Expected Behavior After Fix

### When Creating a New Assistant

**Console Output:**
```
📞 Starting OPTIMIZED phone number provisioning
   Organization: org-123abc
   Assistant: asst-456def
   Strategy: FREE Vapi numbers → Twilio → Manual

📊 Vapi Free Number Usage:
   Used: 3/10 (30%)
   Remaining: 7

📞 STRATEGY 1: Attempting to create FREE Vapi phone number...
💡 This is FREE, instant, and requires zero configuration!

📞 Creating FREE Vapi number with config: {
  "provider": "vapi",
  "assistantId": "asst-456def",
  "name": "Assistant asst-456"
}

✅ SUCCESS! FREE Vapi phone number created!
📞 Full API Response: {
  "id": "phone_abc123",
  "provider": "vapi",
  "number": "+15551234567",      ← Real phone number!
  "sipUri": "sip:123@vapi.ai",
  "status": "active",
  "assistantId": "asst-456def",
  ...
}
📞 Phone ID: phone_abc123
📞 Phone Number: +15551234567    ← What customers will call!
📞 SIP URI: sip:123@vapi.ai
💰 Cost: $0.00 (FREE)
⏱️  Activation: ~2 minutes

🎉 Phone provisioning complete - using FREE Vapi number!
📱 Assigned Number: +15551234567
```

**Database:**
```
vapi_assistant_id: asst-456def
vapi_phone_number: +15551234567   ← Real number saved!
phone_provider: vapi
```

**Vapi Dashboard:**
- You'll see the number listed as `+1 (555) 123-4567`
- Status: Active (or Activating)
- Assigned to: Your assistant name

**Customer Experience:**
- Customer dials: `+1-555-123-4567`
- Call connects to your AI assistant
- Works like a normal phone call

---

## 🚀 What If You Need More Than 10 Numbers?

### The Scaling Path

1. **Customers 1-10:** FREE Vapi phone numbers (current implementation)
2. **Customers 11+:** Twilio phone numbers ($1-2/month each)
3. **See:** `docs/PHONE_NUMBER_SCALING_GUIDE.md` for full details

### Twilio Advantages

- **Unlimited numbers** - No 10-number limit
- **International numbers** - Not just US
- **SMS capabilities** - Can send/receive texts
- **Custom area codes** - Choose specific regions
- **Better control** - More configuration options

---

## 📚 References

- **Vapi Phone Calling Docs:** https://docs.vapi.ai/phone-calling
- **Vapi Free Numbers:** https://docs.vapi.ai/free-telephony
- **Vapi API Reference:** https://docs.vapi.ai/api-reference/phone-numbers/create
- **Your Local Docs:** `vapi_documentation.md` (lines 25048-25090)
- **Scaling Guide:** `docs/PHONE_NUMBER_SCALING_GUIDE.md`

---

## ✅ Summary

**Before Fix:**
- Saw: `"Vapi-SIP"` in database
- Problem: Placeholder string, not a real number
- Customers: Couldn't call the assistant

**After Fix:**
- See: `"+15551234567"` (or similar)
- Reality: Actual US phone number
- Customers: Can call normally

**If you STILL see SIP URIs only:**
- Check Vapi Dashboard manually
- Contact Vapi support
- Consider using Twilio numbers instead
- The assistant still works, just needs special SIP client to call

---

**Next Step:** Create a new assistant and check the console logs. You should now see the full API response with the actual phone number! 🎉
