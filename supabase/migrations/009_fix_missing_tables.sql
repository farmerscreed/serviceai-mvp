-- Fix Missing Tables and Foreign Key References
-- This migration creates all missing tables and fixes foreign key references

-- =====================================================
-- CREATE CUSTOMERS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Customer Information
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- Language Preferences
    primary_language VARCHAR(5) DEFAULT 'en' CHECK (primary_language IN ('en', 'es')),
    secondary_languages VARCHAR[] DEFAULT '{}',
    
    -- Contact Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    
    -- Customer Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    customer_type VARCHAR(20) DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
    
    -- SMS Preferences
    sms_enabled BOOLEAN DEFAULT TRUE,
    sms_language VARCHAR(5) DEFAULT 'en' CHECK (sms_language IN ('en', 'es', 'auto')),
    sms_opt_in_date TIMESTAMPTZ,
    sms_opt_out_date TIMESTAMPTZ,
    
    -- Notes and Tags
    notes TEXT,
    tags VARCHAR[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one customer per phone number per organization
    UNIQUE(organization_id, phone_number)
);

-- =====================================================
-- CREATE APPOINTMENTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    
    -- Appointment Details
    service_type VARCHAR(100) NOT NULL,
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('emergency', 'repair', 'maintenance', 'inspection', 'consultation')),
    
    -- Scheduling
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    
    -- Location
    service_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    
    -- Contact Information
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Notes
    description TEXT,
    notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE SERVICES TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Service Details
    service_type VARCHAR(100) NOT NULL,
    service_category VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- Scheduling
    scheduled_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE EMERGENCY ALERTS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    source VARCHAR(20) NOT NULL DEFAULT 'sms' CHECK (source IN ('sms', 'call', 'web', 'app')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- =====================================================
-- CREATE SERVICE SATISFACTION TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.service_satisfaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    satisfaction_level VARCHAR(20) NOT NULL CHECK (satisfaction_level IN ('positive', 'neutral', 'negative')),
    feedback TEXT,
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    source VARCHAR(20) NOT NULL DEFAULT 'sms' CHECK (source IN ('sms', 'call', 'web', 'app')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON public.customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_primary_language ON public.customers(primary_language);
CREATE INDEX IF NOT EXISTS idx_customers_sms_enabled ON public.customers(sms_enabled);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON public.appointments(service_type);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON public.services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_customer_id ON public.services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_scheduled_date ON public.services(scheduled_date);

-- Emergency alerts indexes
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_customer_id ON public.emergency_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_organization_id ON public.emergency_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts(created_at);

-- Service satisfaction indexes
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_customer_id ON public.service_satisfaction(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_organization_id ON public.service_satisfaction(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_satisfaction_level ON public.service_satisfaction(satisfaction_level);
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_created_at ON public.service_satisfaction(created_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_satisfaction ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Customers RLS policies
CREATE POLICY "Users can view customers for their organization"
ON public.customers FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert customers for their organization"
ON public.customers FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update customers for their organization"
ON public.customers FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete customers for their organization"
ON public.customers FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Appointments RLS policies
CREATE POLICY "Users can view appointments for their organization"
ON public.appointments FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert appointments for their organization"
ON public.appointments FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update appointments for their organization"
ON public.appointments FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete appointments for their organization"
ON public.appointments FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Services RLS policies
CREATE POLICY "Users can view services for their organization"
ON public.services FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert services for their organization"
ON public.services FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update services for their organization"
ON public.services FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete services for their organization"
ON public.services FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Emergency alerts RLS policies
CREATE POLICY "Users can view emergency alerts for their organization"
ON public.emergency_alerts FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert emergency alerts for their organization"
ON public.emergency_alerts FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update emergency alerts for their organization"
ON public.emergency_alerts FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Service satisfaction RLS policies
CREATE POLICY "Users can view service satisfaction for their organization"
ON public.service_satisfaction FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert service satisfaction for their organization"
ON public.service_satisfaction FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp for customers
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Trigger to update updated_at timestamp for appointments
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Trigger to update updated_at timestamp for services
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON public.customers TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

GRANT ALL ON public.appointments TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

GRANT ALL ON public.services TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

GRANT ALL ON public.emergency_alerts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_alerts TO authenticated;

GRANT ALL ON public.service_satisfaction TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_satisfaction TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed successfully!';
    RAISE NOTICE 'Created tables: customers, appointments, services, emergency_alerts, service_satisfaction';
    RAISE NOTICE 'Created RLS policies for all tables';
    RAISE NOTICE 'Created indexes for performance optimization';
END $$;
