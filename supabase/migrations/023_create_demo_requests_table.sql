-- Create demo_requests table for tracking demo calls
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    industry VARCHAR(100),
    organization_id UUID REFERENCES public.organizations(id), -- Link if user signs up after demo
    vapi_call_id VARCHAR(255), -- Link to call_logs
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'calling', 'completed', 'failed', 'no_answer'
    lead_score INTEGER DEFAULT 0, -- 0-100, based on agent feedback or post-call analysis
    follow_up_flag BOOLEAN DEFAULT FALSE,
    conversion_status VARCHAR(50) NOT NULL DEFAULT 'none', -- 'none', 'signed_up', 'nurturing'
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    call_started_at TIMESTAMPTZ,
    call_ended_at TIMESTAMPTZ,
    transcript TEXT,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for demo_requests
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view and manage demo requests
CREATE POLICY "Admins can view and manage demo requests"
ON public.demo_requests FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);
