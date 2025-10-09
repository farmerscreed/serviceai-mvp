-- Align organizations.subscription_status with billing schema

-- Ensure the extended constraint exists (in case env missed migration 003)
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_subscription_status_check 
  CHECK (subscription_status IN (
    'trialing', 'active', 'past_due', 'canceled', 
    'incomplete', 'incomplete_expired', 'unpaid'
  ));

-- Backfill any legacy 'trial' values to 'trialing'
UPDATE public.organizations
SET subscription_status = 'trialing'
WHERE subscription_status = 'trial';

-- Set default to 'trialing'
ALTER TABLE public.organizations ALTER COLUMN subscription_status SET DEFAULT 'trialing';


