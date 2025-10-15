-- Add raw_vapi_data column to call_logs for debugging and future use

ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS raw_vapi_data JSONB;

COMMENT ON COLUMN public.call_logs.raw_vapi_data IS 'The complete, raw JSON payload from the Vapi end-of-call-report webhook.';
