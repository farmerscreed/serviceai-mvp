# Vapi Integration Technical Guide

## 1. Overview

This document provides a comprehensive technical guide to the Vapi.ai integration within the ServiceAI platform. It is intended for developers to understand the architecture, data flow, and implementation details.

The integration is fundamentally **webhook-driven**. All real-time and post-call data is pushed from Vapi to our application via webhooks. Our application logic is contained within Next.js Serverless Functions that act as the webhook handlers.

## 2. Core Concepts

### 2.1. Webhook Configuration

- **Mechanism**: The webhook URL is configured on a **per-assistant basis** via the Vapi API during assistant creation.
- **`serverUrl`**: In the `POST /assistant` API call, we provide a `serverUrl`. This tells Vapi where to send all events related to that specific assistant.
- **URL Structure**: The URL must be structured as follows: `https://<your-app-domain>/api/webhooks/vapi/[organizationId]`. The `[organizationId]` is a dynamic parameter that allows our handler to know which organization the call belongs to.

### 2.2. Webhook Security

To ensure that incoming webhooks are genuinely from Vapi, we use a signature verification strategy.

- **Secret Key**: A shared secret (`VAPI_WEBHOOK_SECRET` environment variable) is configured in both our application and the Vapi dashboard.
- **Signature Header**: Vapi includes a signature in the `x-vapi-signature` header of every webhook request.
- **Verification**: Our webhook handler uses a function (`verifyVapiWebhookSignatureWithTimestamp`) to compute a signature from the raw request payload and the secret. If the computed signature matches the one in the header, the request is considered authentic.

### 2.3. Tool Definitions

Tools are functions the Vapi assistant can call to perform actions.

- **Dynamic Definition**: Tools are defined dynamically within the `tools` array in the `POST /assistant` API call. They do not need to be pre-configured in the Vapi dashboard.
- **Execution**: When an assistant decides to use a tool, Vapi sends a `tool-calls` webhook to our `serverUrl`. Our handler then executes the corresponding logic.

## 3. Data Flow: The Lifecycle of a Call

```
(Customer) -> (Vapi Call) -> [Webhook Event] -> (ServiceAI Webhook Handler) -> (Business Logic) -> (Database)
```

1.  **Call Initiation (`assistant-request`)**: Vapi sends this first to check if the call should proceed. Our handler uses this to verify the organization's subscription and minute balance.

2.  **Tool Usage (`tool-calls`)**: During the call, Vapi sends this event when the assistant needs to run a tool (e.g., `book_appointment_with_sms`). Our `ToolCallHandlers` module processes the request and interacts with the database (e.g., inserts a row into the `appointments` table).

3.  **Call Termination (`end-of-call-report`)**: This is the most important event for data logging. To receive it, the **"End of Call Report"** feature must be enabled for the assistant during its creation.

## 4. The "End of Call Report" - The Key to Rich Data

This is a specific Vapi feature that provides a comprehensive summary of the entire call.

- **Enabling the Feature**: It must be explicitly requested during the `POST /assistant` call.
- **Rich Payload**: Unlike simpler events, this report contains:
  - `transcript`: The full, structured conversation transcript.
  - `summary`: An AI-generated summary of the conversation.
  - `cost`: Call cost details.
  - `started_at`, `ended_at`: Timestamps.
- **Implementation**: Our webhook handler must be configured to listen for the `end-of-call-report` event type. Upon receiving it, the handler is responsible for saving the `transcript` and `summary` to the `call_logs` table in the database.

## 5. Key Database Tables

- **`call_logs`**: Stores the record of each call. Should be populated from the "End of Call Report" and include the transcript and summary.
- **`appointments`**: Stores details of appointments booked via the `book_appointment_with_sms` tool.
- **`emergencies`**: Stores records of events flagged as emergencies by the `check_emergency_multilingual` tool.
- **`webhook_events`**: A log table for every incoming webhook event for debugging purposes.

## 6. Best Practices & Recommendations

- **URL Consistency**: The API route directory for the webhook handler (`/api/webhooks/vapi/[organizationId]`) **must** match the `organizationId` parameter configured in the `serverUrl`.
- **Leverage End of Call Report**: Always enable and process the "End of Call Report" to ensure rich data logging and to utilize Vapi's built-in summarization feature.
- **Dynamic Industry Logic**: Avoid hardcoding values like `hvac`. Business logic (e.g., emergency keywords) should be loaded dynamically based on the `organizationId` associated with the call.
