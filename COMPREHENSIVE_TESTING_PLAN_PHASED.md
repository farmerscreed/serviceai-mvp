# 🚀 ServiceAI Phased Testing Plan for Market Readiness

## Overview
This document outlines a phased, user-story-driven testing approach to rapidly achieve market readiness for ServiceAI. The focus is on validating core user journeys and critical features to enable immediate market testing, with subsequent phases covering essential management, billing, and advanced functionalities.

**Goal: Get the app production-ready TODAY for market testing.**

## 🎯 Testing Objectives
- **Rapid Validation**: Quickly confirm core features work end-to-end.
- **User Experience**: Ensure critical user flows are smooth and intuitive.
- **Data Integrity**: Verify essential data operations are correct.
- **Hard Cut-off Enforcement**: Confirm billing limits are strictly enforced.
- **Error Documentation**: Systematically capture and track issues.

---

## 📋 Pre-Testing Checklist (Critical for All Phases)

- [ ] Database migrations applied (all current migrations)
- [ ] Environment variables configured (Vapi, Twilio, Stripe, Supabase)
- [ ] Vapi.ai API keys working
- [ ] Twilio credentials configured
- [ ] No critical console errors in browser
- [ ] No critical terminal errors
- [ ] Test data prepared:
    - [ ] Test organization(s)
    - [ ] Test user accounts (owner, admin, member)
    - [ ] Test phone numbers (Twilio)
    - [ ] Test Google Calendar account

---

## ✅ Phase 1: Core User Journey & Critical Features (Market Readiness)

**Objective: Validate the absolute minimum features required for a prospective user to experience the core value proposition.**

### 1.1 [ ] User Onboarding & Assistant Creation

**User Story:** As a new user, I want to sign up, create my organization, and get a functional AI assistant with a phone number so I can start receiving calls.

- [ ] **Step 1: Account Creation**
    - [ ] Navigate to `/` (landing page).
    - [ ] Click "Get Started" or "Sign Up".
    - [ ] Complete registration form with new user details.
    - [ ] Verify email (if required).
    - **Expected:** User account created, redirected to onboarding.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Organization & Assistant Setup**
    - [ ] Complete onboarding wizard:
        - [ ] Step 1: Organization details (e.g., "Test Market Co", HVAC, +15551234567).
        - [ ] Step 2: Industry selection (e.g., HVAC).
        - [ ] Step 3: Language preference (e.g., English).
        - [ ] Step 4: AI Assistant creation (e.g., "Market Test Assistant").
        - [ ] Step 5: Success confirmation.
    - **Expected:** Organization created, AI Assistant configured, **real phone number assigned**.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 3: Initial Login & Dashboard View**
    - [ ] Verify redirected to dashboard.
    - [ ] Check dashboard shows setup progress.
    - [ ] Verify assistant is listed in `/assistants` with the assigned phone number.
    - **Expected:** Seamless login, correct dashboard, assistant visible with phone number.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

### 1.2 [ ] AI Assistant Core Functionality

**User Story:** As a business owner, I want my AI assistant to answer calls and perform basic tasks like booking appointments so I can serve my customers.

- [ ] **Step 1: Make a Test Call**
    - [ ] Using a separate phone, call the assigned phone number of the newly created assistant.
    - [ ] Engage in a basic conversation (e.g., "Hello, I'd like to book an appointment for HVAC repair.").
    - **Expected:** Assistant answers, engages in conversation.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Test Appointment Booking**
    - [ ] During the call, attempt to book an appointment (e.g., "Can I book for tomorrow at 2 PM?").
    - [ ] Provide necessary details (customer name, phone, service type).
    - **Expected:** Assistant confirms appointment details.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 3: Verify Call Logs**
    - [ ] After the call ends, navigate to `/activity/calls` or the Admin Dashboard Call Logs.
    - [ ] Verify the call appears in the logs with correct duration and status.
    - **Expected:** Call logged accurately.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

### 1.3 [ ] Call Metering & Hard Cut-off

**User Story:** As a business owner, I want to ensure I don't incur unexpected costs, so the system should stop calls when my allocated minutes are used up.

- [ ] **Step 1: Exhaust Allocated Minutes**
    - [ ] Set the organization's `minutes_used_this_cycle` to just below `monthly_minutes_allocation` (e.g., 99/100 minutes).
    - [ ] Make a short call (e.g., 1 minute).
    - **Expected:** Call connects, `minutes_used_this_cycle` updates to 100.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Test Hard Cut-off**
    - [ ] Attempt to make another call to the assistant.
    - **Expected:** Call is immediately terminated with the "insufficient minutes" message.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 3: Test Inactive Subscription Cut-off**
    - [ ] Change the organization's `subscription_status` to 'canceled' (via Supabase console for now).
    - [ ] Attempt to make a call to the assistant.
    - **Expected:** Call is immediately terminated with the "subscription inactive" message.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
### 1.4 [ ] Google Calendar Sync (Core Flow)

**User Story:** As a business owner, I want my AI assistant to sync appointments with my Google Calendar so I can manage my schedule effectively.

- [ ] **Step 1: Connect Google Calendar**
    - [ ] Navigate to `/settings/phone-calendar`.
    - [ ] Click "Connect Google Calendar".
    - [ ] Complete the Google OAuth flow, granting necessary permissions.
    - **Expected:** Successful connection, calendar details (email) displayed, status shows "Connected".
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Book Appointment & Verify Sync**
    - [ ] Make a call to the AI assistant and book an appointment.
    - [ ] Verify the appointment appears in the connected Google Calendar.
    - **Expected:** Appointment appears in Google Calendar.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 3: Disconnect Calendar**
    - [ ] Click "Disconnect" on the `/settings/phone-calendar` page.
    - [ ] Confirm disconnection.
    - **Expected:** Calendar status shows "Not Connected".
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

### 1.5 [ ] Demo Call Feature

**User Story:** As a prospective user, I want to experience the AI agent firsthand by requesting a demo call from the homepage, so I can understand the service better before signing up.

- [ ] **Step 1: Request Demo Call**
    - [ ] Navigate to the homepage (`/`).
    - [ ] Fill out the demo call form (Name, Phone Number, Optional Industry).
    - [ ] Check the consent box.
    - [ ] Click "Call Me Now".
    - **Expected:** Instant feedback message displayed, indicating a call is incoming.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Receive & Interact with Demo Call**
    - [ ] Answer the incoming call on the provided phone number.
    - [ ] Interact with the AI agent, asking questions about the service.
    - [ ] Engage in interactive demonstrations (e.g., "Try booking an appointment").
    - [ ] If offered, request a signup link via SMS.
    - **Expected:** AI agent explains service, showcases features, answers questions, and sends SMS if requested.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 3: Verify Call Logging & Follow-up Data**
    - [ ] After the call ends, log in as an Admin.
    - [ ] Navigate to the Admin Dashboard -> Demo Calls section (once implemented).
    - [ ] Verify a new entry exists for the demo call with correct details (name, phone, status, duration, transcript, etc.).
    - [ ] Verify `follow_up_flag` and `conversion_status` are set appropriately (if applicable).
    - **Expected:** Demo call accurately logged, relevant follow-up data captured.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

---

## ✅ Phase 2: Essential Management & Billing (Post-Launch Refinement)

**Objective: Validate features essential for ongoing management, billing, and user experience improvements after initial market testing.**

### 2.1 [ ] Team Management

**User Story:** As an organization owner, I want to invite and manage team members so we can collaborate effectively.

- [ ] **Step 1: Invite New Member**
    - [ ] Navigate to `/settings/team`.
    - [ ] Invite a new user with 'member' role.
    - **Expected:** Invitation sent, new user receives email.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Accept Invitation & Verify Role**
    - [ ] Log in as the invited user (different browser).
    - [ ] Accept the invitation.
    - [ ] Verify the new member appears in the team list with the correct role.
    - **Expected:** Member added, role correct.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 3: Change Role & Remove Member**
    - [ ] Change member's role to 'admin'.
    - [ ] Remove the member.
    - **Expected:** Role change works, member removed.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
### 2.2 [ ] Buy More Minutes

**User Story:** As a business owner, I want to easily purchase additional minutes when I run out so my service can continue uninterrupted.

- [ ] **Step 1: Purchase Minute Bundle**
    - [ ] Navigate to `/billing`.
    - [ ] Select a minute bundle (e.g., 100 minutes).
    - [ ] Click "Buy Now" and complete the Stripe Checkout process.
    - **Expected:** Stripe Checkout successful, redirected back to `/billing`.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: Verify Credit Minutes**
    - [ ] On the `/billing` page, verify `credit_minutes` has increased by the purchased amount.
    - [ ] Make calls to consume some credit minutes.
    - **Expected:** `credit_minutes` are consumed, calls proceed.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
### 2.3 [ ] User Notifications (Usage Thresholds)

**User Story:** As a business owner, I want to be notified when my minutes are running low or exhausted so I can take action.

- [ ] **Step 1: Trigger Low Usage Notification**
    - [ ] Set `minutes_used_this_cycle` to trigger the 80% threshold (e.g., 80/100 minutes).
    - [ ] Manually trigger the `check-usage-notifications` Edge Function.
    - **Expected:** Email notification sent to organization owner about low minutes.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
- [ ] **Step 2: Trigger Exhausted Minutes Notification**
    - [ ] Set `minutes_used_this_cycle` to trigger the 100% threshold (e.g., 100/100 minutes).
    - [ ] Manually trigger the `check-usage-notifications` Edge Function.
    - **Expected:** Email notification sent to organization owner about exhausted minutes.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
### 2.4 [ ] Admin Dashboard (Basic Monitoring)

**User Story:** As an administrator, I want to see an overview of organizations and call activity so I can monitor system health.

- [ ] **Step 1: Access Admin Dashboard**
    - [ ] Log in as an `admin` user.
    - [ ] Navigate to `/admin`.
    - **Expected:** Admin Dashboard loads, showing "All Organizations" and "All Call Logs" sections.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **Step 2: View Organizations Data**
    - [ ] Verify the "All Organizations" table displays all organizations with correct subscription and usage data.
    - **Expected:** Accurate list of organizations with usage metrics.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
- [ ] **Step 3: View Call Logs Data**
    - [ ] Verify the "All Call Logs" table displays recent call activity with correct details.
    - **Expected:** Accurate list of call logs.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

---

## ✅ Phase 3: Advanced Features & Edge Cases (Ongoing Development)

**Objective: Comprehensive testing of all remaining features, edge cases, performance, and security for long-term stability and growth.**

- [ ] **3.1 Full Admin Dashboard Functionality**
    - [ ] Test adjusting `minutes_used_this_cycle` and `credit_minutes` for an organization.
    - [ ] Test updating `overage_markup_percentage` in system settings.
    - [ ] Verify changes persist and impact usage calculations.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **3.2 Comprehensive Error Handling**
    - [ ] Intentionally trigger various error conditions across all flows.
    - [ ] Verify graceful error messages and logging.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

- [ ] **3.3 Performance & Security Testing**
    - [ ] Conduct load testing on critical API endpoints.
    - [ ] Perform security audits (e.g., input validation, data isolation).
    - **Status:** [ ] Pass [ ] Fail (Document: ______)n
- [ ] **3.4 Remaining Features from Original Plan**
    - [ ] All other flows from the original `COMPREHENSIVE_TESTING_PLAN.md` not covered above.
    - **Status:** [ ] Pass [ ] Fail (Document: ______)

---

## 📝 Error Documentation Format

When an error is found, document it clearly:

**Issue:** [Brief Title of Issue]
**Flow:** [e.g., 1.1 User Onboarding - Step 2]
**Steps to Reproduce:**
1. ...
2. ...
**Expected Result:** ...
**Actual Result:** ...
**Severity:** [Critical/High/Medium/Low]
**Screenshot/Logs:** [Attach relevant screenshots or log snippets]

---

## 🎯 NEXT STEPS (TODAY!)

1.  **Execute Phase 1 Testing:** Systematically go through each step in Phase 1.
2.  **Document All Findings:** Use the error documentation format for any issues.
3.  **Prioritize & Fix Critical Bugs:** Address any "Fail" items in Phase 1 immediately.
4.  **Re-test Phase 1:** Ensure all fixes are verified.
5.  **Deploy for Market Testing:** Once Phase 1 is clear, deploy the application.
6.  **Continue with Phase 2 & 3:** Systematically work through remaining phases.
