-- Add columns for call metering to the organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS minutes_used_this_cycle INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_minutes INTEGER DEFAULT 0;
