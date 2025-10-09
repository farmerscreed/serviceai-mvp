# 🚀 Quick Start Guide

**Get ServiceAI running in 5 minutes**

---

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Vapi.ai account
- Twilio account (for SMS)

---

## Step 1: Clone & Install

```bash
git clone <repository-url>
cd ServiceAI
npm install
```

---

## Step 2: Environment Setup

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Vapi.ai
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_URL=https://yourdomain.com/api/webhooks/vapi

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+15551234567

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3: Database Setup

1. **Go to Supabase Dashboard → SQL Editor**
2. **Apply migrations in order:**
   - `supabase/migrations/013_create_update_timestamp_function.sql`
   - `supabase/migrations/015_call_transfers.sql`
   - `supabase/migrations/016_emergency_contacts.sql`
   - `supabase/migrations/017_verify_appointments_schema.sql`
   - `supabase/migrations/018_add_email_to_user_profiles.sql`
   - `supabase/migrations/020_simple_appointments_table.sql`

---

## Step 4: Start Development

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## Step 5: Create Your First Organization

1. **Sign up** for a new account
2. **Complete onboarding** wizard
3. **Create AI assistant** during onboarding
4. **Test your assistant** with a phone call

---

## 🎯 What You'll Have

✅ **Working AI Assistant** - Handles customer calls  
✅ **Multi-Language Support** - English and Spanish  
✅ **Appointment Booking** - Automatic scheduling  
✅ **SMS Notifications** - Confirmations and reminders  
✅ **Emergency Detection** - Smart routing  
✅ **Multi-Tenant** - Isolated organizations  

---

## 🆘 Need Help?

- **[Environment Setup](ENVIRONMENT_SETUP.md)** - Detailed environment configuration
- **[Troubleshooting](../TESTING/TROUBLESHOOTING.md)** - Common issues and solutions
- **[API Reference](../DEVELOPMENT/API_REFERENCE.md)** - API documentation

---

**Next Steps:**
- [Production Deployment](DEPLOYMENT.md)
- [Vapi.ai Integration](../INTEGRATIONS/VAPI_SETUP.md)
- [Twilio SMS Setup](../INTEGRATIONS/TWILIO_SETUP.md)
