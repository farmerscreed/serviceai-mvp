ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_calendar_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS calendly_api_key TEXT,
ADD COLUMN IF NOT EXISTS calendly_user_uri VARCHAR(255),
ADD COLUMN IF NOT EXISTS calendar_metadata JSONB;
