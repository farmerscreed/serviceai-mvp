# Twilio SMS Integration Guide

**Complete setup guide for SMS messaging with Twilio**

---

## Overview

Twilio provides SMS messaging capabilities for ServiceAI. This guide covers:
- Account setup and configuration
- Phone number management
- SMS template system
- Webhook configuration
- Multi-language support

---

## Prerequisites

- Twilio account (sign up at [twilio.com](https://twilio.com))
- ServiceAI application running
- Supabase database configured

---

## 1. Twilio Account Setup

### 1.1 Create Account
1. Go to [twilio.com](https://twilio.com)
2. Sign up for a new account
3. Verify your phone number
4. Complete account setup

### 1.2 Get Credentials
1. Go to **Console Dashboard**
2. Copy your **Account SID** and **Auth Token**
3. Add to your `.env.local`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 1.3 Purchase Phone Number
1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number with SMS capabilities
3. Purchase the number
4. Note the phone number for configuration

---

## 2. SMS Template System

### 2.1 Multi-Language Templates

ServiceAI includes pre-built SMS templates for both English and Spanish:

#### **Appointment Confirmation**
```typescript
// English
const appointmentConfirmation = {
  key: 'appointment_confirmation',
  language: 'en',
  content: 'Hi {name}! Your {service_type} appointment is confirmed for {date} at {time}. Reply STOP to opt out.',
  variables: ['name', 'service_type', 'date', 'time']
}

// Spanish
const appointmentConfirmationES = {
  key: 'appointment_confirmation',
  language: 'es',
  content: '¡Hola {name}! Su cita de {service_type} está confirmada para el {date} a las {time}. Responda STOP para cancelar.',
  variables: ['name', 'service_type', 'date', 'time']
}
```

#### **Appointment Reminder**
```typescript
// English
const appointmentReminder = {
  key: 'appointment_reminder',
  language: 'en',
  content: 'Reminder: Your {service_type} appointment is tomorrow at {time}. Reply CONFIRM to confirm or CANCEL to cancel.',
  variables: ['service_type', 'time']
}

// Spanish
const appointmentReminderES = {
  key: 'appointment_reminder',
  language: 'es',
  content: 'Recordatorio: Su cita de {service_type} es mañana a las {time}. Responda CONFIRMAR para confirmar o CANCELAR para cancelar.',
  variables: ['service_type', 'time']
}
```

#### **Emergency Alert**
```typescript
// English
const emergencyAlert = {
  key: 'emergency_alert',
  language: 'en',
  content: '🚨 EMERGENCY ALERT: {customer_name} reported {emergency_type} at {address}. Call: {customer_phone}',
  variables: ['customer_name', 'emergency_type', 'address', 'customer_phone']
}

// Spanish
const emergencyAlertES = {
  key: 'emergency_alert',
  language: 'es',
  content: '🚨 ALERTA DE EMERGENCIA: {customer_name} reportó {emergency_type} en {address}. Llamar: {customer_phone}',
  variables: ['customer_name', 'emergency_type', 'address', 'customer_phone']
}
```

### 2.2 Template Variables

Common variables used across templates:

- `{name}` - Customer name
- `{service_type}` - Type of service (HVAC, Plumbing, Electrical)
- `{date}` - Appointment date
- `{time}` - Appointment time
- `{address}` - Service address
- `{phone}` - Customer phone number
- `{business_name}` - Organization name
- `{business_phone}` - Business phone number

---

## 3. SMS Service Implementation

### 3.1 Twilio SMS Service

```typescript
// lib/sms/twilio-sms-service.ts
import { Twilio } from 'twilio'

export class TwilioSMSService {
  private client: Twilio

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }

  async sendSMS({
    to,
    message,
    from = process.env.TWILIO_PHONE_NUMBER
  }: {
    to: string
    message: string
    from?: string
  }) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from,
        to,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms-status`
      })

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
```

### 3.2 Multi-Language SMS Service

```typescript
// lib/sms/multilingual-sms-service.ts
export class MultilingualSMSService {
  private twilioService = new TwilioSMSService()

  async sendMultilingualSMS({
    phone,
    templateKey,
    language,
    variables
  }: {
    phone: string
    templateKey: string
    language: 'en' | 'es'
    variables: Record<string, string>
  }) {
    // Get template
    const template = this.getTemplate(templateKey, language)
    
    // Replace variables
    let message = template.content
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value)
    })

    // Send SMS
    return await this.twilioService.sendSMS({
      to: phone,
      message
    })
  }

  private getTemplate(key: string, language: 'en' | 'es') {
    // Template lookup logic
    return templates[key][language]
  }
}
```

---

## 4. Webhook Configuration

### 4.1 SMS Status Webhooks

Configure Twilio to send status updates:

1. **Go to Twilio Console** → **Phone Numbers** → **Manage** → **Active Numbers**
2. **Click on your phone number**
3. **Set webhook URL:**
   - **A message comes in:** `https://yourdomain.com/api/webhooks/sms-incoming`
   - **Status callback:** `https://yourdomain.com/api/webhooks/sms-status`

### 4.2 Incoming SMS Webhook

```typescript
// app/api/webhooks/sms-incoming/route.ts
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get('From') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string

    // Process incoming SMS
    await processIncomingSMS({
      from,
      body,
      messageSid
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('SMS webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}
```

### 4.3 SMS Status Webhook

```typescript
// app/api/webhooks/sms-status/route.ts
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const messageSid = formData.get('MessageSid') as string
    const status = formData.get('MessageStatus') as string
    const errorCode = formData.get('ErrorCode') as string

    // Update SMS status in database
    await updateSMSStatus({
      messageSid,
      status,
      errorCode
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('SMS status webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}
```

---

## 5. SMS Workflow Engine

### 5.1 Workflow Triggers

SMS messages are triggered by various events:

```typescript
// lib/sms/sms-workflow-engine.ts
export class SMSWorkflowEngine {
  async triggerAppointmentWorkflow(appointment: Appointment, language: 'en' | 'es') {
    // Send confirmation immediately
    await this.sendAppointmentConfirmation(appointment, language)
    
    // Schedule reminder for 24 hours before
    await this.scheduleReminder(appointment, language, 24)
    
    // Schedule final reminder for 2 hours before
    await this.scheduleReminder(appointment, language, 2)
  }

  async triggerEmergencyWorkflow(emergency: Emergency, language: 'en' | 'es') {
    // Send immediate emergency alert
    await this.sendEmergencyAlert(emergency, language)
  }
}
```

### 5.2 Scheduled SMS

```typescript
// Use Supabase Edge Functions for scheduling
export async function scheduleSMS({
  appointmentId,
  templateKey,
  language,
  scheduledTime
}: {
  appointmentId: string
  templateKey: string
  language: 'en' | 'es'
  scheduledTime: Date
}) {
  // Store in database with scheduled time
  await supabase
    .from('scheduled_sms')
    .insert({
      appointment_id: appointmentId,
      template_key: templateKey,
      language,
      scheduled_time: scheduledTime,
      status: 'scheduled'
    })
}
```

---

## 6. Two-Way SMS Handling

### 6.1 Response Processing

```typescript
// Process customer responses
async function processIncomingSMS({
  from,
  body,
  messageSid
}: {
  from: string
  body: string
  messageSid: string
}) {
  const response = body.toLowerCase().trim()

  // Handle common responses
  switch (response) {
    case 'confirm':
    case 'confirmar':
      await handleAppointmentConfirmation(from)
      break
    
    case 'cancel':
    case 'cancelar':
      await handleAppointmentCancellation(from)
      break
    
    case 'stop':
      await handleOptOut(from)
      break
    
    case 'help':
    case 'ayuda':
      await sendHelpMessage(from)
      break
    
    default:
      await handleGeneralInquiry(from, body)
  }
}
```

### 6.2 Response Templates

```typescript
const responseTemplates = {
  confirmation: {
    en: "Thank you for confirming your appointment. We'll see you then!",
    es: "Gracias por confirmar su cita. ¡Nos vemos entonces!"
  },
  cancellation: {
    en: "Your appointment has been cancelled. Call us to reschedule.",
    es: "Su cita ha sido cancelada. Llámenos para reprogramar."
  },
  optOut: {
    en: "You have been unsubscribed from SMS notifications.",
    es: "Ha sido dado de baja de las notificaciones SMS."
  }
}
```

---

## 7. SMS Analytics & Logging

### 7.1 SMS Logs

```typescript
// Track all SMS communications
interface SMSLog {
  id: string
  organizationId: string
  phoneNumber: string
  messageType: string
  language: 'en' | 'es'
  content: string
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'failed'
  messageSid?: string
  createdAt: Date
  deliveredAt?: Date
}
```

### 7.2 Analytics Dashboard

Track key metrics:
- SMS delivery rates
- Response rates
- Language preferences
- Template performance
- Cost analysis

---

## 8. Testing

### 8.1 Local Testing

```bash
# Test SMS sending
curl -X POST http://localhost:3000/api/sms/test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "template": "appointment_confirmation",
    "language": "en",
    "variables": {
      "name": "John Doe",
      "service_type": "HVAC Repair",
      "date": "March 15, 2025",
      "time": "2:00 PM"
    }
  }'
```

### 8.2 Production Testing

1. **Send test SMS** to your phone
2. **Verify delivery** in Twilio console
3. **Test webhook** with ngrok
4. **Test two-way SMS** responses
5. **Verify database logging**

---

## 9. Production Deployment

### 9.1 Environment Variables

```bash
# Production environment
TWILIO_ACCOUNT_SID=AC_prod_account_sid
TWILIO_AUTH_TOKEN=prod_auth_token
TWILIO_PHONE_NUMBER=+15551234567
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 9.2 Webhook URLs

Update Twilio webhook URLs to production:
- **Incoming SMS:** `https://yourdomain.com/api/webhooks/sms-incoming`
- **Status Callback:** `https://yourdomain.com/api/webhooks/sms-status`

---

## 10. Cost Management

### 10.1 SMS Pricing

- **US SMS:** ~$0.0075 per message
- **International SMS:** Varies by country
- **MMS:** Higher cost than SMS

### 10.2 Cost Optimization

- Use SMS templates efficiently
- Implement opt-out handling
- Monitor usage patterns
- Set up billing alerts

---

## 11. Troubleshooting

### 11.1 Common Issues

#### **SMS Not Delivering**
- Check phone number format (+1XXXXXXXXXX)
- Verify Twilio account balance
- Check webhook URL accessibility
- Review error codes in Twilio console

#### **Webhook Not Receiving Events**
- Verify webhook URL is accessible
- Check firewall settings
- Test with ngrok for local development
- Review Twilio webhook configuration

#### **Template Variables Not Replacing**
- Check variable names match exactly
- Verify variable values are provided
- Test template rendering

### 11.2 Debug Mode

```typescript
// Enable SMS debugging
const debugConfig = {
  logAllSMS: true,
  logWebhooks: true,
  logTemplates: true
}
```

---

## 12. Best Practices

### 12.1 SMS Content

- Keep messages concise
- Include clear call-to-action
- Provide opt-out instructions
- Use appropriate language for audience

### 12.2 Compliance

- Follow TCPA regulations
- Implement opt-out handling
- Respect customer preferences
- Maintain delivery logs

### 12.3 Performance

- Batch SMS operations when possible
- Implement retry logic
- Monitor delivery rates
- Optimize template usage

---

**Last Updated:** October 8, 2025  
**Version:** Production Ready
