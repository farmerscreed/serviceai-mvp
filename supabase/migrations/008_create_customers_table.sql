-- Task 3.1 & 3.2: Create Customers Table
-- Create the missing customers table that's referenced in SMS and workflow schemas

-- =====================================================
-- CUSTOMERS TABLE
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
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON public.customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_primary_language ON public.customers(primary_language);
CREATE INDEX IF NOT EXISTS idx_customers_sms_enabled ON public.customers(sms_enabled);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
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

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get customers by organization
CREATE OR REPLACE FUNCTION get_organization_customers(p_organization_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    primary_language VARCHAR(5),
    status VARCHAR(20),
    sms_enabled BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone_number,
        c.email,
        c.primary_language,
        c.status,
        c.sms_enabled,
        c.created_at
    FROM public.customers c
    WHERE c.organization_id = p_organization_id
    AND c.status = 'active'
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find customer by phone number
CREATE OR REPLACE FUNCTION find_customer_by_phone(p_phone_number VARCHAR(20), p_organization_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    primary_language VARCHAR(5),
    sms_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone_number,
        c.email,
        c.primary_language,
        c.sms_enabled
    FROM public.customers c
    WHERE c.phone_number = p_phone_number
    AND c.organization_id = p_organization_id
    AND c.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON public.customers TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_organization_customers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_customer_by_phone(VARCHAR(20), UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.customers IS 'Stores customer information for each organization with language and SMS preferences';
COMMENT ON COLUMN public.customers.organization_id IS 'Organization that owns this customer';
COMMENT ON COLUMN public.customers.primary_language IS 'Customer''s preferred language (en, es)';
COMMENT ON COLUMN public.customers.secondary_languages IS 'Additional languages the customer speaks';
COMMENT ON COLUMN public.customers.sms_enabled IS 'Whether customer has opted in to SMS communications';
COMMENT ON COLUMN public.customers.sms_language IS 'Preferred language for SMS communications';
COMMENT ON COLUMN public.customers.sms_opt_in_date IS 'When customer opted in to SMS';
COMMENT ON COLUMN public.customers.sms_opt_out_date IS 'When customer opted out of SMS';
COMMENT ON COLUMN public.customers.tags IS 'Custom tags for customer categorization';
