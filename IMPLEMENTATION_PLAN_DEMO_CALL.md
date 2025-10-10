# Implementation Plan: Demo Call Feature (Call-to-Experience)

This document outlines the step-by-step implementation plan for the "Demo Call" feature, combining the best aspects of the proposed ideas.

## Phase 1: Core Demo Call Functionality

### 1.1 Database Schema (`demo_requests` table)

**Objective:** Create the `demo_requests` table to store all demo call-related data.

- [ ] **Task 1.1.1:** Create a new migration file (`supabase/migrations/023_create_demo_requests_table.sql`).
- [ ] **Task 1.1.2:** Define the `demo_requests` table schema as per PRP (id, name, phone_number, industry, organization_id, vapi_call_id, status, lead_score, follow_up_flag, conversion_status, requested_at, call_started_at, call_ended_at, transcript, recording_url, created_at, updated_at).
- [ ] **Task 1.1.3:** Add RLS policies for the `demo_requests` table (Admins can view/manage).
- [ ] **Task 1.1.4:** Apply the migration to the database using `apply_migration`.

### 1.2 Homepage UI (Client Component)

**Objective:** Implement the user-facing form on the homepage to request a demo call.

- [ ] **Task 1.2.1:** Modify `app/page.tsx` to add a new section for the demo call feature.
- [ ] **Task 1.2.2:** Implement a form with input fields for "Your Name", "Your Phone Number", and an optional "Industry" dropdown.
- [ ] **Task 1.2.3:** Add a consent checkbox (e.g., "By providing my number, I agree to receive a demo call from ServiceAI's AI agent.").
- [ ] **Task 1.2.4:** Implement client-side validation for phone number and name.
- [ ] **Task 1.2.5:** Display instant feedback (success/error messages) after form submission.

### 1.3 Demo Call API Endpoint (`/api/demo-call`)

**Objective:** Create the backend endpoint to handle demo call requests and initiate Vapi outbound calls.

- [ ] **Task 1.3.1:** Create a new API endpoint file (`app/api/demo-call/route.ts`).
- [ ] **Task 1.3.2:** Implement input validation for name, phone, and industry.
- [ ] **Task 1.3.3:** Implement rate limiting logic (e.g., 1 call per phone number per day) to prevent abuse.
- [ ] **Task 1.3.4:** Store the demo request in the `demo_requests` table with `status: 'pending'`.
- [ ] **Task 1.3.5:** Integrate with Vapi.ai's outbound call API to trigger a call to the provided phone number using the dedicated Demo Assistant.
    - Pass `name` and `industry` as metadata to the Vapi call for personalization.
- [ ] **Task 1.3.6:** Update the `demo_requests` record with the `vapi_call_id` and `status: 'calling'`.
- [ ] **Task 1.3.7:** Return appropriate success/error responses to the frontend.

### 1.4 Dedicated Demo AI Assistant Configuration

**Objective:** Configure the Vapi AI Assistant specifically for demo calls.

- [ ] **Task 1.4.1:** Create a new Vapi Assistant configuration (either hardcoded in `lib/vapi/multilingual-vapi-service.ts` or template-based if a new template is created).
- [ ] **Task 1.4.2:** Design and implement the **System Prompt** for the Demo Assistant to:
    - Introduce itself as ServiceAI's demo agent.
    - Explain ServiceAI's core value proposition.
    - Showcase 2-3 key features interactively (e.g., "Try booking an appointment with me").
    - Handle common questions about the service.
    - Offer a soft sales pitch and guide towards signup.
    - Offer to send a signup link via SMS.
- [ ] **Task 1.4.3:** Integrate the `send_sms_notification` tool into the Demo Assistant's configuration.
- [ ] **Task 1.4.4:** Select an appropriate voice for the Demo Assistant.
- [ ] **Task 1.4.5:** Store the Demo Assistant ID as an environment variable (`VAPI_DEMO_ASSISTANT_ID`).

### 1.5 Vapi Webhook Handler for Demo Calls

**Objective:** Extend the existing Vapi webhook handler to process demo call-specific events.

- [ ] **Task 1.5.1:** Modify `lib/webhooks/multilingual-webhook-handler.ts` to add a new case for `demo-call-started` (or similar custom event if Vapi supports it, otherwise use `call-started` with metadata check).
- [ ] **Task 1.5.2:** In the `call-started` handler, if the call is identified as a demo call (via metadata), update the corresponding `demo_requests` record with `status: 'calling'` and `call_started_at`.
- [ ] **Task 1.5.3:** In the `call-ended` handler, if the call is a demo call, update the `demo_requests` record with `call_ended_at`, `call_duration`, `status` (`completed`, `failed`, `no_answer`), `transcript`, and `recording_url`.
- [ ] **Task 1.5.4:** In the `tool-calls` handler, if the call is a demo call and the `send_sms_notification` tool is called, process it to send the signup link via SMS.
- [ ] **Task 1.5.5:** (Optional) In the `transcript-updated` handler, implement basic lead scoring based on keywords in the transcript to update `lead_score` in the `demo_requests` table.

## Phase 2: Admin Dashboard Integration & Follow-up

### 2.1 Admin Dashboard UI - Demo Requests List

**Objective:** Create a UI in the Admin Dashboard to monitor demo call requests.

- [ ] **Task 2.1.1:** Modify `app/admin/page.tsx` to add a new navigation item/section for "Demo Calls".
- [ ] **Task 2.1.2:** Create a new client component (`components/admin/DemoRequestsTable.tsx`) to display data from the `demo_requests` table.
- [ ] **Task 2.1.3:** Implement fetching data for `DemoRequestsTable` from `/api/admin/demo-requests`.
- [ ] **Task 2.1.4:** Implement filtering, sorting, and pagination for demo requests in the UI.

### 2.2 Admin API Endpoints - Demo Requests

**Objective:** Create backend endpoints for the Admin Dashboard to manage demo requests.

- [ ] **Task 2.2.1:** Create a new API endpoint file (`app/api/admin/demo-requests/route.ts`) to fetch all demo requests.
- [ ] **Task 2.2.2:** Create API endpoints to update `lead_score`, `follow_up_flag`, and `conversion_status` for a specific demo request.
- [ ] **Task 2.2.3:** Create an API endpoint to manually trigger a follow-up SMS/email.

### 2.3 Automated Follow-up System

**Objective:** Implement a scheduled system for automated post-call follow-ups.

- [ ] **Task 2.3.1:** Create a new Edge Function file (`supabase/functions/process-demo-followups/index.ts`).
- [ ] **Task 2.3.2:** Implement the Edge Function logic to periodically query `demo_requests` with `follow_up_flag = false`.
- [ ] **Task 2.3.3:** Implement logic for different follow-up scenarios (high lead score email, nurture sequence, no answer retry/SMS).
- [ ] **Task 2.3.4:** Update `follow_up_flag` and `conversion_status` after processing.
- [ ] **Task 2.3.5:** Deploy the Edge Function.
- [ ] **Task 2.3.6:** Configure a Supabase scheduled job to trigger the Edge Function (e.g., hourly).

## Phase 3: Refinements and Analytics

### 3.1 Demo Call Analytics

**Objective:** Display basic analytics for demo calls in the Admin Dashboard.

- [ ] **Task 3.1.1:** Add aggregated metrics (e.g., total demo calls, completion rate, average lead score) to the Admin Dashboard UI.
- [ ] **Task 3.1.2:** Create necessary API endpoints or database functions to retrieve these analytics.

### 3.2 Configuration

**Objective:** Centralize configuration for the demo call feature.

- [ ] **Task 3.2.1:** Ensure `VAPI_DEMO_ASSISTANT_ID` is set as an environment variable.
- [ ] **Task 3.2.2:** Implement configurable `DEMO_CALL_RATE_LIMIT_PER_PHONE_PER_DAY` (e.g., in `system_settings` table).
- [ ] **Task 3.2.3:** Define and implement configurable follow-up email/SMS templates.
