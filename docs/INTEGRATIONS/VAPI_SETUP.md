# Vapi.ai Integration Guide

**Complete setup guide for AI voice assistants**

---

## Overview

Vapi.ai provides the AI voice assistant capabilities for ServiceAI. This guide covers:
- Account setup and configuration
- Assistant creation and management
- Phone number provisioning
- Webhook configuration
- Production deployment

---

## Prerequisites

- Vapi.ai account (sign up at [vapi.ai](https://vapi.ai))
- ServiceAI application running
- Supabase database configured

---

## 1. Vapi.ai Account Setup

### 1.1 Create Account
1. Go to [vapi.ai](https://vapi.ai)
2. Sign up for an account
3. Verify your email address
4. Complete profile setup

### 1.2 Get API Key
1. Go to **Settings** → **API Keys**
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Add to your `.env.local`:

```bash
VAPI_API_KEY=sk-your-api-key-here
VAPI_WEBHOOK_URL=https://yourdomain.com/api/webhooks/vapi
```

---

## 2. Assistant Configuration

### 2.1 Industry Templates

ServiceAI supports multiple industries with pre-configured templates:

#### **HVAC (Heating, Ventilation, Air Conditioning)**
- **English Keywords:** "no heat", "broken AC", "emergency repair", "urgent"
- **Spanish Keywords:** "sin calefacción", "aire acondicionado roto", "reparación de emergencia"
- **Services:** Installation, repair, maintenance, emergency service

#### **Plumbing**
- **English Keywords:** "water leak", "flooding", "no water", "emergency"
- **Spanish Keywords:** "fuga de agua", "inundación", "sin agua", "emergencia"
- **Services:** Leak repair, drain cleaning, pipe installation, emergency service

#### **Electrical**
- **English Keywords:** "power outage", "electrical fire", "sparks", "urgent"
- **Spanish Keywords:** "corte de luz", "incendio eléctrico", "chispas", "urgente"
- **Services:** Wiring, panel upgrades, outlet installation, emergency repair

### 2.2 Multi-Language Support

Each assistant supports both English and Spanish:

```typescript
// Example assistant configuration
const assistantConfig = {
  name: "HVAC Assistant",
  language: "en", // or "es"
  industry: "hvac",
  systemPrompt: "You are a professional HVAC assistant...",
  voice: {
    provider: "elevenlabs",
    voiceId: "en-voice-id" // or "es-voice-id"
  }
}
```

---

## 3. Phone Number Provisioning

### 3.1 Multi-Tenant Phone Numbers

ServiceAI automatically provisions unique phone numbers for each organization:

#### **Free Vapi SIP Numbers**
- Up to 10 free numbers per Vapi account
- Automatic assignment to new organizations
- No additional cost

#### **Twilio Integration**
- Import existing Twilio numbers
- Purchase new numbers via Twilio
- Full SMS and voice capabilities

#### **BYO SIP Trunk**
- Bring your own SIP infrastructure
- Custom phone number management
- Advanced routing options

### 3.2 Phone Number Assignment

```typescript
// Automatic phone number assignment
const phoneAssignment = await assignPhoneNumber({
  organizationId: "org-123",
  phoneProvider: "vapi", // or "twilio", "byo"
  capabilities: ["voice", "sms"]
})
```

---

## 4. Webhook Configuration

### 4.1 Webhook Endpoints

ServiceAI handles these Vapi webhook events:

- **Call Started** - `call-started`
- **Call Ended** - `call-ended`
- **Function Call** - `function-call`
- **Status Update** - `status-update`

### 4.2 Webhook URL Setup

1. **Development:**
```bash
# Use ngrok for local development
ngrok http 3000
# Use the ngrok URL: https://abc123.ngrok.io/api/webhooks/vapi
```

2. **Production:**
```bash
# Your production domain
VAPI_WEBHOOK_URL=https://yourdomain.com/api/webhooks/vapi
```

### 4.3 Webhook Security

```typescript
// Webhook signature verification
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-vapi-signature')
  const body = await request.text()
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(body, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Process webhook
}
```

---

## 5. Assistant Creation

### 5.1 Via API

```typescript
// Create assistant programmatically
const assistant = await createVapiAssistant({
  organizationId: "org-123",
  name: "HVAC Assistant",
  industry: "hvac",
  language: "en",
  systemPrompt: "You are a professional HVAC assistant...",
  tools: [
    createAppointmentBookingTool(),
    createEmergencyDetectionTool(),
    createCallTransferTool()
  ]
})
```

### 5.2 Via Dashboard

1. Go to **Assistants** → **Create New**
2. Fill in assistant details:
   - Name
   - Industry
   - Language
   - Voice settings
3. Configure tools and functions
4. Test the assistant
5. Deploy to production

---

## 6. Emergency Detection

### 6.1 Emergency Keywords

Each industry has specific emergency keywords:

```typescript
const emergencyKeywords = {
  hvac: {
    en: ["no heat", "broken AC", "emergency", "urgent", "fire"],
    es: ["sin calefacción", "aire roto", "emergencia", "urgente", "fuego"]
  },
  plumbing: {
    en: ["water leak", "flooding", "no water", "emergency"],
    es: ["fuga de agua", "inundación", "sin agua", "emergencia"]
  },
  electrical: {
    en: ["power outage", "electrical fire", "sparks", "urgent"],
    es: ["corte de luz", "incendio eléctrico", "chispas", "urgente"]
  }
}
```

### 6.2 Emergency Response

When emergency keywords are detected:

1. **Urgency Score Calculation** (0-1.0)
2. **Emergency Contact Notification**
3. **SMS Alert Sent**
4. **Call Transfer Initiated**
5. **Logging and Tracking**

---

## 7. Call Transfer

### 7.1 Transfer Configuration

```typescript
// Transfer settings per organization
const transferConfig = {
  transferPhoneNumber: "+15551234567",
  emergencyContactPhone: "+15559876543",
  transferMode: "warm", // or "cold"
  maxWaitTime: 30 // seconds
}
```

### 7.2 Transfer Types

#### **Warm Transfer**
- AI briefs human agent first
- Context passed to human
- Smoother handoff

#### **Cold Transfer**
- Immediate connection
- Faster for emergencies
- Less context transfer

---

## 8. Testing

### 8.1 Local Testing

```bash
# Start development server
npm run dev

# Use ngrok for webhook testing
ngrok http 3000

# Test assistant creation
curl -X POST http://localhost:3000/api/assistants/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Assistant", "industry": "hvac"}'
```

### 8.2 Production Testing

1. **Create Test Organization**
2. **Provision Phone Number**
3. **Make Test Call**
4. **Verify Emergency Detection**
5. **Test SMS Integration**
6. **Test Call Transfer**

---

## 9. Monitoring & Analytics

### 9.1 Call Analytics

- Call duration and quality
- Language detection accuracy
- Emergency detection rate
- Transfer success rate
- Customer satisfaction

### 9.2 Performance Metrics

- Response time
- Uptime monitoring
- Error rates
- Webhook delivery success

---

## 10. Troubleshooting

### 10.1 Common Issues

#### **Assistant Not Responding**
- Check API key validity
- Verify webhook URL
- Check phone number assignment
- Review system prompt

#### **Webhook Not Receiving Events**
- Verify webhook URL is accessible
- Check signature verification
- Review firewall settings
- Test with ngrok

#### **Phone Number Issues**
- Check Vapi account limits
- Verify number provisioning
- Review Twilio configuration
- Check BYO SIP setup

### 10.2 Debug Mode

```typescript
// Enable debug logging
const debugConfig = {
  logLevel: "debug",
  webhookLogging: true,
  callTranscription: true
}
```

---

## 11. Production Deployment

### 11.1 Environment Variables

```bash
# Production environment
VAPI_API_KEY=sk-prod-api-key
VAPI_WEBHOOK_URL=https://yourdomain.com/api/webhooks/vapi
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 11.2 Security Checklist

- [ ] API keys secured
- [ ] Webhook signature verification enabled
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Monitoring setup

---

## 12. Best Practices

### 12.1 Assistant Design

- Keep system prompts concise
- Use industry-specific language
- Test with real scenarios
- Monitor performance metrics

### 12.2 Phone Number Management

- Monitor usage limits
- Plan for scaling
- Backup phone numbers
- Document assignments

### 12.3 Webhook Handling

- Implement retry logic
- Log all events
- Handle failures gracefully
- Monitor delivery success

---

**Last Updated:** October 8, 2025  
**Version:** Production Ready
