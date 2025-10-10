# PRP: Demo Call Feature (Call-to-Experience)

## 1.0 Overview

This document outlines the requirements for implementing a "Demo Call" feature, allowing prospective users to experience ServiceAI's AI agent firsthand. Users will input their name and phone number on the homepage, and an AI agent will call them to explain the service and showcase its capabilities. This feature aims to enhance lead conversion and provide immediate product value demonstration.

## 2.0 Goals

- To provide prospective users with an immediate, interactive demonstration of ServiceAI's AI agent capabilities.
- To increase lead engagement and conversion rates by showcasing product value directly.
- To gather valuable lead information and feedback from demo calls.
- To enable administrators to monitor demo call activity and track conversions.

## 3.0 User Stories

### 3.1 As a Prospective User:

- I want to easily request a demo call from the homepage by providing my name and phone number.
- I want to receive a call from an AI agent that explains ServiceAI's features and benefits.
- I want the AI agent to be interactive and answer my questions about the service.
- I want the AI agent to offer to send me a signup link or more information via SMS/email.
- I want to feel confident about the AI agent's capabilities after the demo call.

### 3.2 As an Admin:

- I want to see a list of all demo call requests, including user details and call status.
- I want to view detailed logs and transcripts of demo calls.
- I want to track the conversion rate from demo calls to signups.
- I want to be able to manually trigger follow-up actions (e.g., send a signup link) for specific demo requests.
- I want to configure the demo AI agent's script and objectives.
- I want to monitor the cost and usage of the demo call feature.

## 4.0 Technical Implementation Checklist

### 4.1 [ ] **Phase 1: Core Demo Call Functionality**

- [ ] **4.1.1: Database Schema:**
  - [ ] Create `demo_requests` table to store:
    - `id` (UUID)
    - `name` (VARCHAR)
    - `phone_number` (VARCHAR)
    - `industry` (VARCHAR, optional)
    - `organization_id` (UUID, if user signs up after demo)
    - `vapi_call_id` (VARCHAR, link to `call_logs`)
    - `status` (VARCHAR: 'pending', 'calling', 'completed', 'failed', 'no_answer')
    - `lead_score` (INTEGER, 0-100, optional, set by agent or post-call analysis)
    - `follow_up_flag` (BOOLEAN, default false)
    - `conversion_status` (VARCHAR: 'none', 'signed_up', 'nurturing')
    - `requested_at` (TIMESTAMPTZ)
    - `call_started_at` (TIMESTAMPTZ, optional)
    - `call_ended_at` (TIMESTAMPTZ, optional)
    - `transcript` (TEXT, optional)
    - `recording_url` (TEXT, optional)
    - `created_at`, `updated_at`
  - [ ] Add RLS policies for `demo_requests` table (Admins can view/manage).

- [ ] **4.1.2: Homepage UI (Client Component):**
  - [ ] Create a new section on the homepage (`app/page.tsx`) for the demo call.
  - [ ] Implement a form with "Your Name", "Your Phone Number", and an optional "Industry" dropdown.
  - [ ] Add a consent checkbox for receiving the call.
  - [ ] Implement client-side validation for phone number and name.
  - [ ] Display instant feedback after form submission.

- [ ] **4.1.3: Demo Call API Endpoint:**
  - [ ] Create a new API endpoint (`app/api/demo-call/route.ts`) to handle form submissions.
  - [ ] Validate input (name, phone, industry).
  - [ ] Implement rate limiting (e.g., 1 call per phone number per day).
  - [ ] Store the demo request in the `demo_requests` table.
  - [ ] Trigger a Vapi outbound call using a dedicated Demo Assistant.
    - Pass `name` and `industry` as metadata to the Vapi call for personalization.
  - [ ] Return call status to the frontend.

- [ ] **4.1.4: Dedicated Demo AI Assistant Configuration:**
  - [ ] Create a new Vapi Assistant configuration (either hardcoded or template-based).
  - [ ] **System Prompt:** Design a system prompt for the Demo Assistant to:
    - Introduce itself as ServiceAI's demo agent.
    - Explain ServiceAI's core value proposition.
    - Showcase 2-3 key features interactively (e.g., "Try booking an appointment with me").
    - Handle common questions about the service.
    - Offer a soft sales pitch and guide towards signup.
    - Offer to send a signup link via SMS.
  - [ ] **Tools:** Integrate the `send_sms_notification` tool for sending signup links.
  - [ ] **Voice:** Select an appropriate voice.

- [ ] **4.1.5: Vapi Webhook Handler for Demo Calls:**
  - [ ] Modify `lib/webhooks/multilingual-webhook-handler.ts` to handle demo call-specific events.
  - [ ] **`call-started`:** Update `demo_requests` status to 'calling', record `call_started_at`.
  - [ ] **`call-ended`:** Update `demo_requests` status to 'completed'/'failed'/'no_answer', record `call_ended_at`, `call_duration`, `transcript`, `recording_url`.
  - [ ] **`tool-calls`:** Handle `send_sms_notification` tool calls from the Demo Assistant.
  - [ ] **`transcript-updated`:** (Optional) Implement basic lead scoring based on keywords in the transcript.

### 4.2 [ ] **Phase 2: Admin Dashboard Integration & Follow-up**

- [ ] **4.2.1: Admin Dashboard UI - Demo Requests List:**
  - [ ] Add a new navigation item to the Admin Dashboard for "Demo Calls".
  - [ ] Create a new client component (`components/admin/DemoRequestsTable.tsx`) to display data from the `demo_requests` table.
  - [ ] Implement filtering, sorting, and pagination for demo requests.

- [ ] **4.2.2: Admin API Endpoints - Demo Requests:**
  - [ ] Create a new API endpoint (`app/api/admin/demo-requests/route.ts`) to fetch all demo requests.
  - [ ] Create API endpoints to update `lead_score`, `follow_up_flag`, and `conversion_status` for a specific demo request.
  - [ ] Create an API endpoint to manually trigger a follow-up SMS/email.

- [ ] **4.2.3: Automated Follow-up System:**
  - [ ] Create a scheduled Edge Function to process `demo_requests` with `follow_up_flag = false`.
  - [ ] Implement logic for different follow-up scenarios:
    - If `lead_score` is high: Send personalized email with signup link + promo.
    - If `lead_score` is medium: Add to nurture email sequence.
    - If `status` is 'no_answer': Schedule a retry call or send an SMS.
  - [ ] Update `follow_up_flag` after processing.

## 5.0 Out of Scope

- Complex A/B testing of demo call scripts.
- Real-time analytics dashboard for demo calls (basic metrics will be available).
- Integration with external CRM systems (can be a future enhancement).
