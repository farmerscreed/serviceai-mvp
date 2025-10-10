# Claude Code Rules for ServiceAI Platform

## Project Awareness

Before starting any task:
1. Read the main `PRODUCT_REQUIREMENTS_PLAN.md` for complete context
2. Check `PRPs/` folder for existing feature plans
3. Review `examples/hope_hall/` for proven patterns
4. Understand the multi-tenant, multi-language architecture

## Code Structure & Organization

### File Size Limits
- **Maximum file size**: 400 lines per file
- **Ideal file size**: 200-300 lines
- If a file exceeds 400 lines, split into logical modules

### Module Organization
```
app/
├── (auth)/          # Authentication flows
├── (dashboard)/     # Main dashboard
├── organizations/   # Multi-tenant management
├── industries/      # Industry-specific modules
│   ├── hvac/
│   ├── plumbing/
│   ├── electrical/
│   ├── medical/
│   ├── veterinary/
│   └── property/
├── templates/       # Industry template engine
├── communications/  # SMS & Voice AI
└── api/            # API routes

lib/
├── supabase/       # Supabase client & utilities
├── vapi/           # Vapi.ai integration
├── twilio/         # Twilio SMS integration
├── templates/      # Template engine core
└── i18n/           # Multi-language support

components/
├── ui/             # Base UI components (shadcn)
├── dashboard/      # Dashboard components
├── industries/     # Industry-specific components
└── templates/      # Template configuration UI
```

## Multi-Language Requirements

### Language Support
- **Default languages**: English (en), Spanish (es)
- **Automatic detection**: Use Vapi.ai's language detection
- **Fallback strategy**: Always fall back to English if translation missing

### Translation Files
```typescript
// All UI text must be translatable
import { useTranslation } from '@/lib/i18n';

const { t } = useTranslation();
<h1>{t('dashboard.welcome')}</h1>
```

### Cultural Guidelines
- **Spanish communication**: Use "usted" for formal, "tú" for informal
- **Emergency keywords**: Maintain separate lists per language
- **SMS templates**: Create language-specific versions
- **Regional variations**: Support Mexican Spanish vs Spain Spanish

## Supabase & Database

### Row Level Security (RLS)
- **ALWAYS** enable RLS on new tables
- **ALWAYS** include `organization_id` in tenant tables
- **Test RLS policies** thoroughly before deployment

### Database Patterns
```sql
-- Standard table structure
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- other fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard RLS policy
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their organization data"
ON table_name
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);
```

### Edge Functions
- Use TypeScript for all Edge Functions
- Include proper error handling
- Log all external API calls (Vapi, Twilio)
- Validate webhooks with signatures

## Vapi.ai Integration

### Assistant Configuration
```typescript
// Template-based assistant creation
interface VapiAssistantConfig {
    organizationId: string;
    industryCode: 'hvac' | 'plumbing' | 'electrical' | 'medical' | 'veterinary' | 'property';
    language: 'en' | 'es';
    systemPrompt: string;
    tools: VapiTool[];
    voice: VoiceConfig;
}
```

### Emergency Detection
- **Always** use industry-specific keywords
- **Always** support both English and Spanish keywords
- **Always** trigger SMS alerts for emergencies
- **Calculate urgency score** (0-1.0) for priority routing

### Webhook Handling
```typescript
// Standard webhook structure
export async function handleVapiWebhook(req: Request) {
    // 1. Verify webhook signature
    // 2. Extract organization_id from phone number
    // 3. Process based on event type
    // 4. Return appropriate response
}
```

## SMS Integration (Twilio)

### Message Templates
```typescript
interface SMSTemplate {
    key: string;
    language: 'en' | 'es';
    content: string;
    variables: string[];
}

// Example
const appointmentConfirmation: SMSTemplate = {
    key: 'appointment_confirmation',
    language: 'en',
    content: 'Hi {name}! Your {service_type} is confirmed for {date} at {time}.',
    variables: ['name', 'service_type', 'date', 'time']
};
```

### SMS Workflows
- **Confirmation**: Send immediately after booking
- **Reminder**: Send 24 hours before appointment
- **Follow-up**: Send 24 hours after service
- **Emergency**: Send immediately with high priority

## Template Engine

### Industry Template Structure
```typescript
interface IndustryTemplate {
    industryCode: string;
    language: 'en' | 'es';
    displayName: string;
    emergencyKeywords: string[];
    appointmentTypes: AppointmentType[];
    requiredFields: CustomField[];
    smsTemplates: Record<string, string>;
    culturalGuidelines: CulturalGuidelines;
}
```

### Template Validation
- Validate all templates before saving
- Ensure emergency keywords exist for all languages
- Verify required fields are defined
- Test SMS templates with sample data

## Testing Requirements

### Unit Tests
```typescript
// Test file naming: *.test.ts or *.test.tsx
describe('Template Engine', () => {
    it('should load HVAC template in Spanish', async () => {
        const template = await loadTemplate('hvac', 'es');
        expect(template.emergencyKeywords).toContain('sin calefacción');
    });
});
```

### Integration Tests
- Test Vapi webhook with mock payloads
- Test SMS sending with Twilio test credentials
- Test multi-language flows end-to-end
- Test RLS policies with different users

### E2E Tests (Playwright)
- Test complete onboarding flow
- Test emergency detection and SMS alerts
- Test language switching
- Test appointment booking workflow

## Security Guidelines

### API Keys & Secrets
- **NEVER** commit API keys to git
- Store in Supabase Vault or environment variables
- Use service role key only in Edge Functions
- Rotate keys regularly

### Input Validation
```typescript
// Always validate user input
import { z } from 'zod';

const CreateLeadSchema = z.object({
    name: z.string().min(1).max(255),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    email: z.string().email().optional(),
    organizationId: z.string().uuid()
});
```

### Rate Limiting
- Implement rate limiting on API endpoints
- Use Redis for distributed rate limiting
- Apply stricter limits on expensive operations (SMS, AI calls)

## Performance Optimization

### Database Queries
- Use indexes on frequently queried columns
- Avoid N+1 queries with proper joins
- Use pagination for large result sets
- Cache template data in Redis

### Frontend Performance
- Use Next.js Image optimization
- Implement code splitting
- Lazy load heavy components
- Use React.memo for expensive renders

## Documentation Standards

### Code Comments
```typescript
/**
 * Schedules a multilingual SMS workflow for an appointment.
 * 
 * @param appointment - The appointment data
 * @param language - Customer's preferred language ('en' | 'es')
 * @returns Promise with SMS workflow execution result
 * 
 * @example
 * ```typescript
 * await scheduleAppointmentSMS({
 *   id: 'apt_123',
 *   customerName: 'Juan García',
 *   date: '2025-10-15',
 *   time: '14:00'
 * }, 'es');
 * ```
 */
async function scheduleAppointmentSMS(
    appointment: Appointment, 
    language: Language
): Promise<SMSWorkflowResult>
```

### API Documentation
- Document all Edge Functions with OpenAPI specs
- Include request/response examples
- Document webhook payloads
- Maintain changelog for API versions

## Error Handling

### Standard Error Response
```typescript
interface APIError {
    error: string;
    message: string;
    code: string;
    details?: any;
}

// Example
return new Response(
    JSON.stringify({
        error: 'TEMPLATE_NOT_FOUND',
        message: 'Industry template not found for HVAC in Spanish',
        code: '404',
        details: { industryCode: 'hvac', language: 'es' }
    }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
);
```

### Logging
- Log all errors with context
- Include organization_id in logs
- Use structured logging (JSON format)
- Send critical errors to monitoring service

## Deployment & CI/CD

### Deployment Checklist
- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] RLS policies tested
- [ ] API keys rotated if needed
- [ ] Documentation updated
- [ ] Changelog updated

### Supabase Migrations
```bash
# Create migration
supabase migration new add_medical_industry_template

# Apply migration
supabase db push

# Rollback if needed
supabase db reset
```

## Common Patterns from Hope Hall

### Lead Management Pattern
```typescript
// From Hope Hall - proven lead management
interface Lead {
    id: string;
    organizationId: string;
    name: string;
    phone: string;
    email?: string;
    leadScore: number; // 0-100
    leadCategory: 'HOT' | 'WARM' | 'COOL';
    status: LeadStatus;
    source: string;
    customFields: Record<string, any>;
}
```

### AI Call Logging Pattern
```typescript
// From Hope Hall - comprehensive call logging
interface CallLog {
    id: string;
    organizationId: string;
    callId: string;
    callerPhone: string;
    duration: number;
    transcript: string;
    sentiment: number;
    emergencyDetected: boolean;
    languageDetected: 'en' | 'es';
    toolCallsMade: ToolCall[];
}
```

### Appointment Booking Pattern
```typescript
// Adapted from Hope Hall tours to generic bookings
interface Appointment {
    id: string;
    organizationId: string;
    resourceId: string;
    personId: string;
    startTime: Date;
    endTime: Date;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    customFields: Record<string, any>;
    smsPreferences: {
        confirmationSent: boolean;
        remindersSent: boolean;
        language: 'en' | 'es';
    };
}
```

## AI Assistant Guidelines

When implementing features:
1. **Start with examples** from Hope Hall
2. **Adapt patterns** to multi-industry context
3. **Add multi-language** support from the start
4. **Include SMS integration** where applicable
5. **Test with both languages** before considering complete
6. **Document cultural considerations** for Spanish

## Success Criteria for PRPs

Every PRP should include:
- [ ] Multi-language support (en/es)
- [ ] SMS integration where applicable
- [ ] RLS policies for multi-tenancy
- [ ] Industry template compatibility
- [ ] Emergency detection patterns
- [ ] Cultural communication guidelines
- [ ] Test coverage (unit + integration)
- [ ] Documentation with examples

---

**This guide ensures consistent, secure, scalable development following proven patterns from Hope Hall while extending to the multi-industry, multi-language ServiceAI platform.**
