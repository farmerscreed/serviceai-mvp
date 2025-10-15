# 📱 SMS Production Implementation Guide

**ServiceAI SMS System - Production Ready** | Based on ChurchOS SMS Patterns

---

## 🎯 **Overview**

This implementation provides a complete, production-ready SMS system for ServiceAI with:

- **Multi-provider support** (Twilio + Vonage fallback)
- **Multi-language templates** (English + Spanish)
- **Automatic provider fallback** for reliability
- **Template management system** with variables
- **Delivery status tracking** via webhooks
- **Emergency SMS alerts** to multiple contacts
- **Incoming SMS handling** with auto-responses
- **Cost tracking** and analytics

---

## 🏗️ **Architecture**

### **Core Components**

1. **Production SMS Service** (`lib/sms/production-sms-service.ts`)
   - Multi-provider SMS sending with fallback
   - Template-based messaging
   - Emergency SMS broadcasting
   - Phone number formatting and validation

2. **SMS Template System** (`lib/sms/sms-template-system.ts`)
   - Multi-language template management
   - Variable substitution
   - Template validation and testing
   - Default template initialization

3. **Supabase Edge Functions**
   - `send-sms-production` - Main SMS sending function
   - `sms-webhook-handler` - Delivery status and incoming SMS

4. **API Routes**
   - `/api/sms/send` - Send SMS from frontend
   - `/api/sms/templates` - Manage SMS templates
   - `/api/sms/test-template` - Test template formatting

5. **Database Schema**
   - `sms_templates` - Template storage
   - `sms_communications` - Message tracking
   - `emergency_contacts` - Emergency contact management

---

## 🚀 **Quick Start**

### **1. Environment Variables**

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Vonage Configuration (Optional - for fallback)
VONAGE_API_KEY=your-vonage-api-key
VONAGE_API_SECRET=your-vonage-api-secret
VONAGE_PHONE_NUMBER=+1234567890

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **2. Deploy Edge Functions**

```bash
# Deploy SMS functions
supabase functions deploy send-sms-production
supabase functions deploy sms-webhook-handler

# Set environment variables
supabase secrets set TWILIO_ACCOUNT_SID=your-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
supabase secrets set VONAGE_API_KEY=your-key
supabase secrets set VONAGE_API_SECRET=your-secret
```

### **3. Run Database Migration**

```bash
# Apply SMS templates migration
supabase db push
```

### **4. Configure Webhooks**

**Twilio Webhook:**
- URL: `https://your-project.supabase.co/functions/v1/sms-webhook-handler?provider=twilio`
- Events: Message Status, Incoming Messages

**Vonage Webhook:**
- URL: `https://your-project.supabase.co/functions/v1/sms-webhook-handler?provider=vonage`
- Events: Delivery Receipt

---

## 📱 **Usage Examples**

### **1. Send Individual SMS**

```typescript
import { productionSMSService } from '@/lib/sms/production-sms-service'

// Send direct SMS
const result = await productionSMSService.sendSMS({
  to: { phone: '+1234567890', organizationId: 'org-123' },
  message: 'Your appointment is confirmed for tomorrow at 2 PM.',
  language: 'en'
})

// Send template SMS
const result = await productionSMSService.sendTemplateSMS(
  'appointment_confirmation',
  [{ phone: '+1234567890', organizationId: 'org-123' }],
  {
    customer_name: 'John Doe',
    service_type: 'HVAC Repair',
    date: 'October 15, 2025',
    time: '2:00 PM',
    address: '123 Main St, Anytown, ST 12345'
  },
  'en'
)
```

### **2. Send Emergency SMS**

```typescript
// Send to all emergency contacts
const results = await productionSMSService.sendEmergencySMS(
  'org-123',
  '🚨 EMERGENCY: Gas leak reported at 123 Main St. Please respond immediately.',
  'en'
)
```

### **3. Frontend API Usage**

```typescript
// Send SMS via API
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'individual',
    organizationId: 'org-123',
    phoneNumber: '+1234567890',
    templateKey: 'appointment_confirmation',
    templateData: {
      customer_name: 'John Doe',
      service_type: 'HVAC Repair',
      date: 'October 15, 2025',
      time: '2:00 PM',
      address: '123 Main St, Anytown, ST 12345'
    },
    language: 'en'
  })
})

const result = await response.json()
```

### **4. Template Management**

```typescript
// Get templates
const response = await fetch('/api/sms/templates?organizationId=org-123&category=appointment')
const { templates } = await response.json()

// Test template
const testResponse = await fetch('/api/sms/test-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateKey: 'appointment_confirmation',
    language: 'en',
    organizationId: 'org-123'
  })
})

const { formattedMessage } = await testResponse.json()
console.log('Formatted message:', formattedMessage)
```

---

## 📋 **SMS Templates**

### **Available Templates**

| Template Key | Category | Languages | Variables |
|--------------|----------|-----------|-----------|
| `appointment_confirmation` | appointment | en, es | customer_name, service_type, date, time, address |
| `appointment_reminder` | reminder | en, es | service_type, time, address, business_phone |
| `emergency_alert` | emergency | en, es | customer_name, issue_description, address, customer_phone, urgency_level |
| `service_completion` | follow_up | en, es | service_type, business_phone |
| `appointment_cancelled` | appointment | en, es | service_type, date, time, business_phone |
| `no_show_followup` | follow_up | en, es | service_type, business_phone |
| `welcome_message` | confirmation | en, es | business_name, business_phone |

### **Template Variables**

All templates support variable substitution using `{{variable_name}}` syntax:

```typescript
const templateData = {
  customer_name: 'John Doe',
  service_type: 'HVAC Repair',
  date: 'October 15, 2025',
  time: '2:00 PM',
  address: '123 Main St, Anytown, ST 12345',
  business_phone: '(555) 123-4567',
  business_name: 'ServiceAI Pro'
}
```

---

## 🔧 **Integration with Existing Systems**

### **1. Appointment Booking Integration**

```typescript
// In appointment booking handler
import { productionSMSService } from '@/lib/sms/production-sms-service'

async function sendAppointmentConfirmation(appointment: any) {
  const result = await productionSMSService.sendTemplateSMS(
    'appointment_confirmation',
    [{ 
      phone: appointment.customer_phone, 
      organizationId: appointment.organization_id 
    }],
    {
      customer_name: appointment.customer_name,
      service_type: appointment.appointment_type,
      date: formatDate(appointment.scheduled_date),
      time: formatTime(appointment.scheduled_time),
      address: appointment.service_address
    },
    appointment.language_preference || 'en'
  )
  
  return result
}
```

### **2. Emergency Detection Integration**

```typescript
// In emergency detection handler
import { productionSMSService } from '@/lib/sms/production-sms-service'

async function sendEmergencyAlert(emergencyData: any) {
  const results = await productionSMSService.sendEmergencySMS(
    emergencyData.organizationId,
    `🚨 EMERGENCY ALERT 🚨 ${emergencyData.customer_name} reported: ${emergencyData.issue_description}. Address: ${emergencyData.address}. Phone: ${emergencyData.customer_phone}. Urgency: ${emergencyData.urgency_level}. Please respond immediately.`,
    emergencyData.language || 'en'
  )
  
  return results
}
```

### **3. Workflow Integration**

```typescript
// In SMS workflow engine
import { productionSMSService } from '@/lib/sms/production-sms-service'

async function executeSMSWorkflow(workflow: SMSWorkflow) {
  switch (workflow.workflowType) {
    case 'appointment_confirmation':
      return await productionSMSService.sendTemplateSMS(
        'appointment_confirmation',
        [{ phone: workflow.metadata.phoneNumber, organizationId: workflow.organizationId }],
        workflow.metadata,
        workflow.metadata.language || 'en'
      )
    
    case 'appointment_reminder':
      return await productionSMSService.sendTemplateSMS(
        'appointment_reminder',
        [{ phone: workflow.metadata.phoneNumber, organizationId: workflow.organizationId }],
        workflow.metadata,
        workflow.metadata.language || 'en'
      )
    
    case 'emergency_alert':
      return await productionSMSService.sendEmergencySMS(
        workflow.organizationId,
        workflow.metadata.message,
        workflow.metadata.language || 'en'
      )
  }
}
```

---

## 📊 **Monitoring & Analytics**

### **SMS Statistics**

```sql
-- Get SMS statistics for organization
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  SUM(cost) as total_cost,
  provider,
  language_code
FROM sms_communications 
WHERE organization_id = 'org-123'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider, language_code;
```

### **Template Usage**

```sql
-- Get template usage statistics
SELECT 
  template_key,
  language_code,
  COUNT(*) as usage_count,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as success_count
FROM sms_communications 
WHERE template_key IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY template_key, language_code
ORDER BY usage_count DESC;
```

---

## 🧪 **Testing**

### **1. Test SMS Sending**

```typescript
// Test individual SMS
const testResult = await productionSMSService.sendSMS({
  to: { phone: '+1234567890', organizationId: 'test-org' },
  message: 'Test message from ServiceAI SMS system',
  language: 'en'
})

console.log('Test result:', testResult)
```

### **2. Test Template Formatting**

```typescript
// Test template
const testResult = await smsTemplateSystem.testTemplate(
  'appointment_confirmation',
  'en',
  {
    customer_name: 'Test Customer',
    service_type: 'Test Service',
    date: 'Test Date',
    time: 'Test Time',
    address: 'Test Address'
  }
)

console.log('Formatted message:', testResult.formattedMessage)
```

### **3. Test Emergency SMS**

```typescript
// Test emergency SMS
const emergencyResults = await productionSMSService.sendEmergencySMS(
  'test-org',
  '🚨 TEST EMERGENCY ALERT 🚨 This is a test emergency message.',
  'en'
)

console.log('Emergency results:', emergencyResults)
```

---

## 🔐 **Security & Best Practices**

### **1. Phone Number Validation**

```typescript
// Always validate phone numbers
if (!productionSMSService.validatePhoneNumber(phoneNumber)) {
  throw new Error('Invalid phone number format')
}
```

### **2. Rate Limiting**

```typescript
// Implement rate limiting for SMS sending
class SMSRateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  async checkRateLimit(organizationId: string): Promise<boolean> {
    const now = Date.now()
    const windowMs = 60000 // 1 minute
    const maxRequests = 100 // 100 SMS per minute
    
    const requests = this.requests.get(organizationId) || []
    const recentRequests = requests.filter(time => now - time < windowMs)
    
    if (recentRequests.length >= maxRequests) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(organizationId, recentRequests)
    return true
  }
}
```

### **3. Error Handling**

```typescript
// Always handle SMS errors gracefully
try {
  const result = await productionSMSService.sendSMS(options)
  if (!result.success) {
    console.error('SMS failed:', result.error)
    // Log to database or monitoring service
  }
} catch (error) {
  console.error('SMS error:', error)
  // Handle critical errors
}
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **SMS Not Sending**
   - Check Twilio/Vonage credentials
   - Verify phone number format
   - Check organization SMS settings
   - Review Edge Function logs

2. **Template Not Found**
   - Ensure template exists in database
   - Check language code (en/es)
   - Verify template is active

3. **Provider Fallback Not Working**
   - Ensure both providers are configured
   - Check provider priority settings
   - Verify API keys and secrets

4. **Webhook Not Receiving Status**
   - Check webhook URL configuration
   - Verify signature validation
   - Review webhook handler logs

### **Debug Commands**

```bash
# Check Edge Function logs
supabase functions logs send-sms-production
supabase functions logs sms-webhook-handler

# Test SMS function directly
curl -X POST https://your-project.supabase.co/functions/v1/send-sms-production \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "individual",
    "organizationId": "org-123",
    "phoneNumber": "+1234567890",
    "message": "Test message"
  }'

# Check database for SMS logs
SELECT * FROM sms_communications 
WHERE organization_id = 'org-123'
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📈 **Performance Optimization**

### **1. Batch Processing**

```typescript
// Process SMS in batches to avoid rate limits
const processSMSBatch = async (recipients: SMSRecipient[], message: string, batchSize = 50) => {
  const batches = []
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    await productionSMSService.sendSMS({
      to: batch,
      message
    })
    
    // Add delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}
```

### **2. Template Caching**

```typescript
// Cache templates for better performance
const templateCache = new Map<string, SMSTemplate>()

const getCachedTemplate = async (key: string, language: string) => {
  const cacheKey = `${key}_${language}`
  
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)
  }
  
  const template = await smsTemplateSystem.getTemplate(key, language as 'en' | 'es')
  if (template) {
    templateCache.set(cacheKey, template)
  }
  
  return template
}
```

---

## 🎯 **Success Metrics**

### **Key Performance Indicators**

- **Delivery Rate**: >95% SMS delivery success
- **Response Time**: <2 seconds for SMS sending
- **Provider Uptime**: >99.9% availability
- **Cost Efficiency**: <$0.01 per SMS
- **Template Usage**: >80% template-based messaging

### **Monitoring Dashboard**

```typescript
// SMS metrics for dashboard
const getSMSMetrics = async (organizationId: string) => {
  const { data } = await supabase
    .from('sms_communications')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return {
    totalMessages: data.length,
    deliveryRate: (data.filter(d => d.status === 'delivered').length / data.length) * 100,
    totalCost: data.reduce((sum, d) => sum + (d.cost || 0), 0),
    averageCostPerMessage: data.reduce((sum, d) => sum + (d.cost || 0), 0) / data.length,
    byProvider: data.reduce((acc, d) => {
      acc[d.provider] = (acc[d.provider] || 0) + 1
      return acc
    }, {}),
    byLanguage: data.reduce((acc, d) => {
      acc[d.language_code] = (acc[d.language_code] || 0) + 1
      return acc
    }, {})
  }
}
```

---

## 🏁 **Conclusion**

This SMS implementation provides a robust, scalable solution for ServiceAI's messaging needs. Key features include:

- **Multi-provider support** with automatic fallback
- **Multi-language templates** for global reach
- **Comprehensive tracking** and analytics
- **Emergency alert system** for critical situations
- **Template management** for consistent messaging
- **Security** with proper authentication and validation

The system is production-ready and can handle everything from simple appointment confirmations to complex emergency alerts, making it suitable for service businesses of all sizes.

---

*This implementation guide provides complete instructions for deploying and using the ServiceAI SMS system. For additional support or customization, refer to the main ServiceAI documentation or contact the development team.*
