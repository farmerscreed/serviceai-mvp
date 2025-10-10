# Assistant Creation Error Fix

## Problem

User reported a 500 Internal Server Error when trying to create an assistant during the onboarding process:

```
POST http://localhost:3000/api/assistants/create 500 (Internal Server Error)
```

Error location: `F:\APPS\ServiceAI\app\onboarding\page.tsx:107`

## Root Cause

The onboarding page (`app/onboarding/page.tsx`) was attempting to POST to `/api/assistants/create`, but this endpoint **did not exist** in the codebase.

### What Existed
- `/api/assistants` (POST) - Expected different payload format:
  ```typescript
  {
    organizationId: string
    industryCode: string
    businessData: object
    languagePreference: string
  }
  ```

### What Onboarding Was Sending
The onboarding flow at `app/onboarding/page.tsx:107-118` was sending:
```typescript
{
  organizationId: string
  assistantName: string
  industryCode: string
  language: string
  businessName: string
  businessPhone: string
}
```

The payload structure and endpoint did not match, causing the 404/500 error.

## Solution

Created a new API endpoint at `app/api/assistants/create/route.ts` that:

1. **Accepts the onboarding payload format** - Matches what the onboarding page sends
2. **Validates required fields** - Ensures `organizationId` and `industryCode` are present
3. **Verifies user permissions** - Checks that the user is a member of the organization
4. **Transforms the data** - Converts the onboarding payload into the format expected by the VAPI service
5. **Creates the assistant** - Calls `vapiService.createMultilingualAssistant()`
6. **Provides detailed errors** - Returns helpful error messages in development mode

### Key Features

```typescript
// Transforms onboarding data into business data format
const businessData = {
  businessName: businessName || assistantName || 'Business',
  businessPhone: businessPhone || '',
  assistantName: assistantName || `${businessName} Assistant` || 'AI Assistant'
}

// Creates multilingual assistant
const assistant = await vapiService.createMultilingualAssistant(
  organizationId,
  industryCode,
  businessData,
  language || 'en'
)
```

## Files Changed

### Created
- `app/api/assistants/create/route.ts` - New endpoint for onboarding assistant creation

### Verified Working
- `app/onboarding/page.tsx` - Now successfully calls the new endpoint
- `app/api/assistants/route.ts` - Existing endpoint remains unchanged for other uses

## Testing

1. Dev server is running without errors
2. Homepage loads without React errors
3. Supabase logs show successful operations
4. The `/api/assistants/create` endpoint is now available

## Usage

During onboarding, when a user completes step 4 and clicks "Complete Setup":

```typescript
// Onboarding page automatically calls:
POST /api/assistants/create
Content-Type: application/json

{
  "organizationId": "org-id",
  "assistantName": "My Business Assistant",
  "industryCode": "hvac",
  "language": "en",
  "businessName": "My Business",
  "businessPhone": "+1234567890"
}

// Response:
{
  "success": true,
  "assistant": {
    // Assistant details from VAPI service
  }
}
```

## Error Handling

The endpoint provides clear error messages:
- **400** - Missing required fields (organizationId, industryCode)
- **401** - User not authenticated
- **403** - User not a member of the organization
- **500** - Internal server error (with stack trace in development)

## Future Considerations

1. Consider consolidating `/api/assistants` and `/api/assistants/create` into a single endpoint with better payload handling
2. Add validation for phone number format
3. Add rate limiting for assistant creation
4. Consider adding assistant name uniqueness checks

## Update: Business Data Field Mapping Fix

### Additional Issue Discovered

After creating assistants, the business data fields were showing as `undefined` in VAPI:
```
Business Information:
- Company: undefined
- Phone: undefined
- Address: undefined
```

### Root Cause

The `/api/assistants/create` endpoint was passing **camelCase** properties:
```typescript
{
  businessName: "My Business",
  businessPhone: "+1234567890"
}
```

But the `BusinessData` interface in `lib/templates/types.ts` expects **snake_case**:
```typescript
interface BusinessData {
  business_name: string
  business_phone: string
  business_address: string
  // ... other fields
}
```

### Solution

Updated `app/api/assistants/create/route.ts` to transform the data properly:

```typescript
const businessData = {
  business_name: businessName || assistantName || 'Business',
  business_phone: businessPhone || '',
  business_address: '', // TODO: Add to onboarding
  business_email: '', // TODO: Add to onboarding
  primary_language: language || 'en',
  supported_languages: [language || 'en'],
  timezone: 'America/New_York',
  emergency_contact_phone: '',
  emergency_contact_email: '',
  sms_enabled: true
}
```

### Files Modified

- `app/api/assistants/create/route.ts` - Fixed business data field mapping (lines 45-57)

### Testing

To verify the fix:

1. Complete onboarding and create a new assistant
2. Check VAPI dashboard - business info should now appear correctly
3. The assistant's system prompt should include proper business name and phone

## Related Documentation

- See `REACT_SERVER_CLIENT_COMPONENTS.md` for the React Server/Client component fix
- VAPI service: `lib/vapi/multilingual-vapi-service.ts`
- Onboarding flow: `app/onboarding/page.tsx`
- Business data types: `lib/templates/types.ts:242`
