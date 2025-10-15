-- ============================================================================
-- MIGRATION 029: Create SMS Templates Table
-- Purpose: Store SMS templates for multi-language messaging
-- ============================================================================

-- Create SMS templates table
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL,
    language VARCHAR(5) NOT NULL CHECK (language IN ('en', 'es')),
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    category VARCHAR(50) NOT NULL CHECK (category IN ('appointment', 'emergency', 'reminder', 'confirmation', 'follow_up')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique combination of key and language
    UNIQUE(key, language)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_templates_key ON public.sms_templates(key);
CREATE INDEX IF NOT EXISTS idx_sms_templates_language ON public.sms_templates(language);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON public.sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON public.sms_templates(is_active);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do everything
CREATE POLICY "Allow full access for service_role" 
ON public.sms_templates FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy: Authenticated users can read templates
CREATE POLICY "Allow read access for authenticated users" 
ON public.sms_templates FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS Policy: Authenticated users can insert templates
CREATE POLICY "Allow insert access for authenticated users" 
ON public.sms_templates FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Authenticated users can update templates
CREATE POLICY "Allow update access for authenticated users" 
ON public.sms_templates FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Authenticated users can delete templates
CREATE POLICY "Allow delete access for authenticated users" 
ON public.sms_templates FOR DELETE
USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_sms_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sms_templates_updated_at
    BEFORE UPDATE ON public.sms_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_templates_updated_at();

-- Insert default SMS templates
INSERT INTO public.sms_templates (key, language, content, variables, category) VALUES
-- Appointment Confirmation - English
('appointment_confirmation', 'en', 'Hi {{customer_name}}! Your {{service_type}} appointment is confirmed for {{date}} at {{time}}. Address: {{address}}. We''ll call 30 minutes before arrival. Reply STOP to opt out.', 
 ARRAY['customer_name', 'service_type', 'date', 'time', 'address'], 'appointment'),

-- Appointment Confirmation - Spanish
('appointment_confirmation', 'es', '¡Hola {{customer_name}}! Su cita de {{service_type}} está confirmada para el {{date}} a las {{time}}. Dirección: {{address}}. Llamaremos 30 minutos antes de llegar. Responda STOP para cancelar.', 
 ARRAY['customer_name', 'service_type', 'date', 'time', 'address'], 'appointment'),

-- Appointment Reminder - English
('appointment_reminder', 'en', 'Reminder: Your {{service_type}} appointment is tomorrow at {{time}}. Address: {{address}}. Please confirm by replying YES or reschedule by calling {{business_phone}}.', 
 ARRAY['service_type', 'time', 'address', 'business_phone'], 'reminder'),

-- Appointment Reminder - Spanish
('appointment_reminder', 'es', 'Recordatorio: Su cita de {{service_type}} es mañana a las {{time}}. Dirección: {{address}}. Confirme respondiendo SÍ o reagende llamando al {{business_phone}}.', 
 ARRAY['service_type', 'time', 'address', 'business_phone'], 'reminder'),

-- Emergency Alert - English
('emergency_alert', 'en', '🚨 EMERGENCY ALERT 🚨 {{customer_name}} reported: {{issue_description}}. Address: {{address}}. Phone: {{customer_phone}}. Urgency: {{urgency_level}}. Please respond immediately.', 
 ARRAY['customer_name', 'issue_description', 'address', 'customer_phone', 'urgency_level'], 'emergency'),

-- Emergency Alert - Spanish
('emergency_alert', 'es', '🚨 ALERTA DE EMERGENCIA 🚨 {{customer_name}} reportó: {{issue_description}}. Dirección: {{address}}. Teléfono: {{customer_phone}}. Urgencia: {{urgency_level}}. Responda inmediatamente.', 
 ARRAY['customer_name', 'issue_description', 'address', 'customer_phone', 'urgency_level'], 'emergency'),

-- Service Completion Follow-up - English
('service_completion', 'en', 'Thank you for choosing us! How was your {{service_type}} service today? Rate us 1-5 stars by replying with a number. For issues, call {{business_phone}}.', 
 ARRAY['service_type', 'business_phone'], 'follow_up'),

-- Service Completion Follow-up - Spanish
('service_completion', 'es', '¡Gracias por elegirnos! ¿Cómo fue su servicio de {{service_type}} hoy? Califíquenos de 1 a 5 estrellas respondiendo con un número. Para problemas, llame al {{business_phone}}.', 
 ARRAY['service_type', 'business_phone'], 'follow_up'),

-- Appointment Cancellation - English
('appointment_cancelled', 'en', 'Your {{service_type}} appointment for {{date}} at {{time}} has been cancelled. To reschedule, call {{business_phone}} or visit our website.', 
 ARRAY['service_type', 'date', 'time', 'business_phone'], 'appointment'),

-- Appointment Cancellation - Spanish
('appointment_cancelled', 'es', 'Su cita de {{service_type}} para el {{date}} a las {{time}} ha sido cancelada. Para reagendar, llame al {{business_phone}} o visite nuestro sitio web.', 
 ARRAY['service_type', 'date', 'time', 'business_phone'], 'appointment'),

-- No Show Follow-up - English
('no_show_followup', 'en', 'We missed you at your {{service_type}} appointment today. Please call {{business_phone}} to reschedule. We''re here to help!', 
 ARRAY['service_type', 'business_phone'], 'follow_up'),

-- No Show Follow-up - Spanish
('no_show_followup', 'es', 'Te extrañamos en tu cita de {{service_type}} hoy. Por favor llame al {{business_phone}} para reagendar. ¡Estamos aquí para ayudar!', 
 ARRAY['service_type', 'business_phone'], 'follow_up'),

-- Welcome Message - English
('welcome_message', 'en', 'Welcome to {{business_name}}! We''re excited to serve you. For appointments, call {{business_phone}} or visit our website. Reply STOP to opt out.', 
 ARRAY['business_name', 'business_phone'], 'confirmation'),

-- Welcome Message - Spanish
('welcome_message', 'es', '¡Bienvenido a {{business_name}}! Estamos emocionados de servirle. Para citas, llame al {{business_phone}} o visite nuestro sitio web. Responda STOP para cancelar.', 
 ARRAY['business_name', 'business_phone'], 'confirmation');

-- Add comment to table
COMMENT ON TABLE public.sms_templates IS 'SMS templates for multi-language messaging system';
COMMENT ON COLUMN public.sms_templates.key IS 'Template identifier key';
COMMENT ON COLUMN public.sms_templates.language IS 'Language code (en/es)';
COMMENT ON COLUMN public.sms_templates.content IS 'Template content with {{variable}} placeholders';
COMMENT ON COLUMN public.sms_templates.variables IS 'Array of variable names used in template';
COMMENT ON COLUMN public.sms_templates.category IS 'Template category for organization';
