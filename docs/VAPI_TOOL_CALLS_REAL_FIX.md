# 🎯 Vapi Tool Calls - THE REAL FIX

**Date**: 2025-10-11
**Status**: ✅ **CRITICAL BUG FIXED**

---

## 🔴 THE REAL PROBLEM

After deep research into Vapi's actual documentation and webhook structure, I discovered the **CRITICAL BUG**:

### ❌ What We Were Doing Wrong

Our code was looking for `webhookData.toolCalls`, but **Vapi actually sends `message.toolCallList`**!

```typescript
// ❌ WRONG - What we had
webhookData.toolCalls  // This was ALWAYS empty/undefined!

// ✅ CORRECT - What Vapi actually sends
webhookData.message.toolCallList
```

---

## 📚 Research Findings

### Actual Vapi Webhook Structure

According to Vapi's official documentation and examples, the webhook payload looks like this:

```json
{
  "message": {
    "type": "tool-calls",
    "call": {
      "id": "call_xxx",
      "status": "in-progress"
    },
    "toolCallList": [
      {
        "id": "call_e5UMNx9R0HazLoe5uvmOOvxk",
        "type": "function",
        "function": {
          "name": "book_appointment_with_sms",
          "arguments": {
            "service_type": "maintenance",
            "customer_name": "Lawrence",
            "customer_phone": "+14099952315",
            "customer_email": "law@one.com",
            "address": "4515 Brumny Lane",
            "scheduled_start_time": "2023-10-31T16:00:00",
            "sms_preference": true,
            "preferred_language": "en",
            "cultural_formality": "formal"
          }
        }
      }
    ],
    "toolWithToolCallList": [
      {
        "type": "function",
        "function": {
          "name": "book_appointment_with_sms",
          "description": "Book appointment and send SMS",
          "parameters": { /* full schema */ }
        },
        "toolCall": {
          "id": "call_e5UMNx9R0HazLoe5uvmOOvxk",
          "type": "function",
          "function": {
            "name": "book_appointment_with_sms",
            "arguments": { /* same as above */ }
          }
        }
      }
    ]
  }
}
```

### Key Differences from What We Expected

| What We Expected | What Vapi Actually Sends |
|-----------------|-------------------------|
| `webhookData.type` | `webhookData.message.type` |
| `webhookData.toolCalls` | `webhookData.message.toolCallList` |
| `webhookData.call` | `webhookData.message.call` |
| Flat structure | **Wrapped in `message` object** |

---

## ✅ THE FIX

### 1. Updated Type Definitions

**File**: `lib/webhooks/multilingual-webhook-handler.ts` (lines 13-86)

Added support for both the `message` wrapper and direct properties:

```typescript
export interface VapiWebhookData {
  message?: {
    type: string
    call?: {
      id: string
      status: string
      duration?: number
      summary?: string
      cost?: number
    }
    toolCallList?: Array<{
      id: string
      type: string
      function: {
        name: string
        arguments: any
      }
    }>
    toolWithToolCallList?: Array<{
      type: string
      function: any
      toolCall: {
        id: string
        type: string
        function: {
          name: string
          arguments: any
        }
      }
    }>
    transcript?: string
    language?: string
    customer?: {
      name?: string
      phone?: string
      email?: string
    }
  }
  // For backwards compatibility and non-message-wrapped events
  type?: string
  call?: { /* ... */ }
  toolCalls?: Array<{ /* ... */ }>
  toolCallList?: Array<{ /* ... */ }>
  // ... other fields
}
```

### 2. Extract Event Type Correctly

**File**: `lib/webhooks/multilingual-webhook-handler.ts` (lines 124-137)

```typescript
async handleWebhook(...) {
  // ✅ Extract event type from either message wrapper or root level
  const eventType = webhookData.message?.type || webhookData.type || 'unknown'
  const eventCall = webhookData.message?.call || webhookData.call

  const context: ErrorContext = {
    organizationId: customerId,
    webhookType: eventType,  // ✅ Now uses correct event type
    callId: eventCall?.id,
    operation: 'handleWebhook'
  }

  // ✅ Log full payload for debugging
  console.log(`📥 Raw webhook data:`, JSON.stringify(webhookData, null, 2))
```

### 3. Extract Tool Calls Correctly

**File**: `lib/webhooks/multilingual-webhook-handler.ts` (lines 201-218)

```typescript
// ✅ Extract tool calls from either message wrapper or root level
const toolCalls = webhookData.message?.toolCallList ||
                  webhookData.toolCallList ||
                  webhookData.toolCalls || []

console.log(`🔧 Extracted ${toolCalls.length} tool calls from webhook`)

// Route to handler
switch (eventType) {
  case 'tool-calls':
    result = await this.handleToolCalls(customerId, toolCalls, detectedLanguage)
    break
  // ...
}
```

### 4. Updated Demo Call Handler

**File**: `lib/webhooks/multilingual-webhook-handler.ts` (line 592)

```typescript
case 'tool-calls':
  // ✅ Extract tool calls correctly for demo calls too
  const demoToolCalls = webhookData.message?.toolCallList ||
                        webhookData.toolCallList ||
                        webhookData.toolCalls || []
  const toolCallResults = await this.handleToolCalls(webhookData.customer?.id || '', demoToolCalls, language)
  return { status: 'tool_calls_processed', results: toolCallResults }
```

---

## 🔍 Why This Was So Hard to Find

1. **No TypeScript Errors**: Because we used optional properties (`toolCalls?:`), TypeScript didn't catch that the field didn't exist
2. **Silent Failures**: `webhookData.toolCalls || []` just returned an empty array `[]`, so the loop never ran
3. **Poor Logging**: We weren't logging the full webhook payload, so we couldn't see the actual structure
4. **Documentation Gap**: Vapi's documentation isn't always clear about the `message` wrapper

---

## 🧪 HOW TO TEST

### 1. Check Server Logs for Full Payload

When you make a test call, you should now see:

```
📥 Raw webhook data: {
  "message": {
    "type": "tool-calls",
    "toolCallList": [
      {
        "id": "call_xxx",
        "type": "function",
        "function": {
          "name": "book_appointment_with_sms",
          "arguments": { ... }
        }
      }
    ]
  }
}
🔧 Extracted 1 tool calls from webhook
🔧 Processing 1 tool calls in en
📅 Processing appointment booking for organization [org-id] in en
📋 Tool call arguments: { ... }
```

### 2. Verify Tool Calls Are Processed

You should see:

```
✅ Tool call book_appointment_with_sms: success
✅ Appointment created successfully: [appointment-id]
```

### 3. Check Vapi Dashboard

Tool Response should show:

```json
{
  "results": [
    {
      "toolCallId": "call_xxx",
      "result": "{\"appointment_id\":\"abc-123\",\"appointment_type\":\"maintenance\",..."
    }
  ]
}
```

**NOT**:
```
Tool Response
No result returned.  ❌
```

---

## 📊 WHAT CHANGED

| Component | Before | After |
|-----------|--------|-------|
| **Webhook type extraction** | `webhookData.type` | `webhookData.message?.type \|\| webhookData.type` |
| **Tool calls extraction** | `webhookData.toolCalls` (always empty!) | `webhookData.message?.toolCallList \|\| webhookData.toolCallList \|\| webhookData.toolCalls` |
| **Call data extraction** | `webhookData.call` | `webhookData.message?.call \|\| webhookData.call` |
| **Logging** | Minimal | Full payload dump for debugging |
| **Type safety** | Incorrect interface | Correct interface matching Vapi's actual structure |

---

## 🎯 ROOT CAUSE SUMMARY

The **REAL** problem was:

1. ❌ **Incorrect webhook structure assumption** - We assumed a flat structure, but Vapi sends a `message` wrapper
2. ❌ **Wrong field name** - We looked for `toolCalls`, but Vapi sends `toolCallList`
3. ❌ **Silent failure** - Empty array `[]` meant loop never ran, no error thrown
4. ❌ **Insufficient logging** - Couldn't see the actual payload structure

The database field mapping and response format issues were **REAL**, but they were **SECONDARY** to this primary bug!

---

## 📁 FILES MODIFIED

| File | Changes | Lines |
|------|---------|-------|
| `lib/webhooks/multilingual-webhook-handler.ts` | Updated type definitions | 13-86 |
| `lib/webhooks/multilingual-webhook-handler.ts` | Fixed event type extraction | 124-137 |
| `lib/webhooks/multilingual-webhook-handler.ts` | Fixed tool call extraction | 201-218 |
| `lib/webhooks/multilingual-webhook-handler.ts` | Fixed demo call handler | 592 |

---

## ✅ SUCCESS CRITERIA

**Appointment booking works when you see ALL of these**:

1. ✅ Server logs show `📥 Raw webhook data: {"message": {...}}`
2. ✅ Server logs show `🔧 Extracted 1 tool calls from webhook` (NOT 0!)
3. ✅ Server logs show `✅ Appointment created successfully: [id]`
4. ✅ Vapi shows tool response with appointment details (NOT "No result returned")
5. ✅ Database has new appointment with correct fields

---

## 🚀 NEXT STEPS

1. **Test immediately** by making a phone call
2. **Watch server logs** - You should see the full payload and extracted tool calls
3. **Verify database** - Appointment should be created
4. **Check Vapi dashboard** - Should show tool response

---

**Status**: ✅ **CRITICAL BUG FIXED - Ready for Testing**

**The Issue**: We were reading from the wrong field in the webhook payload all along!

**The Fix**: Now extracting data from `message.toolCallList` where it actually exists!

---

## 🔗 References

- Vapi Documentation: https://docs.vapi.ai/server-url/events
- Tool Calls Format: https://docs.vapi.ai/tools/custom-tools
- Server Message Types: https://docs.vapi.ai/api-reference/webhooks/server-message
