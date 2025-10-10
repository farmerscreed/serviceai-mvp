
# PRP: Call Metering, Billing, and Admin Dashboard

## 1.0 Overview

This document outlines the requirements for implementing a robust call metering, billing, and administration system for ServiceAI. The primary goal is to accurately track call usage, enforce subscription limits with a hard cut-off, and provide a comprehensive admin dashboard for system management.

## 2.0 Goals

- To prevent users from incurring large, unexpected bills by implementing a hard cut-off when their allocated minutes are exhausted.
- To create a new revenue stream by allowing users to purchase additional minutes.
- To provide users with full transparency into their usage and remaining minutes.
- To provide administrators with a centralized dashboard to monitor and manage the entire system.

## 3.0 User Stories

### 3.1 As a User:

- I want to see my current call usage and remaining minutes on my dashboard.
- I want to be notified when I am running low on my allocated minutes.
- I want my service to be automatically cut off when I run out of minutes to avoid unexpected charges.
- I want to be able to purchase additional minutes when I run out.

### 3.2 As an Admin:

- I want to view a list of all organizations and their subscription plans.
- I want to see the real-time call usage for each organization.
- I want to be able to manually adjust an organization's used minutes or credit minutes.
- I want to view a detailed log of all calls, including their duration, cost, and user-facing cost.
- I want to be able to set the markup percentage for purchased minutes.

## 4.0 Technical Implementation Checklist

### 4.1 [ ] **Phase 1: Core Metering and Hard Cut-off**

- [ ] **4.1.1: Database Enhancement:**
  - [ ] Add `minutes_used_this_cycle` (integer) to the `organizations` table.
  - [ ] Add `credit_minutes` (integer) to the `organizations` table.

- [ ] **4.1.2: Automate Usage Reset:**
  - [ ] Modify the Stripe webhook handler (`app/api/webhooks/stripe/route.ts`) to reset `minutes_used_this_cycle` to 0 at the start of each new billing period.

- [ ] **4.1.3: Implement Pre-call Check (Hard Cut-off):**
  - [ ] Modify the Vapi `assistant-request` webhook handler to check for remaining minutes (`plan_minutes` + `credit_minutes` - `minutes_used_this_cycle`).
  - [ ] If no minutes are left, respond to Vapi to terminate the call with an appropriate message.

- [ ] **4.1.4: Implement Post-call Accounting:**
  - [ ] Modify the Vapi `call-end` webhook handler to update the `minutes_used_this_cycle` for the organization after each call.

### 4.2 [ ] **Phase 2: User-Facing Features**

- [ ] **4.2.1: Implement Usage Metering UI:**
  - [ ] Create a new API endpoint (`/api/usage`) to provide usage data for the user's organization.
  - [ ] Create a new frontend component on the billing page (`app/billing/page.tsx`) to display usage information.

- [ ] **4.2.2: Implement "Buy More Minutes" Feature:**
  - [ ] Create a new UI for purchasing minute bundles.
  - [ ] Create a new API endpoint to handle the purchase via Stripe.
  - [ ] Create a new Stripe webhook handler to update the `credit_minutes` upon successful payment.

- [ ] **4.2.3: Implement User Notifications:**
  - [ ] Create a scheduled serverless function (Supabase Edge Function) to run daily.
  - [ ] The function will check for organizations with high usage (e.g., >80%) and send them an email notification.

### 4.3 [ ] **Phase 3: Admin Dashboard**

- [ ] **4.3.1: Create Admin Role:**
  - [ ] Ensure there is a robust role-based access control (RBAC) system that defines an "admin" role.

- [ ] **4.3.2: Create Admin Dashboard UI:**
  - [ ] Create a new section in the application, accessible only to admins.
  - [ ] The dashboard will have the following sections:
    - [ ] **Organizations:** A table of all organizations with their subscription details and current usage.
    - [ ] **Call Logs:** A detailed log of all calls across all organizations.
    - [ ] **Settings:** A section to configure system-wide settings, such as the markup percentage for purchased minutes.

- [ ] **4.3.3: Implement Admin API Endpoints:**
  - [ ] Create secure API endpoints for the admin dashboard to fetch data and perform administrative actions (e.g., adjusting minutes, setting markup).

## 5.0 Out of Scope

- Real-time interruption of a call that is already in progress. The hard cut-off will only be enforced before a call connects.
- Complex, tiered pricing for overage. A single flat rate with a markup will be used for now.
