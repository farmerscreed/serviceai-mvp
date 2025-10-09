# 🏗️ System Architecture

**ServiceAI Platform Architecture Overview**

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ServiceAI Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Frontend  │    │   Backend   │    │  Database   │         │
│  │             │    │             │    │             │         │
│  │ • Next.js   │◄──►│ • API Routes│◄──►│ • Supabase  │         │
│  │ • React     │    │ • Edge Fns  │    │ • PostgreSQL│         │
│  │ • Tailwind  │    │ • Webhooks  │    │ • RLS       │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   External  │    │   Services  │    │   Storage   │         │
│  │   APIs      │    │             │    │             │         │
│  │             │    │ • Vapi.ai   │    │ • File      │         │
│  │ • Vapi.ai   │    │ • Twilio    │    │   Storage   │         │
│  │ • Twilio    │    │ • Stripe    │    │ • CDN       │         │
│  │ • Stripe    │    │ • Calendar  │    │ • Logs      │         │
│  │ • Calendar  │    │   APIs      │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### **1. Frontend (Next.js)**
- **Framework:** Next.js 14 with App Router
- **UI:** React + Tailwind CSS + shadcn/ui
- **State:** React Context + Local State
- **Authentication:** Supabase Auth

**Key Pages:**
- `/dashboard` - Main dashboard
- `/assistants` - AI assistant management
- `/appointments` - Appointment booking
- `/settings` - Organization settings
- `/onboarding` - New user setup

### **2. Backend (API Routes)**
- **Framework:** Next.js API Routes
- **Authentication:** Supabase Auth middleware
- **Validation:** Zod schemas
- **Error Handling:** Centralized error responses

**Key APIs:**
- `/api/assistants` - AI assistant CRUD
- `/api/appointments` - Appointment management
- `/api/webhooks/vapi` - Vapi.ai webhooks
- `/api/webhooks/sms` - Twilio SMS webhooks
- `/api/organizations` - Organization management

### **3. Database (Supabase)**
- **Database:** PostgreSQL
- **Security:** Row Level Security (RLS)
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage

**Core Tables:**
- `organizations` - Multi-tenant organizations
- `users` - User profiles
- `vapi_assistants` - AI assistants
- `appointments` - Appointment bookings
- `customers` - Customer records
- `emergency_contacts` - Emergency contact management

---

## Data Flow

### **1. User Onboarding Flow**
```
User Signup → Organization Creation → Industry Selection → 
Assistant Creation → Phone Provisioning → Calendar Setup → 
Emergency Contacts → Ready to Use
```

### **2. Inbound Call Flow**
```
Customer Calls → Vapi.ai Routes → AI Assistant Answers → 
Language Detection → Intent Recognition → Action Execution → 
(SMS/Calendar/Transfer) → Call Logging
```

### **3. Appointment Booking Flow**
```
Customer Requests Appointment → AI Checks Availability → 
Calendar Integration → SMS Confirmation → Database Update → 
Reminder Scheduling
```

### **4. Emergency Detection Flow**
```
Emergency Keywords Detected → Urgency Score Calculated → 
Emergency Contact Notified → SMS Alert Sent → 
Call Transfer Initiated → Logging
```

---

## Multi-Tenancy Architecture

### **Organization Isolation**
- **Database:** RLS policies enforce organization-level isolation
- **API:** All endpoints check organization membership
- **UI:** Organization context throughout the app
- **Phone Numbers:** Unique phone numbers per organization

### **Data Segregation**
```sql
-- Example RLS Policy
CREATE POLICY "Users can only access their organization's data"
ON appointments
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);
```

---

## Integration Architecture

### **1. Vapi.ai Integration**
- **Purpose:** AI voice assistant management
- **Authentication:** API key-based
- **Webhooks:** Real-time call events
- **Phone Numbers:** Automatic provisioning

**Key Features:**
- Assistant creation and management
- Phone number assignment
- Call routing and handling
- Real-time call monitoring

### **2. Twilio Integration**
- **Purpose:** SMS messaging
- **Authentication:** Account SID + Auth Token
- **Webhooks:** SMS delivery status
- **Phone Numbers:** SMS-capable numbers

**Key Features:**
- Multi-language SMS templates
- Delivery tracking
- Two-way SMS handling
- Emergency notifications

### **3. Calendar Integration**
- **Providers:** Google, Outlook, Calendly
- **Authentication:** OAuth 2.0
- **Operations:** Create, update, delete events
- **Sync:** Bidirectional calendar sync

**Key Features:**
- Availability checking
- Event creation
- Conflict resolution
- Multi-provider support

### **4. Stripe Integration**
- **Purpose:** Billing and subscriptions
- **Authentication:** API keys
- **Webhooks:** Payment events
- **Models:** Subscriptions, invoices, customers

**Key Features:**
- Subscription management
- Usage-based billing
- Invoice generation
- Payment processing

---

## Security Architecture

### **Authentication & Authorization**
- **Primary:** Supabase Auth (JWT tokens)
- **Middleware:** API route protection
- **RLS:** Database-level security
- **Roles:** Owner, Admin, Member

### **Data Protection**
- **Encryption:** At rest and in transit
- **Secrets:** Environment variables
- **API Keys:** Secure storage
- **Webhooks:** Signature verification

### **Multi-Tenant Security**
- **Isolation:** Organization-level data separation
- **Access Control:** Role-based permissions
- **Audit:** All actions logged
- **Compliance:** GDPR-ready architecture

---

## Scalability Considerations

### **Database Scaling**
- **Connection Pooling:** Supabase handles this
- **Indexing:** Optimized for common queries
- **Partitioning:** By organization_id
- **Caching:** Redis for frequently accessed data

### **API Scaling**
- **Edge Functions:** Global distribution
- **Rate Limiting:** Per-organization limits
- **Caching:** API response caching
- **CDN:** Static asset delivery

### **External Service Scaling**
- **Vapi.ai:** Handles call scaling
- **Twilio:** SMS scaling built-in
- **Stripe:** Payment processing scaling
- **Calendar APIs:** Provider-specific limits

---

## Monitoring & Observability

### **Application Monitoring**
- **Error Tracking:** Sentry integration
- **Performance:** Core Web Vitals
- **Uptime:** Health check endpoints
- **Logs:** Structured logging

### **Business Metrics**
- **Call Volume:** Calls per organization
- **SMS Delivery:** Success rates
- **Appointment Booking:** Conversion rates
- **Emergency Detection:** Accuracy rates

### **Infrastructure Monitoring**
- **Database:** Query performance
- **API:** Response times
- **External APIs:** Service health
- **Webhooks:** Delivery success

---

## Development Workflow

### **Local Development**
```bash
# Start development server
npm run dev

# Run database migrations
supabase db push

# Run tests
npm test

# Type checking
npm run type-check
```

### **Deployment Pipeline**
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Run production tests
npm run test:prod
```

### **Database Migrations**
```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

---

## Technology Stack

### **Frontend**
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** React Context

### **Backend**
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Validation:** Zod

### **External Services**
- **AI Voice:** Vapi.ai
- **SMS:** Twilio
- **Payments:** Stripe
- **Calendar:** Google, Outlook, Calendly
- **Deployment:** Vercel

### **Development Tools**
- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript
- **Testing:** Jest + Playwright

---

**Last Updated:** October 8, 2025  
**Architecture Version:** MVP Production Ready
