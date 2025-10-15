ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_default_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS sms_auto_send_confirmations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_auto_send_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_reminder_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS sms_emergency_enabled BOOLEAN DEFAULT true;
