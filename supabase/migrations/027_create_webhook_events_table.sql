-- ============================================================================
-- MIGRATION 027: Create webhook_events table
-- Purpose: To log all incoming webhooks for debugging and auditing purposes.
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_type VARCHAR(100),
    detected_language VARCHAR(10),
    webhook_data JSONB,
    response_data JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow service_role to do everything
CREATE POLICY "Allow full access for service_role" 
ON public.webhook_events FOR ALL
USING (true)
WITH CHECK (true);

-- Allow organization members to view their own webhook events
CREATE POLICY "Allow read access for organization members" 
ON public.webhook_events FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_org_id ON public.webhook_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at);

-- Add comment on table
COMMENT ON TABLE public.webhook_events IS 'Logs all incoming webhook events from third-party services like Vapi and Twilio for auditing and debugging.';
