-- Create system_settings table for global application settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view system settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Policy: Admins can update system settings
CREATE POLICY "Admins can update system settings"
ON public.system_settings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Seed initial settings
INSERT INTO public.system_settings (key, value)
VALUES
    ('overage_markup_percentage', '{"value": 0.25}') -- Default 25% markup
ON CONFLICT (key) DO NOTHING;
