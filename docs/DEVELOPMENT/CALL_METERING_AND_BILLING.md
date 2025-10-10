
# Call Metering, Billing, and Admin Dashboard Technical Documentation

## 1.0 Introduction

This document provides a detailed technical overview of the call metering, billing, and administration system for ServiceAI. It is intended for developers who will be working on or maintaining this system.

## 2.0 Architecture Overview

The system is designed to be robust, scalable, and integrated with the existing application architecture. It leverages Vapi webhooks for real-time call events, Stripe for billing, and Supabase for data storage and background jobs.

The core components are:

- **Vapi Webhook Handlers:** Two key webhooks are used: `assistant-request` for pre-call checks and `call-end` for post-call accounting.
- **Database:** The PostgreSQL database in Supabase is used to store subscription plans, usage data, and call logs.
- **Stripe Integration:** Stripe is used for processing payments for additional minutes and for managing subscriptions.
- **Admin Dashboard:** A new section in the application, accessible only to administrators, for monitoring and managing the system.

## 3.0 Data Model

The following changes will be made to the database schema:

### 3.1 `organizations` table

Two new columns will be added to the `organizations` table:

- `minutes_used_this_cycle` (INTEGER, DEFAULT 0): This column tracks the total number of minutes used by the organization in the current billing cycle. It is reset to 0 at the beginning of each cycle.
- `credit_minutes` (INTEGER, DEFAULT 0): This column stores any additional minutes that the organization has purchased.

### 3.2 `subscription_plans` table

This table already exists and is used to define the subscription plans. We will utilize the following columns:

- `included_minutes` (INTEGER): The number of minutes included in the plan.
- `overage_rate` (NUMERIC): The cost per minute for usage beyond the included minutes. We will use this to calculate the price of minute bundles.

## 4.0 Detailed Workflows

### 4.1 Pre-call Check (Hard Cut-off)

This workflow is triggered by the Vapi `assistant-request` webhook.

1.  **Webhook Received:** The handler at `app/api/webhooks/vapi/route.ts` receives the incoming call event.
2.  **Fetch Organization Data:** The handler fetches the organization's subscription details, including `monthly_minutes_allocation`, `minutes_used_this_cycle`, and `credit_minutes`.
3.  **Check Remaining Minutes:** The system calculates the total remaining minutes: `remaining_minutes = (monthly_minutes_allocation + credit_minutes) - minutes_used_this_cycle`.
4.  **Enforce Cut-off:**
    - If `remaining_minutes <= 0`, the handler responds to Vapi with a 403 status code and a message to terminate the call. This prevents the call from connecting.
    - If `remaining_minutes > 0`, the handler allows the call to proceed.

### 4.2 Post-call Accounting

This workflow is triggered by the Vapi `call-end` webhook.

1.  **Webhook Received:** The handler receives the call completion event.
2.  **Get Call Duration:** The handler extracts the call duration in seconds from the webhook payload and rounds it up to the nearest minute.
3.  **Update Usage:** The handler updates the `minutes_used_this_cycle` for the organization in the database.

### 4.3 Subscription Renewal

This workflow is triggered by the Stripe `customer.subscription.updated` webhook.

1.  **Webhook Received:** The handler at `app/api/webhooks/stripe/route.ts` receives the subscription update event.
2.  **Check for New Cycle:** The handler checks if the `current_period_start` has changed, indicating a new billing cycle.
3.  **Reset Usage:** If it's a new cycle, the handler resets the `minutes_used_this_cycle` for the organization to 0.

## 5.0 Admin Dashboard

The admin dashboard will be a new section in the application, with its own set of API endpoints and UI components. It will be protected by role-based access control (RBAC) to ensure only administrators can access it.

### 5.1 Features:

- **Organization Management:** View a list of all organizations, their subscription plans, and their current usage. Manually adjust `minutes_used_this_cycle` and `credit_minutes` for any organization.
- **Call Logs:** A comprehensive view of the `call_logs` table, with filtering and sorting options.
- **System Settings:** A UI to configure system-wide settings, such as the markup percentage for purchased minutes.

## 6.0 Configuration

- **Markup Percentage:** The markup for purchased minutes will be stored as an environment variable (`OVERAGE_MARKUP_PERCENTAGE`) to allow for easy configuration without code changes.

This documentation provides a solid foundation for the development of the call metering and billing system. It should be kept up-to-date as the system evolves.
