# Demo Call Feature Technical Documentation

## 1.0 Introduction

This document provides a detailed technical overview of the "Demo Call" feature for ServiceAI. It is intended for developers who will be working on or maintaining this system. The Demo Call feature allows prospective users to experience ServiceAI's AI agent firsthand by requesting an outbound call from the homepage.

## 2.0 Architecture Overview

The Demo Call feature integrates with the existing ServiceAI architecture, leveraging Vapi for AI agent calls, Supabase for data storage and backend logic, and the Next.js frontend for user interaction.

### Key Components:

-   **Frontend (Homepage):** A simple form to capture user details (name, phone, optional industry).
-   **Demo Call API Endpoint:** A Next.js API route (`/api/demo-call`) to initiate the outbound call.
-   **Supabase Database:** A new `demo_requests` table to store demo call metadata and track follow-ups.
-   **Vapi.ai:** Used to power the outbound AI agent call.
-   **Dedicated Demo AI Assistant:** A specially configured Vapi assistant with a tailored system prompt and tools.
-   **Vapi Webhook Handler:** Modified to process demo call-specific events (`call-started`, `call-ended`, `tool-calls`).
-   **Admin Dashboard:** A new section to monitor and manage demo call requests.
-   **Automated Follow-up System:** A scheduled Supabase Edge Function for post-call processing and follow-ups.

## 3.0 Data Model

### 3.1 `demo_requests` table

This new table will store all information related to demo call requests.

```sql
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    industry VARCHAR(100),
    organization_id UUID REFERENCES public.organizations(id), -- Link if user signs up after demo
    vapi_call_id VARCHAR(255), -- Link to call_logs
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'calling', 'completed', 'failed', 'no_answer'
    lead_score INTEGER DEFAULT 0, -- 0-100, based on agent feedback or transcript analysis
    follow_up_flag BOOLEAN DEFAULT FALSE,
    conversion_status VARCHAR(50) NOT NULL DEFAULT 'none', -- 'none', 'signed_up', 'nurturing'
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    call_started_at TIMESTAMPTZ,
    call_ended_at TIMESTAMPTZ,
    transcript TEXT,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view/manage demo requests
CREATE POLICY "Admins can view and manage demo requests"
ON public.demo_requests FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);
```

## 4.0 Detailed Workflows

### 4.1 Requesting a Demo Call (Frontend to Backend)

1.  **User Action:** A prospective user fills out the demo call form on the homepage (`app/page.tsx`) with their name, phone number, and optional industry.
2.  **Form Submission:** The form data is sent via a `POST` request to the `/api/demo-call` API endpoint.
3.  **API Endpoint Processing (`app/api/demo-call/route.ts`):**
    *   Validates the input data.
    *   Performs rate limiting checks (e.g., based on phone number or IP address).
    *   Creates a new record in the `demo_requests` table with `status: 'pending'`.
    *   Initiates an outbound call via Vapi.ai's API, specifying the dedicated Demo AI Assistant and passing user `name` and `industry` as metadata.
    *   Updates the `demo_requests` record with the `vapi_call_id` and `status: 'calling'`.
    *   Returns a success response to the frontend.

### 4.2 Demo Call Lifecycle (Vapi Webhooks)

The existing Vapi webhook handler (`lib/webhooks/multilingual-webhook-handler.ts`) will be extended to handle demo call-specific events.

1.  **`call-started` Event:**
    *   Updates the corresponding `demo_requests` record with `call_started_at` and potentially `status: 'calling'`.
2.  **`call-ended` Event:**
    *   Updates the `demo_requests` record with `call_ended_at`, `call_duration`, `status` (`completed`, `failed`, `no_answer`), `transcript`, and `recording_url`.
    *   (Optional) Triggers the automated follow-up system.
3.  **`tool-calls` Event:**
    *   If the Demo AI Assistant uses the `send_sms_notification` tool (e.g., to send a signup link), this event will be processed to send the SMS.
4.  **`transcript-updated` Event:**
    *   (Optional) Can be used to perform real-time analysis of the conversation to update `lead_score` in the `demo_requests` table.

### 4.3 Automated Follow-up System

A scheduled Supabase Edge Function will periodically process `demo_requests` records.

1.  **Scheduled Trigger:** The Edge Function (`supabase/functions/process-demo-followups/index.ts`) runs on a schedule (e.g., hourly).
2.  **Process Requests:** It queries `demo_requests` where `follow_up_flag` is `FALSE` and `status` is `completed` or `no_answer`.
3.  **Follow-up Logic:**
    *   **High Lead Score:** If `lead_score` is high, send a personalized email with a signup link and a promotional offer.
    *   **Medium Lead Score:** Add the lead to a nurture email sequence.
    *   **No Answer:** Schedule a retry call (if configured) or send an SMS with a "missed call" message and a link to reschedule.
4.  **Update Status:** After processing, update `follow_up_flag` to `TRUE` and `conversion_status` accordingly.

## 5.0 Admin Dashboard Integration

A new section will be added to the Admin Dashboard (`app/admin/page.tsx`) for "Demo Calls".

### 5.1 Features:

-   **Demo Requests List:**
    -   Displays all `demo_requests` records in a table.
    -   Includes columns for name, phone, status, call duration, lead score, follow-up status, and conversion status.
    -   Filtering and sorting by status, lead score, and date.
    -   Action buttons to:
        -   View full call details (transcript, recording).
        -   Manually trigger follow-up.
        -   Manually update `lead_score` or `conversion_status`.
-   **Demo Call Analytics:** Basic aggregated metrics (e.g., total demo calls, completion rate, average lead score).

## 6.0 Dedicated Demo AI Assistant Configuration

The Demo AI Assistant will be configured to achieve its sales and demonstration objectives.

### 6.1 System Prompt Guidelines:

-   **Introduction:** Clearly state its purpose as a demo agent from ServiceAI.
-   **Value Proposition:** Articulate key benefits of ServiceAI.
-   **Interactive Showcase:** Guide the user to interact with the AI (e.g., "Feel free to ask me about our pricing plans or try to book a hypothetical appointment.").
-   **Objection Handling:** Include instructions on how to gracefully handle common objections or questions about AI.
-   **Call-to-Action:** Direct the user towards signing up, offering to send a link.

### 6.2 Tools:

-   **`send_sms_notification`:** Essential for sending signup links or follow-up messages.
-   (Future) `capture_lead_info`: A custom tool to explicitly capture lead details (email, business size) during the call.

## 7.0 Configuration

-   **Demo Assistant ID:** Stored as an environment variable (`VAPI_DEMO_ASSISTANT_ID`).
-   **Demo Call Rate Limit:** Configurable (e.g., `DEMO_CALL_RATE_LIMIT_PER_PHONE_PER_DAY`).
-   **Follow-up Email Templates:** Configurable templates for different follow-up scenarios.

This documentation provides a solid foundation for the development of the Demo Call feature. It should be kept up-to-date as the system evolves.
