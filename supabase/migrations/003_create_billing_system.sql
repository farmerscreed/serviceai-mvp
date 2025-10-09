-- ============================================================================
-- BILLING & SUBSCRIPTIONS SCHEMA
-- Migration 003: Create billing tables, usage tracking, and subscription management
-- ============================================================================

-- ============================================================================
-- ENHANCE: organizations table with billing fields
-- ============================================================================
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Update subscription_status constraint to include all Stripe statuses
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_subscription_status_check 
  CHECK (subscription_status IN (
    'trialing', 'active', 'past_due', 'canceled', 
    'incomplete', 'incomplete_expired', 'unpaid'
  ));

-- Create indexes for billing queries
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON public.organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON public.organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);

-- ============================================================================
-- TABLE: subscription_plans
-- Defines available subscription tiers with features and limits
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan identification
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    
    -- Stripe IDs
    stripe_price_id_monthly VARCHAR(255) UNIQUE,
    stripe_price_id_yearly VARCHAR(255) UNIQUE,
    stripe_product_id VARCHAR(255) NOT NULL,
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'usd',
    
    -- Features & Limits (JSON structure for flexibility)
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    /* Example limits structure:
    {
      "calls_per_month": 500,
      "sms_per_month": 500,
      "templates": 1,
      "team_members": 3,
      "support": "email"
    }
    Use -1 for unlimited
    */
    
    -- Display & Marketing
    description TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);

-- ============================================================================
-- TABLE: usage_events
-- Logs all billable events for usage tracking and metering
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'call', 'sms', 'template_use', 'api_call'
    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Billing
    billable BOOLEAN DEFAULT TRUE,
    reported_to_stripe BOOLEAN DEFAULT FALSE,
    stripe_usage_record_id VARCHAR(255),
    
    -- Timestamps
    event_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for usage queries
CREATE INDEX IF NOT EXISTS idx_usage_events_org ON public.usage_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON public.usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_time ON public.usage_events(event_time);
CREATE INDEX IF NOT EXISTS idx_usage_events_billable ON public.usage_events(billable, reported_to_stripe);
CREATE INDEX IF NOT EXISTS idx_usage_events_org_time ON public.usage_events(organization_id, event_time);

-- ============================================================================
-- TABLE: payment_history
-- Tracks all payments and invoices
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Stripe data
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- 'paid', 'open', 'void', 'uncollectible', 'draft'
    
    -- Invoice details
    description TEXT,
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,
    
    -- Period
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    
    -- Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payment_history_org ON public.payment_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON public.payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON public.payment_history(paid_at);

-- ============================================================================
-- VIEW: usage_summary
-- Aggregated usage statistics per organization and billing period
-- ============================================================================
CREATE OR REPLACE VIEW public.usage_summary AS
SELECT 
    organization_id,
    event_type,
    DATE_TRUNC('month', event_time) as billing_month,
    COUNT(*) as event_count,
    SUM(quantity) as total_quantity,
    MIN(event_time) as first_event,
    MAX(event_time) as last_event
FROM public.usage_events
WHERE billable = TRUE
GROUP BY organization_id, event_type, DATE_TRUNC('month', event_time);

-- ============================================================================
-- FUNCTION: has_active_subscription
-- Checks if organization has an active subscription (including trial)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_organization_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    org_status VARCHAR;
    trial_end_date TIMESTAMPTZ;
BEGIN
    SELECT 
        subscription_status, 
        trial_end 
    INTO org_status, trial_end_date
    FROM public.organizations
    WHERE id = p_organization_id;
    
    -- Active if: active status OR in valid trial period
    RETURN (
        org_status IN ('active', 'trialing') 
        OR (org_status = 'trialing' AND trial_end_date > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_subscription_limits
-- Returns the limits for an organization's current subscription tier
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_subscription_limits(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
    tier_slug VARCHAR;
    plan_limits JSONB;
BEGIN
    -- Get organization's subscription tier
    SELECT subscription_tier INTO tier_slug
    FROM public.organizations
    WHERE id = p_organization_id;
    
    -- If no tier (shouldn't happen), return empty limits
    IF tier_slug IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;
    
    -- Get limits from subscription plan
    SELECT limits INTO plan_limits
    FROM public.subscription_plans
    WHERE slug = tier_slug
    AND is_active = TRUE;
    
    RETURN COALESCE(plan_limits, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_current_usage
-- Returns usage statistics for the current billing period
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_usage(
    p_organization_id UUID,
    p_event_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    event_type VARCHAR,
    usage_count BIGINT,
    limit_count INTEGER,
    percentage NUMERIC,
    has_limit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH org_data AS (
        SELECT 
            o.current_period_start,
            o.subscription_tier
        FROM public.organizations o
        WHERE o.id = p_organization_id
    ),
    plan_limits AS (
        SELECT sp.limits
        FROM public.subscription_plans sp
        JOIN org_data od ON sp.slug = od.subscription_tier
        WHERE sp.is_active = TRUE
    ),
    current_usage AS (
        SELECT 
            ue.event_type as et,
            COUNT(*) as usage_count
        FROM public.usage_events ue
        CROSS JOIN org_data od
        WHERE ue.organization_id = p_organization_id
        AND ue.billable = TRUE
        AND ue.event_time >= COALESCE(od.current_period_start, DATE_TRUNC('month', NOW()))
        AND (p_event_type IS NULL OR ue.event_type = p_event_type)
        GROUP BY ue.event_type
    )
    SELECT 
        cu.et::VARCHAR as event_type,
        cu.usage_count,
        COALESCE((pl.limits->>(cu.et || '_per_month'))::INTEGER, 0) as limit_count,
        CASE 
            WHEN (pl.limits->>(cu.et || '_per_month'))::INTEGER = -1 THEN 0
            WHEN (pl.limits->>(cu.et || '_per_month'))::INTEGER = 0 THEN 0
            ELSE (cu.usage_count::NUMERIC / NULLIF((pl.limits->>(cu.et || '_per_month'))::INTEGER, 0) * 100)
        END as percentage,
        COALESCE((pl.limits->>(cu.et || '_per_month'))::INTEGER, 0) != -1 as has_limit
    FROM current_usage cu
    CROSS JOIN plan_limits pl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: check_usage_limit
-- Checks if organization can perform an action based on usage limits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    p_organization_id UUID,
    p_event_type VARCHAR
)
RETURNS TABLE (
    allowed BOOLEAN,
    current_usage BIGINT,
    limit_value INTEGER,
    percentage NUMERIC
) AS $$
DECLARE
    usage_data RECORD;
BEGIN
    -- Get current usage for this event type
    SELECT * INTO usage_data
    FROM public.get_current_usage(p_organization_id, p_event_type)
    WHERE event_type = p_event_type;
    
    -- If no usage data exists yet, allow with 0 usage
    IF usage_data IS NULL THEN
        RETURN QUERY SELECT TRUE, 0::BIGINT, 0::INTEGER, 0::NUMERIC;
        RETURN;
    END IF;
    
    -- If unlimited (-1), always allow
    IF usage_data.limit_count = -1 THEN
        RETURN QUERY SELECT 
            TRUE, 
            usage_data.usage_count, 
            usage_data.limit_count, 
            0::NUMERIC;
        RETURN;
    END IF;
    
    -- Check if under limit
    RETURN QUERY SELECT 
        usage_data.usage_count < usage_data.limit_count,
        usage_data.usage_count,
        usage_data.limit_count,
        usage_data.percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: log_usage_event
-- Logs a billable usage event
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_usage_event(
    p_organization_id UUID,
    p_event_type VARCHAR,
    p_quantity INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.usage_events (
        organization_id, 
        event_type, 
        quantity, 
        metadata,
        billable
    )
    VALUES (
        p_organization_id, 
        p_event_type, 
        p_quantity, 
        p_metadata,
        TRUE
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_organization_billing_info
-- Returns complete billing information for an organization
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_organization_billing_info(p_organization_id UUID)
RETURNS TABLE (
    organization_id UUID,
    subscription_tier VARCHAR,
    subscription_status VARCHAR,
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN,
    has_active_sub BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.subscription_tier,
        o.subscription_status,
        o.stripe_customer_id,
        o.stripe_subscription_id,
        o.trial_end,
        o.current_period_start,
        o.current_period_end,
        o.cancel_at_period_end,
        public.has_active_subscription(o.id)
    FROM public.organizations o
    WHERE o.id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Update subscription_plans updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_subscription_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_plans_timestamp ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_timestamp
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscription_plan_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- subscription_plans: Public read access for pricing page
DROP POLICY IF EXISTS "Public can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view active subscription plans"
ON public.subscription_plans FOR SELECT
TO authenticated, anon
USING (is_active = TRUE);

-- usage_events: Organization members can view their org's usage
DROP POLICY IF EXISTS "Organization members can view usage" ON public.usage_events;
CREATE POLICY "Organization members can view usage"
ON public.usage_events FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
);

-- usage_events: System can insert usage (via service role)
DROP POLICY IF EXISTS "System can insert usage events" ON public.usage_events;
CREATE POLICY "System can insert usage events"
ON public.usage_events FOR INSERT
WITH CHECK (TRUE); -- Service role will bypass this anyway

-- payment_history: Organization members can view their payment history
DROP POLICY IF EXISTS "Organization members can view payment history" ON public.payment_history;
CREATE POLICY "Organization members can view payment history"
ON public.payment_history FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
);

-- ============================================================================
-- SEED DATA: Subscription Plans
-- ============================================================================

-- Note: Replace these with your actual Stripe Price IDs after creating products in Stripe
INSERT INTO public.subscription_plans (
    name, 
    slug, 
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    stripe_product_id,
    price_monthly, 
    price_yearly,
    limits,
    features,
    description,
    is_popular,
    sort_order
) VALUES
(
    'Starter',
    'starter',
    'price_starter_monthly', -- Replace with actual Stripe Price ID
    'price_starter_yearly',  -- Replace with actual Stripe Price ID
    'prod_starter',          -- Replace with actual Stripe Product ID
    249.00,
    2490.00,
    '{
        "calls_per_month": 500,
        "sms_per_month": 500,
        "templates": 1,
        "team_members": 3
    }'::jsonb,
    '[
        "500 AI phone calls per month",
        "500 SMS messages per month", 
        "1 industry template",
        "3 team members",
        "Email support",
        "14-day free trial"
    ]'::jsonb,
    'Perfect for small businesses getting started',
    FALSE,
    1
),
(
    'Professional',
    'professional',
    'price_pro_monthly',
    'price_pro_yearly',
    'prod_professional',
    399.00,
    3990.00,
    '{
        "calls_per_month": 2000,
        "sms_per_month": 2000,
        "templates": 3,
        "team_members": 10
    }'::jsonb,
    '[
        "2,000 AI phone calls per month",
        "2,000 SMS messages per month",
        "3 industry templates",
        "10 team members",
        "Priority email support",
        "Advanced analytics",
        "14-day free trial"
    ]'::jsonb,
    'Best for growing businesses',
    TRUE,
    2
),
(
    'Enterprise',
    'enterprise',
    'price_enterprise_monthly',
    'price_enterprise_yearly',
    'prod_enterprise',
    649.00,
    6490.00,
    '{
        "calls_per_month": -1,
        "sms_per_month": -1,
        "templates": -1,
        "team_members": -1
    }'::jsonb,
    '[
        "Unlimited AI phone calls",
        "Unlimited SMS messages",
        "Unlimited templates",
        "Unlimited team members",
        "Dedicated account manager",
        "White-label options",
        "Custom integrations",
        "SLA guarantee",
        "14-day free trial"
    ]'::jsonb,
    'For large organizations with high volume',
    FALSE,
    3
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    limits = EXCLUDED.limits,
    features = EXCLUDED.features,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON public.subscription_plans TO postgres, service_role;
GRANT SELECT ON public.subscription_plans TO authenticated, anon;

GRANT ALL ON public.usage_events TO postgres, service_role;
GRANT SELECT, INSERT ON public.usage_events TO authenticated;

GRANT ALL ON public.payment_history TO postgres, service_role;
GRANT SELECT ON public.payment_history TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_subscription_limits(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_usage(UUID, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_usage_limit(UUID, VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_usage_event(UUID, VARCHAR, INTEGER, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_billing_info(UUID) TO authenticated, service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 003 completed successfully!';
    RAISE NOTICE 'Created billing and subscription system';
    RAISE NOTICE 'Added: subscription_plans, usage_events, payment_history tables';
    RAISE NOTICE 'Added: 6 helper functions for billing operations';
    RAISE NOTICE 'Seeded: 3 subscription plans (Starter, Professional, Enterprise)';
    RAISE NOTICE 'Note: Update Stripe Price IDs in subscription_plans table after Stripe configuration';
END $$;

