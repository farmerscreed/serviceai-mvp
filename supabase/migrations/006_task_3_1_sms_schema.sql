-- Task 3.1: SMS Communication System Database Schema
-- Create tables for SMS communications, delivery tracking, and two-way SMS handling

-- =====================================================
-- SMS Communications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    message_content TEXT NOT NULL,
    external_message_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered', 'received')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SMS Delivery Events Table
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_delivery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Service Satisfaction Table
-- =====================================================

CREATE TABLE IF NOT EXISTS service_satisfaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    satisfaction_level VARCHAR(20) NOT NULL CHECK (satisfaction_level IN ('positive', 'neutral', 'negative')),
    feedback TEXT,
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    source VARCHAR(20) NOT NULL DEFAULT 'sms' CHECK (source IN ('sms', 'call', 'web', 'app')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Emergency Alerts Table
-- =====================================================

CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    source VARCHAR(20) NOT NULL DEFAULT 'sms' CHECK (source IN ('sms', 'call', 'web', 'app')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- SMS Communications indexes
CREATE INDEX IF NOT EXISTS idx_sms_communications_organization_id ON sms_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_communications_customer_id ON sms_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_communications_phone_number ON sms_communications(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_communications_external_message_id ON sms_communications(external_message_id);
CREATE INDEX IF NOT EXISTS idx_sms_communications_status ON sms_communications(status);
CREATE INDEX IF NOT EXISTS idx_sms_communications_sent_at ON sms_communications(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_communications_direction ON sms_communications(direction);

-- SMS Delivery Events indexes
CREATE INDEX IF NOT EXISTS idx_sms_delivery_events_message_id ON sms_delivery_events(message_id);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_events_status ON sms_delivery_events(status);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_events_timestamp ON sms_delivery_events(timestamp);

-- Service Satisfaction indexes
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_customer_id ON service_satisfaction(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_organization_id ON service_satisfaction(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_satisfaction_level ON service_satisfaction(satisfaction_level);
CREATE INDEX IF NOT EXISTS idx_service_satisfaction_created_at ON service_satisfaction(created_at);

-- Emergency Alerts indexes
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_customer_id ON emergency_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_organization_id ON emergency_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sms_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- SMS Communications RLS policies
CREATE POLICY "Users can view SMS communications for their organization"
ON sms_communications FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert SMS communications for their organization"
ON sms_communications FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update SMS communications for their organization"
ON sms_communications FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- SMS Delivery Events RLS policies
CREATE POLICY "Users can view SMS delivery events for their organization"
ON sms_delivery_events FOR SELECT
USING (
    message_id IN (
        SELECT external_message_id 
        FROM sms_communications 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert SMS delivery events"
ON sms_delivery_events FOR INSERT
WITH CHECK (true); -- Allow all inserts for webhook processing

-- Service Satisfaction RLS policies
CREATE POLICY "Users can view service satisfaction for their organization"
ON service_satisfaction FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert service satisfaction for their organization"
ON service_satisfaction FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Emergency Alerts RLS policies
CREATE POLICY "Users can view emergency alerts for their organization"
ON emergency_alerts FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert emergency alerts for their organization"
ON emergency_alerts FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update emergency alerts for their organization"
ON emergency_alerts FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- Database Functions for SMS Analytics
-- =====================================================

-- Function to get SMS statistics
CREATE OR REPLACE FUNCTION get_sms_statistics(
    p_organization_id UUID,
    p_time_range_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_sent BIGINT,
    delivered BIGINT,
    failed BIGINT,
    undelivered BIGINT,
    delivery_rate NUMERIC,
    avg_delivery_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'undelivered') as undelivered,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as delivery_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'delivered') > 0 THEN
                ROUND(AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) FILTER (WHERE status = 'delivered'), 2)
            ELSE 0
        END as avg_delivery_time_seconds
    FROM sms_communications
    WHERE organization_id = p_organization_id
    AND sent_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SMS performance by language
CREATE OR REPLACE FUNCTION get_sms_language_performance(
    p_organization_id UUID,
    p_time_range_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS TABLE (
    language_code VARCHAR(5),
    total_sent BIGINT,
    delivered BIGINT,
    delivery_rate NUMERIC,
    avg_delivery_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.language_code,
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE sc.status = 'delivered') as delivered,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE sc.status = 'delivered')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as delivery_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE sc.status = 'delivered') > 0 THEN
                ROUND(AVG(EXTRACT(EPOCH FROM (sc.delivered_at - sc.sent_at))) FILTER (WHERE sc.status = 'delivered'), 2)
            ELSE 0
        END as avg_delivery_time_seconds
    FROM sms_communications sc
    WHERE sc.organization_id = p_organization_id
    AND sc.sent_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours
    GROUP BY sc.language_code
    ORDER BY total_sent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get SMS trends over time
CREATE OR REPLACE FUNCTION get_sms_trends(
    p_organization_id UUID,
    p_time_range_hours INTEGER DEFAULT 168 -- 7 days
)
RETURNS TABLE (
    date_hour TIMESTAMPTZ,
    sent_count BIGINT,
    delivered_count BIGINT,
    failed_count BIGINT,
    delivery_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC('hour', sc.sent_at) as date_hour,
        COUNT(*) as sent_count,
        COUNT(*) FILTER (WHERE sc.status = 'delivered') as delivered_count,
        COUNT(*) FILTER (WHERE sc.status = 'failed') as failed_count,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE sc.status = 'delivered')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as delivery_rate
    FROM sms_communications sc
    WHERE sc.organization_id = p_organization_id
    AND sc.sent_at >= NOW() - INTERVAL '1 hour' * p_time_range_hours
    GROUP BY DATE_TRUNC('hour', sc.sent_at)
    ORDER BY date_hour ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for Updated At
-- =====================================================

-- SMS Communications updated_at trigger
CREATE OR REPLACE FUNCTION update_sms_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sms_communications_updated_at
    BEFORE UPDATE ON sms_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_communications_updated_at();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE sms_communications IS 'Stores all SMS communications (inbound and outbound) with delivery tracking';
COMMENT ON TABLE sms_delivery_events IS 'Tracks SMS delivery status events from Twilio webhooks';
COMMENT ON TABLE service_satisfaction IS 'Records customer satisfaction feedback from SMS responses';
COMMENT ON TABLE emergency_alerts IS 'Tracks emergency alerts created from SMS communications';

COMMENT ON COLUMN sms_communications.organization_id IS 'Organization that owns this SMS communication';
COMMENT ON COLUMN sms_communications.customer_id IS 'Customer associated with this SMS (optional for outbound)';
COMMENT ON COLUMN sms_communications.phone_number IS 'Phone number for the SMS communication';
COMMENT ON COLUMN sms_communications.message_type IS 'Type of SMS message (e.g., appointment_confirmation, emergency_alert)';
COMMENT ON COLUMN sms_communications.direction IS 'Direction of SMS (inbound or outbound)';
COMMENT ON COLUMN sms_communications.language_code IS 'Language of the SMS message (en, es)';
COMMENT ON COLUMN sms_communications.message_content IS 'Content of the SMS message';
COMMENT ON COLUMN sms_communications.external_message_id IS 'External message ID from Twilio';
COMMENT ON COLUMN sms_communications.status IS 'Current status of the SMS (pending, sent, delivered, failed, undelivered, received)';
COMMENT ON COLUMN sms_communications.sent_at IS 'Timestamp when SMS was sent';
COMMENT ON COLUMN sms_communications.delivered_at IS 'Timestamp when SMS was delivered';
COMMENT ON COLUMN sms_communications.received_at IS 'Timestamp when SMS was received (for inbound)';
COMMENT ON COLUMN sms_communications.error_message IS 'Error message if SMS failed';

COMMENT ON COLUMN sms_delivery_events.message_id IS 'External message ID from Twilio';
COMMENT ON COLUMN sms_delivery_events.status IS 'Delivery status from Twilio webhook';
COMMENT ON COLUMN sms_delivery_events.timestamp IS 'Timestamp of the delivery event';
COMMENT ON COLUMN sms_delivery_events.error_code IS 'Error code from Twilio if delivery failed';
COMMENT ON COLUMN sms_delivery_events.error_message IS 'Error message from Twilio if delivery failed';

COMMENT ON COLUMN service_satisfaction.satisfaction_level IS 'Customer satisfaction level (positive, neutral, negative)';
COMMENT ON COLUMN service_satisfaction.feedback IS 'Customer feedback text';
COMMENT ON COLUMN service_satisfaction.source IS 'Source of the satisfaction feedback (sms, call, web, app)';

COMMENT ON COLUMN emergency_alerts.message IS 'Emergency message content';
COMMENT ON COLUMN emergency_alerts.status IS 'Status of the emergency alert (active, resolved, cancelled)';
COMMENT ON COLUMN emergency_alerts.source IS 'Source of the emergency alert (sms, call, web, app)';
COMMENT ON COLUMN emergency_alerts.resolved_at IS 'Timestamp when emergency was resolved';
COMMENT ON COLUMN emergency_alerts.cancelled_at IS 'Timestamp when emergency alert was cancelled';
