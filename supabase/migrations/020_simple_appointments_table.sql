-- ============================================================================
-- SIMPLE APPOINTMENTS TABLE
-- Migration 020: Create appointments table step by step
-- ============================================================================

-- First, let's check if appointments table exists and drop it if it does
DROP TABLE IF EXISTS public.appointments CASCADE;

-- Create the appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    vapi_call_id VARCHAR(255),
    
    -- Customer information (denormalized for easy access)
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

-- Create indexes
CREATE INDEX idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX idx_appointments_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_customer_phone ON public.appointments(customer_phone);
CREATE INDEX idx_appointments_type ON public.appointments(appointment_type);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization's appointments"
    ON public.appointments
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their organization's appointments"
    ON public.appointments
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.appointments TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 020 completed successfully!';
    RAISE NOTICE 'Created appointments table with all required columns';
    RAISE NOTICE 'Set up RLS policies for multi-tenant security';
END$$;
