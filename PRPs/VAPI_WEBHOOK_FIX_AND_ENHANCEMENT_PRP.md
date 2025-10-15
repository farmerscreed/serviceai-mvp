# PRP: Vapi Webhook and Call Processing Overhaul

## 1. Problem Statement

An investigation into why customer calls handled by Vapi were not appearing in the application revealed a series of critical to major issues:

1.  **No Call Data Ingestion**: The primary API route for handling Vapi webhooks is configured incorrectly, causing all incoming data from Vapi to result in a `404 Not Found` error. No call data is currently entering the system.
2.  **Missing Call Summarization**: The application lacks a feature to perform AI-powered summarization of call transcripts.
3.  **Incomplete Call Logs**: The current logic for handling the end of a call does not save the full transcript or a summary to the database, only basic metadata.
4.  **Broken Business Logic**: The emergency detection tool is hardcoded for a single industry ("HVAC") and will not work for others. SMS notifications are also not connected to a real provider.

## 2. Proposed Solution

A phased approach will be taken to fix the data pipeline and implement the missing features. The solution will prioritize unblocking the data flow, then enriching the data using Vapi's native features, and finally fixing the specific business logic bugs.

## 3. Implementation Plan & Checklist

This plan should be followed sequentially. Each phase builds upon the previous one.

### Phase 1: Fix Critical Webhook Routing

**Goal:** Unblock the Vapi data pipeline so the application can receive webhooks.

- [ ] **1.1: Rename API Route Directory**
  - **Action:** Rename the directory `app/api/webhooks/vapi/[customerId]` to `app/api/webhooks/vapi/[organizationId]`.
  - **Verification:** The file system should reflect the new directory name.

- [ ] **1.2: Update Route Handler Code**
  - **File:** `app/api/webhooks/vapi/[organizationId]/route.ts`
  - **Action:** Modify the `POST` function signature to expect `organizationId` instead of `customerId`.
  - **Change:**
    ```typescript
    // From
    { params }: { params: Promise<{ customerId: string }> }
    const { customerId } = await params

    // To
    { params }: { params: { organizationId: string } }
    const { organizationId } = params
    ```
  - **Action:** Update all internal uses of the `customerId` variable within the file to use `organizationId`.
  - **Verification:** The application should be able to receive a webhook from Vapi without returning a 404 error.

### Phase 2: Implement Rich Call Logging & Summarization

**Goal:** Leverage Vapi's "End of Call Report" to save complete, summarized call logs.

- [ ] **2.1: Enable "End of Call Report" in Vapi**
  - **File:** `lib/vapi/multilingual-vapi-service.ts`
  - **Action:** In the `createMultilingualAssistant` function, find the `assistantConfig` object and add the property to enable the end-of-call report. Based on Vapi's API patterns, this is likely `endOfCallReport: true` or a similar flag within the `model` or root object. *Developer Note: Confirm exact property from Vapi documentation if necessary.*
  - **Verification:** New assistants created via the API should have this feature enabled in the Vapi dashboard.

- [ ] **2.2: Add Handler for "End of Call Report"**
  - **File:** `lib/webhooks/multilingual-webhook-handler.ts`
  - **Action:** Add a new `case` to the `switch (webhookData.type)` statement to handle the `end-of-call-report` event type.
  - **Action:** Create a new method `handleEndOfCallReport` to process the payload.

- [ ] **2.3: Implement Call Log Saving Logic**
  - **File:** `lib/webhooks/multilingual-webhook-handler.ts`
  - **Action:** Inside `handleEndOfCallReport`, add the logic to extract `transcript`, `summary`, `cost`, and other relevant fields from the webhook payload.
  - **Action:** Update the existing `logCallEvent` function or create a new function to `INSERT` or `UPDATE` the `call_logs` table with this new, rich data.

- [ ] **2.4: Update Database Schema (If Necessary)**
  - **Action:** Check the `call_logs` table schema. If it does not have columns for `transcript` (type: `TEXT`) and `summary` (type: `TEXT`), create a new Supabase migration file to add them.
  - **Verification:** The database schema should be updated, and full call logs with transcripts and summaries should appear in the application UI.

### Phase 3: Correct Business Logic

**Goal:** Fix bugs in the tool-handling logic to ensure features work across all industries.

- [ ] **3.1: Fix Hardcoded Emergency Detector**
  - **File:** `lib/webhooks/tool-call-handlers.ts`
  - **Action:** In `handleEmergencyCheck`, fetch the current organization's data to get its `industryCode`.
  - **Action:** Pass this dynamic `industryCode` to the `createEmergencyDetectorFromTemplate` function instead of the hardcoded string `'hvac'`.
  - **Verification:** Emergency detection should now use the correct keywords for any given industry.

- [ ] **3.2: (Future Task) Implement Real SMS Notifications**
  - **Note:** This is a larger task and will be addressed separately after the core call-logging functionality is stable.
  - **Action:** In `lib/webhooks/tool-call-handlers.ts`, replace the `console.log` mocks for SMS sending with a real implementation that calls the Twilio client.
