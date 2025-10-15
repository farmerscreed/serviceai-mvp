# Assistant Deletion Process

## Overview

When an assistant is deleted in the app, the system performs a **complete cleanup** of all associated resources in both Vapi and your database.

---

## 🗑️ Complete Deletion Flow

### What Gets Deleted

```
1. Phone Number (from Vapi)
   ↓
2. Assistant (from Vapi)
   ↓
3. Phone Assignment Record (from phone_number_assignments table)
   ↓
4. Assistant Record (from vapi_assistants table)
```

---

## 📋 Step-by-Step Process

### Step 1: Authorization & Verification

```typescript
// Verify user has permission to delete
- Check user is authenticated
- Verify user belongs to assistant's organization
- Get assistant details (ID, phone number, etc.)
```

### Step 2: Delete Phone Number from Vapi

**Why phone first?**
- Phone numbers are a limited resource (10 free max)
- Deleting phone frees up capacity for new assistants
- Phone number ID is retrieved from `phone_number_assignments` table

```typescript
// Delete phone number via Vapi API
DELETE https://api.vapi.ai/phone-number/{phoneNumberId}
Authorization: Bearer {VAPI_API_KEY}

// Response: 200 OK (phone deleted)
```

**What happens:**
- ✅ Phone number removed from Vapi
- ✅ Number becomes available for reuse
- ✅ Frees up 1 slot in your 10 free numbers

### Step 3: Delete Assistant from Vapi

```typescript
// Delete assistant via Vapi API
DELETE https://api.vapi.ai/assistant/{assistantId}
Authorization: Bearer {VAPI_API_KEY}

// Response: 200 OK (assistant deleted)
```

**What happens:**
- ✅ Assistant configuration deleted
- ✅ Call history preserved (in Vapi logs)
- ✅ Associated webhooks stop firing

### Step 4: Clean Up Database Records

**Delete from `phone_number_assignments`:**
```sql
DELETE FROM phone_number_assignments
WHERE vapi_assistant_id = ?
```

**Delete from `vapi_assistants`:**
```sql
DELETE FROM vapi_assistants
WHERE id = ?
```

**What happens:**
- ✅ Phone tracking record removed
- ✅ Assistant configuration removed
- ✅ Database stays clean (no orphaned records)

---

## 🎯 Console Output

### Expected Output on Successful Deletion

```
╔═══════════════════════════════════════════════════════════╗
║  🗑️  DELETING ASSISTANT AND PHONE NUMBER                 ║
╚═══════════════════════════════════════════════════════════╝
   Assistant ID: asst-123abc456def
   Phone Number: +15551234567

📞 Phone Number ID from tracking: phone_abc123xyz
🗑️  Step 1/3: Deleting phone number from Vapi: phone_abc123xyz
✅ Phone number deleted from Vapi
🗑️  Step 2/3: Deleting assistant from Vapi: asst-123abc456def
✅ Assistant deleted from Vapi
🗑️  Step 3/3: Cleaning up database records...
✅ Phone number assignment record deleted
✅ Assistant deleted from vapi_assistants table

╔═══════════════════════════════════════════════════════════╗
║  ✅ DELETION COMPLETE                                     ║
╚═══════════════════════════════════════════════════════════╝
   Phone Number: ✅ Deleted from Vapi
   Assistant: ✅ Deleted from Vapi
   Database: ✅ All records deleted
```

---

## ⚠️ Error Handling

### Scenario 1: Vapi Phone Deletion Fails

```
❌ Vapi phone number deletion error: Phone number not found
   Continuing with assistant deletion...
```

**What happens:**
- Phone deletion fails (maybe already deleted manually)
- Process continues with assistant deletion
- Database still gets cleaned up
- User should manually check Vapi Dashboard

### Scenario 2: Vapi Assistant Deletion Fails

```
❌ Vapi assistant deletion error: Assistant not found
   Continuing with database deletion to prevent orphaned records...
```

**What happens:**
- Assistant deletion fails (maybe already deleted)
- Process continues with database cleanup
- Prevents orphaned database records

### Scenario 3: Phone Number ID Not Found

```
⚠️  Phone number exists but ID not found in tracking table
   Skipping Vapi phone deletion - may need manual cleanup
```

**What happens:**
- Phone number assigned but not tracked in database
- Vapi phone deletion skipped
- Assistant and database cleanup continues
- Manual cleanup needed in Vapi Dashboard

---

## 🔒 Safety Features

### 1. Fail-Safe Deletion

**Even if Vapi deletions fail, database cleanup happens.**

This prevents:
- ❌ Orphaned assistant records
- ❌ Incorrect phone number counts
- ❌ Confusing UI showing deleted assistants

### 2. Authorization Checks

**Users can only delete assistants in their organization.**

Prevents:
- ❌ Unauthorized deletions
- ❌ Cross-organization access
- ❌ Security vulnerabilities

### 3. Audit Trail

**All deletion steps are logged to console.**

Benefits:
- ✅ Troubleshooting failed deletions
- ✅ Understanding what happened
- ✅ Debugging Vapi API issues

---

## 📊 API Response

### Success Response

```json
{
  "success": true,
  "message": "Assistant and phone number deleted successfully",
  "details": {
    "phoneNumberDeleted": true,
    "assistantDeleted": true,
    "databaseCleaned": true
  }
}
```

### Partial Success (Vapi Deletions Failed)

```json
{
  "success": true,
  "message": "Assistant and phone number deleted successfully",
  "details": {
    "phoneNumberDeleted": false,
    "assistantDeleted": false,
    "databaseCleaned": true
  }
}
```

**Note:** Even if Vapi deletions fail, `success: true` is returned because:
- Database is cleaned up (primary goal)
- User can manually clean up Vapi via Dashboard
- Prevents stuck states in the app

---

## 🧪 Testing the Deletion Flow

### Manual Test Steps

1. **Create a test assistant**
   ```bash
   # Via UI or API
   POST /api/assistants/create
   ```

2. **Verify assistant is created**
   ```bash
   # Check Vapi Dashboard
   https://dashboard.vapi.ai/assistants

   # Check database
   SELECT * FROM vapi_assistants ORDER BY created_at DESC LIMIT 1;
   ```

3. **Delete the assistant**
   ```bash
   # Via UI or API
   DELETE /api/assistants/{id}
   ```

4. **Verify complete deletion**
   ```bash
   # Check Vapi Dashboard - assistant should be gone
   # Check database - record should be deleted
   SELECT * FROM vapi_assistants WHERE vapi_assistant_id = 'asst-xxx';

   # Should return 0 rows
   ```

### Automated Test

```typescript
describe('Assistant Deletion', () => {
  it('should delete assistant, phone number, and all database records', async () => {
    // 1. Create assistant
    const assistant = await createTestAssistant()

    // 2. Verify creation
    expect(assistant.vapi_assistant_id).toBeDefined()
    expect(assistant.vapi_phone_number).toBeDefined()

    // 3. Delete assistant
    const response = await fetch(`/api/assistants/${assistant.id}`, {
      method: 'DELETE',
      headers: { /* auth headers */ }
    })

    const result = await response.json()

    // 4. Verify deletion
    expect(result.success).toBe(true)
    expect(result.details.databaseCleaned).toBe(true)

    // 5. Verify database cleanup
    const dbCheck = await supabase
      .from('vapi_assistants')
      .select()
      .eq('id', assistant.id)
      .single()

    expect(dbCheck.data).toBeNull()
  })
})
```

---

## 🚨 Troubleshooting

### Issue: "Phone number not found in tracking table"

**Cause:** Phone number was assigned but not tracked in `phone_number_assignments`

**Solution:**
1. Check Vapi Dashboard for orphaned phone numbers
2. Manually delete the phone number in Vapi
3. Or leave it - next assistant creation will reuse it

### Issue: "Assistant not found" when deleting

**Cause:** Assistant was already deleted from Vapi (manually or via API)

**Impact:** None - database cleanup still happens

**Solution:** No action needed, this is expected behavior

### Issue: Deletion succeeds but assistant still shows in Vapi Dashboard

**Cause:**
- Vapi API call failed silently
- API key issues
- Network timeout

**Solution:**
1. Check console logs for errors
2. Verify `VAPI_API_KEY` is correct
3. Manually delete in Vapi Dashboard
4. Re-run deletion if needed

---

## 💡 Best Practices

### 1. Always Delete Through the App

❌ **Don't:** Delete assistants directly in Vapi Dashboard
✅ **Do:** Use the app's DELETE endpoint

**Why?** App deletion ensures:
- Database stays synchronized
- Phone numbers are properly freed
- Tracking records are cleaned up

### 2. Check Deletion Results

After deletion, verify:
```typescript
// Check the response
const result = await deleteAssistant(id)
if (result.details.phoneNumberDeleted === false) {
  console.warn('Phone number may need manual cleanup')
}
```

### 3. Monitor Free Number Usage

After deletions, check usage:
```typescript
const usage = await vapiService.checkVapiFreeNumberUsage()
// Should show one less number in use
```

---

## 📚 Related Documentation

- **Phone Provisioning:** `docs/PHONE_NUMBER_SCALING_GUIDE.md`
- **Vapi SIP Numbers:** `docs/WHY_VAPI_SIP_EXPLAINED.md`
- **Implementation Summary:** `PHONE_PROVISIONING_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Summary

**Deletion Process:**
1. ✅ Delete phone number from Vapi (frees up capacity)
2. ✅ Delete assistant from Vapi (removes configuration)
3. ✅ Clean up `phone_number_assignments` table
4. ✅ Clean up `vapi_assistants` table

**Safety Features:**
- ✅ Authorization checks
- ✅ Fail-safe database cleanup
- ✅ Detailed logging
- ✅ Graceful error handling

**Benefits:**
- ✅ No orphaned records
- ✅ Phone numbers recycled
- ✅ Clean database
- ✅ Clear audit trail

---

**When you delete an assistant, everything is cleaned up automatically!** 🎉
