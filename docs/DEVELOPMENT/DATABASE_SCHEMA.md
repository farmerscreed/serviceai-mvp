# Database Schema Documentation

**Complete database design and migration guide for ServiceAI**

---

## Overview

ServiceAI uses Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenant data isolation. This document covers:
- Complete database schema
- Migration files and deployment
- RLS policies and security
- Indexes and performance optimization

---

## Database Architecture

### Multi-Tenant Design
- **Organization-based isolation** - All data scoped to organizations
- **Row Level Security (RLS)** - Database-level access control
- **User roles** - Owner, Admin, Member permissions
- **Audit trails** - Created/updated timestamps on all tables

---

## Core Tables

### 1. Authentication & Users

#### `auth.users` (Supabase Auth)
```sql
-- Managed by Supabase Auth
-- Contains: id, email, encrypted_password, email_confirmed_at, etc.
```

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    preferred_language VARCHAR(5) DEFAULT 'en',
    email VARCHAR(255), -- Synced from auth.users
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Organizations & Multi-Tenancy

#### `organizations`
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Phone configuration
    phone_provider VARCHAR(20) DEFAULT 'vapi',
    twilio_account_sid VARCHAR(255),
    twilio_auth_token TEXT,
    byo_sip_credentials JSONB,
    
    -- Calendar integration
    calendar_provider VARCHAR(20),
    google_calendar_id VARCHAR(255),
    google_refresh_token TEXT,
    outlook_calendar_id VARCHAR(255),
    outlook_refresh_token TEXT,
    calendly_api_key VARCHAR(255),
    calendly_user_uri VARCHAR(255),
    calendar_sync_enabled BOOLEAN DEFAULT false,
    calendar_metadata JSONB DEFAULT '{}',
    
    -- Transfer settings
    transfer_phone_number VARCHAR(20),
    transfer_mode VARCHAR(10) DEFAULT 'warm',
    emergency_contact_phone VARCHAR(20),
    max_transfer_wait_time INTEGER DEFAULT 30,
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `organization_members`
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);
```

#### `organization_invitations`
```sql
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. AI Assistants & Phone Numbers

#### `vapi_assistants`
```sql
CREATE TABLE vapi_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vapi_assistant_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    language VARCHAR(5) NOT NULL CHECK (language IN ('en', 'es')),
    system_prompt TEXT NOT NULL,
    voice_config JSONB NOT NULL,
    tools_config JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `phone_number_assignments`
```sql
CREATE TABLE phone_number_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vapi_assistant_id UUID REFERENCES vapi_assistants(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    vapi_phone_number_id VARCHAR(255),
    phone_provider VARCHAR(20) NOT NULL CHECK (phone_provider IN ('vapi', 'twilio', 'byo')),
    capabilities TEXT[] DEFAULT '{"voice"}',
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, phone_number)
);
```

### 4. Customers & Appointments

#### `customers`
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    primary_language VARCHAR(5) DEFAULT 'en' CHECK (primary_language IN ('en', 'es')),
    sms_enabled BOOLEAN DEFAULT true,
    total_appointments INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_appointment_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, phone_number)
);
```

#### `appointments`
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    vapi_call_id VARCHAR(255),
    
    -- Customer information (denormalized)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    service_address TEXT,
    
    -- Appointment details
    appointment_type VARCHAR(50) NOT NULL,
    service_description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- Language and communication
    language_preference VARCHAR(5) DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
    sms_sent BOOLEAN DEFAULT false,
    sms_reminder_sent BOOLEAN DEFAULT false,
    
    -- Calendar integration
    google_calendar_event_id VARCHAR(255),
    outlook_calendar_event_id VARCHAR(255),
    calendly_event_id VARCHAR(255),
    calendar_provider VARCHAR(20) CHECK (calendar_provider IN ('google', 'outlook', 'calendly', 'none')),
    
    -- Metadata
    urgency_score DECIMAL(3,2) CHECK (urgency_score >= 0 AND urgency_score <= 1),
    emergency_detected BOOLEAN DEFAULT false,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
```

### 5. Communication & Logs

#### `call_logs`
```sql
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vapi_call_id VARCHAR(255) UNIQUE NOT NULL,
    vapi_assistant_id UUID REFERENCES vapi_assistants(id) ON DELETE SET NULL,
    customer_phone_number VARCHAR(20) NOT NULL,
    call_duration INTEGER, -- seconds
    call_status VARCHAR(20) NOT NULL,
    language_detected VARCHAR(5),
    emergency_detected BOOLEAN DEFAULT false,
    urgency_score DECIMAL(3,2),
    transcript TEXT,
    summary TEXT,
    tools_used JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sms_communications`
```sql
CREATE TABLE sms_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'undelivered')),
    twilio_message_sid VARCHAR(255),
    template_key VARCHAR(100),
    variables JSONB DEFAULT '{}',
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Call Transfers & Emergency Management

#### `call_transfers`
```sql
CREATE TABLE call_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vapi_call_id VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    urgency VARCHAR(20),
    summary TEXT,
    customer_name VARCHAR(255),
    transfer_to VARCHAR(20),
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN ('initiated', 'connecting', 'connected', 'completed', 'failed', 'no_answer')),
    connected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `emergency_contacts`
```sql
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    available_days TEXT[], -- ['monday', 'tuesday', ...]
    available_hours_start TIME,
    available_hours_end TIME,
    priority INTEGER DEFAULT 1, -- 1 = highest priority
    escalation_timeout INTEGER DEFAULT 30, -- seconds
    sms_enabled BOOLEAN DEFAULT true,
    call_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `emergency_notifications`
```sql
CREATE TABLE emergency_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    emergency_contact_id UUID REFERENCES emergency_contacts(id) ON DELETE SET NULL,
    vapi_call_id VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL,
    urgency VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'acknowledged')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. Billing & Subscriptions

#### `billing_subscriptions`
```sql
CREATE TABLE billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `billing_invoices`
```sql
CREATE TABLE billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    amount_paid INTEGER NOT NULL, -- cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(20) NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Indexes

### Performance Indexes
```sql
-- Organization-based queries
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_vapi_assistants_org ON vapi_assistants(organization_id);
CREATE INDEX idx_phone_assignments_org ON phone_number_assignments(organization_id);
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_appointments_org ON appointments(organization_id);
CREATE INDEX idx_call_logs_org ON call_logs(organization_id);
CREATE INDEX idx_sms_communications_org ON sms_communications(organization_id);

-- Date-based queries
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_call_logs_created ON call_logs(created_at);
CREATE INDEX idx_sms_created ON sms_communications(created_at);

-- Status queries
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_call_logs_status ON call_logs(call_status);

-- Phone number lookups
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_appointments_phone ON appointments(customer_phone);
CREATE INDEX idx_phone_assignments_number ON phone_number_assignments(phone_number);

-- Emergency contacts
CREATE INDEX idx_emergency_contacts_org ON emergency_contacts(organization_id);
CREATE INDEX idx_emergency_contacts_priority ON emergency_contacts(priority);
```

---

## Row Level Security (RLS)

### RLS Policies

All tables have RLS enabled with organization-based isolation:

```sql
-- Example RLS policy for appointments
CREATE POLICY "Users can view their organization's appointments"
ON appointments
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their organization's appointments"
ON appointments
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
    )
);
```

### User Roles
- **Owner** - Full access to organization
- **Admin** - Manage users, settings, data
- **Member** - View and manage appointments, customers

---

## Migration Files

### Current Migrations
```
supabase/migrations/
├── 013_create_update_timestamp_function.sql
├── 015_call_transfers.sql
├── 016_emergency_contacts.sql
├── 017_verify_appointments_schema.sql
├── 018_add_email_to_user_profiles.sql
└── 020_simple_appointments_table.sql
```

### Migration Deployment

1. **Apply in order:**
```bash
# Apply migrations in Supabase Dashboard → SQL Editor
# Or use Supabase CLI:
supabase db push
```

2. **Verify deployment:**
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## Functions

### Helper Functions

#### `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### `get_available_time_slots()`
```sql
CREATE OR REPLACE FUNCTION get_available_time_slots(
    org_id UUID,
    target_date DATE,
    slot_duration INTEGER DEFAULT 60
)
RETURNS TABLE (
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
-- Implementation for checking appointment availability
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `get_on_call_contact()`
```sql
CREATE OR REPLACE FUNCTION get_on_call_contact(
    org_id UUID, 
    urgency TEXT
)
RETURNS emergency_contacts AS $$
-- Implementation for finding available emergency contact
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Data Relationships

### Entity Relationship Diagram
```
organizations (1) ←→ (many) organization_members
organizations (1) ←→ (many) vapi_assistants
organizations (1) ←→ (many) phone_number_assignments
organizations (1) ←→ (many) customers
organizations (1) ←→ (many) appointments
organizations (1) ←→ (many) call_logs
organizations (1) ←→ (many) sms_communications
organizations (1) ←→ (many) emergency_contacts
organizations (1) ←→ (many) billing_subscriptions

customers (1) ←→ (many) appointments
vapi_assistants (1) ←→ (many) call_logs
emergency_contacts (1) ←→ (many) emergency_notifications
```

---

## Security Considerations

### Data Protection
- **Encryption at rest** - Supabase handles this
- **Encryption in transit** - HTTPS/TLS
- **API key security** - Environment variables
- **Webhook security** - Signature verification

### Access Control
- **RLS policies** - Database-level isolation
- **API authentication** - Supabase Auth
- **Role-based permissions** - Owner/Admin/Member
- **Audit logging** - All changes tracked

---

## Performance Optimization

### Query Optimization
- **Proper indexing** - On frequently queried columns
- **Connection pooling** - Supabase handles this
- **Query optimization** - Use EXPLAIN ANALYZE
- **Caching** - Redis for frequently accessed data

### Scaling Considerations
- **Partitioning** - By organization_id for large datasets
- **Read replicas** - For analytics queries
- **Archiving** - Old call logs and SMS
- **Monitoring** - Query performance metrics

---

## Backup & Recovery

### Backup Strategy
- **Automated backups** - Supabase handles daily backups
- **Point-in-time recovery** - Available for Pro plans
- **Export capabilities** - CSV/JSON exports
- **Migration versioning** - Git-tracked migrations

### Disaster Recovery
- **Multi-region deployment** - Supabase global infrastructure
- **Backup testing** - Regular restore tests
- **Documentation** - Recovery procedures
- **Monitoring** - Backup success alerts

---

**Last Updated:** October 8, 2025  
**Schema Version:** MVP Production Ready
