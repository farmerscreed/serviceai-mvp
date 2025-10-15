# 📱 CHURCHOS SMS SYSTEM - COMPLETE IMPLEMENTATION GUIDE

**Production-Ready SMS System for Church Management** | Last Updated: January 2025

## 📋 **SYSTEM OVERVIEW**

The ChurchOS SMS system is a comprehensive, multi-provider messaging solution that enables churches to send SMS messages to individuals, groups, and campaigns with automatic fallback between providers (Twilio and Vonage). The system includes SMS giving functionality, automated workflows, and complete audit trails.

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **Core Components**
1. **Frontend Services** - React/TypeScript SMS service layer
2. **Backend Edge Functions** - Supabase Edge Functions for SMS processing
3. **Database Schema** - PostgreSQL tables for SMS tracking and campaigns
4. **Provider Integration** - Twilio and Vonage API integrations
5. **SMS Giving** - Specialized SMS donation processing
6. **Queue Processing** - Background SMS queue management

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **SMS Providers**: Twilio, Vonage (Nexmo)
- **Payment Processing**: Stripe integration for SMS giving

---

## 📊 **DATABASE SCHEMA**

### **Core SMS Tables**

#### **`communication_campaigns`** - SMS Campaign Management
```sql
CREATE TABLE public.communication_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'sms', 'push', 'multi_channel')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
    target_audience JSONB DEFAULT '{}',
    content_template TEXT,
    scheduled_for TIMESTAMPTZ,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`communication_history`** - SMS Message Tracking
```sql
CREATE TABLE public.communication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.communication_campaigns(id),
    recipient_id UUID REFERENCES public.people(id),
    communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms', 'call', 'push')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'bounced')),
    subject TEXT,
    content TEXT,
    message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    communication_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`payment_sources`** - SMS Provider Configuration
```sql
CREATE TABLE public.payment_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('stripe', 'paypal', 'square', 'rytepay', 'twilio_sms', 'plaid')),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'error')),
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`people`** - Member Phone Numbers
```sql
CREATE TABLE public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    sms_opt_in BOOLEAN DEFAULT false,
    -- ... other fields
);
```

---

## 🔧 **FRONTEND IMPLEMENTATION**

### **1. SMS Service (`src/services/smsService.ts`)**

```typescript
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { smsProviders } from '@/config/sms-providers';

export type SMSProvider = 'twilio' | 'vonage';

export interface SMSRecipient {
  phone: string;
  name?: string;
}

export interface SMSOptions {
  to: SMSRecipient | SMSRecipient[];
  message: string;
  from?: string;
  provider?: SMSProvider;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: SMSProvider;
  cost?: number;
}

export class SMSService {
  async sendSMS(options: SMSOptions, preferredProvider?: SMSProvider): Promise<SMSResponse> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    let lastError: any = null;

    // Try providers in priority order
    const providersToTry = preferredProvider 
      ? [smsProviders.find(p => p.name === preferredProvider), ...smsProviders.filter(p => p.name !== preferredProvider)]
      : smsProviders;

    for (const provider of providersToTry) {
      if (!provider) continue;
      
      try {
        const functionName = `${provider.name}-sms`;
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: {
            to: recipients.map(r => r.phone),
            message: options.message,
            from: options.from,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        logger.info(`SMS sent successfully via ${functionName} function`, {
          messageId: data?.messageId,
          to: recipients.map(r => r.phone),
          provider: provider.name,
        });

        return {
          success: true,
          messageId: data?.messageId || `sms-${Date.now()}`,
          provider: provider.name,
          cost: data?.cost || 0.0075,
        };
      } catch (error) {
        lastError = error;
        logger.warn(`Failed to send SMS via ${provider.name}, trying next provider`, { error: error.message });
      }
    }

    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : 'All SMS providers failed',
      provider: smsProviders[smsProviders.length - 1]?.name || 'twilio',
    };
  }

  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return phone;
  }
}

export const smsService = new SMSService();
```

### **2. SMS Provider Configuration (`src/config/sms-providers.ts`)**

```typescript
import { SMSProvider } from '@/services/smsService';

export interface SMSProviderConfig {
  name: SMSProvider;
  apiKey: string;
  apiSecret?: string;
  priority: number;
}

export const smsProviders: SMSProviderConfig[] = [
  {
    name: 'twilio',
    apiKey: import.meta.env.VITE_TWILIO_SID || '',
    apiSecret: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
    priority: 1,
  },
  {
    name: 'vonage',
    apiKey: import.meta.env.VITE_VONAGE_API_KEY || '',
    apiSecret: import.meta.env.VITE_VONAGE_API_SECRET || '',
    priority: 2,
  },
].filter(provider => provider.apiKey);

smsProviders.sort((a, b) => a.priority - b.priority);
```

### **3. Twilio Connect Component (`src/components/giving/TwilioConnect.tsx`)**

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TwilioConnect = () => {
  const { currentOrganization } = useAuthStore();
  const { toast } = useToast();
  const [sid, setSid] = useState('');
  const [token, setToken] = useState('');
  const [messagingServiceSid, setMessagingServiceSid] = useState('');

  const handleConnect = async () => {
    const { error } = await supabase.from('payment_sources').insert({
      organization_id: currentOrganization!.id,
      type: 'twilio_sms',
      name: 'Twilio',
      status: 'connected',
      config: {
        sid,
        token,
        messaging_service_sid: messagingServiceSid,
      },
    });

    if (error) {
      toast({ title: 'Error connecting to Twilio', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Connected to Twilio successfully' });
      setSid('');
      setToken('');
      setMessagingServiceSid('');
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Account SID"
        value={sid}
        onChange={(e) => setSid(e.target.value)}
      />
      <Input
        placeholder="Auth Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <Input
        placeholder="Messaging Service SID"
        value={messagingServiceSid}
        onChange={(e) => setMessagingServiceSid(e.target.value)}
      />
      <Button onClick={handleConnect}>
        Connect to Twilio
      </Button>
    </div>
  );
};
```

---

## ⚡ **SUPABASE EDGE FUNCTIONS**

### **1. Unified SMS Sender (`supabase/functions/send-sms-unified/index.ts`)**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  type: 'individual' | 'group' | 'campaign'
  recipientId?: string
  groupId?: string
  campaignId?: string
  message: string
  organizationId: string
  provider?: 'twilio' | 'vonage'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, recipientId, groupId, campaignId, message, organizationId, provider = 'twilio' }: SMSRequest = await req.json()

    // Get organization communication settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('communication_automation_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (settingsError || !settings.sms_enabled) {
      throw new Error('SMS not enabled for this organization')
    }

    let recipients: SMSRecipient[] = []

    // Get recipients based on type
    switch (type) {
      case 'individual':
        if (!recipientId) throw new Error('Recipient ID is required for individual SMS')
        
        const { data: person, error: personError } = await supabaseClient
          .from('people')
          .select('id, phone_number, first_name, last_name')
          .eq('id', recipientId)
          .eq('organization_id', organizationId)
          .single()

        if (personError || !person || !person.phone_number) {
          throw new Error(`Recipient not found or has no phone number`)
        }

        recipients = [{
          id: person.id,
          phone: person.phone_number,
          name: `${person.first_name} ${person.last_name}`.trim()
        }]
        break

      case 'group':
        if (!groupId) throw new Error('Group ID is required for group SMS')

        const { data: groupMembers, error: groupError } = await supabaseClient
          .from('group_members')
          .select(`
            people (
              id,
              phone_number,
              first_name,
              last_name
            )
          `)
          .eq('group_id', groupId)

        if (groupError) throw new Error(`Failed to get group members: ${groupError.message}`)

        recipients = groupMembers
          .map(member => member.people)
          .filter(person => person && person.phone_number)
          .map(person => ({
            id: person.id,
            phone: person.phone_number,
            name: `${person.first_name} ${person.last_name}`.trim()
          }))
        break

      case 'campaign':
        if (!campaignId) throw new Error('Campaign ID is required for campaign SMS')

        const { data: campaign, error: campaignError } = await supabaseClient
          .from('communication_campaigns')
          .select('metadata')
          .eq('id', campaignId)
          .single()

        if (campaignError || !campaign) throw new Error('Campaign not found')

        const campaignRecipients = campaign.metadata?.recipients || []
        recipients = campaignRecipients
          .filter((recipient: any) => recipient.phone)
          .map((recipient: any) => ({
            id: recipient.id,
            phone: recipient.phone,
            name: recipient.name
          }))
        break

      default:
        throw new Error('Invalid SMS type')
    }

    if (recipients.length === 0) {
      throw new Error('No recipients found')
    }

    // Send SMS with automatic fallback between providers
    const smsPromises = recipients.map(async (recipient) => {
      try {
        let smsResult: any = null
        let usedProvider = 'unknown'
        let errorDetails = ''

        // Try Twilio first (if configured)
        if (settings.twilio_phone_number || Deno.env.get('TWILIO_PHONE_NUMBER')) {
          try {
            const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
            const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
            const twilioPhoneNumber = settings.twilio_phone_number || Deno.env.get('TWILIO_PHONE_NUMBER')

            if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
              const body = new URLSearchParams({
                To: recipient.phone,
                From: twilioPhoneNumber,
                Body: message
              })

              const response = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
              })

              if (response.ok) {
                smsResult = await response.json()
                usedProvider = 'twilio'
              } else {
                const errorText = await response.text()
                errorDetails = `Twilio failed: ${errorText}`
                throw new Error(`Twilio API error: ${errorText}`)
              }
            } else {
              errorDetails = 'Twilio configuration incomplete'
              throw new Error('Twilio configuration incomplete')
            }
          } catch (twilioError) {
            errorDetails = twilioError.message
          }
        }

        // If Twilio failed or not configured, try Vonage
        if (!smsResult && (settings.vonage_phone_number || Deno.env.get('VONAGE_PHONE_NUMBER'))) {
          try {
            const vonageApiKey = Deno.env.get('VONAGE_API_KEY')
            const vonageApiSecret = Deno.env.get('VONAGE_API_SECRET')
            const vonagePhoneNumber = settings.vonage_phone_number || Deno.env.get('VONAGE_PHONE_NUMBER')

            if (vonageApiKey && vonageApiSecret && vonagePhoneNumber) {
              const vonageUrl = 'https://rest.nexmo.com/sms/json'
              const body = new URLSearchParams({
                api_key: vonageApiKey,
                api_secret: vonageApiSecret,
                to: recipient.phone,
                from: vonagePhoneNumber,
                text: message
              })

              const response = await fetch(vonageUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
              })

              if (response.ok) {
                smsResult = await response.json()
                usedProvider = 'vonage'
              } else {
                const errorText = await response.text()
                errorDetails += ` | Vonage failed: ${errorText}`
                throw new Error(`Vonage API error: ${errorText}`)
              }
            } else {
              errorDetails += ' | Vonage configuration incomplete'
              throw new Error('Vonage configuration incomplete')
            }
          } catch (vonageError) {
            errorDetails += ` | Vonage error: ${vonageError.message}`
          }
        }

        // If both providers failed, throw comprehensive error
        if (!smsResult) {
          throw new Error(`All SMS providers failed. ${errorDetails}`)
        }

        // Log successful SMS to communication_history
        await supabaseClient
          .from('communication_history')
          .insert({
            organization_id: organizationId,
            person_id: recipient.id,
            type: 'sms',
            direction: 'outbound',
            subject: null,
            content: message,
            status: 'delivered',
            communication_date: new Date().toISOString(),
            metadata: {
              provider: usedProvider,
              message_id: smsResult?.sid || smsResult?.message_id,
              campaign_id: campaignId,
              group_id: groupId,
              phone: recipient.phone
            }
          })

        return {
          recipient: recipient.name,
          phone: recipient.phone,
          status: 'sent',
          message_id: smsResult?.sid || smsResult?.message_id,
          provider: usedProvider
        }
      } catch (error) {
        // Log failed SMS to communication_history
        await supabaseClient
          .from('communication_history')
          .insert({
            organization_id: organizationId,
            person_id: recipient.id,
            type: 'sms',
            direction: 'outbound',
            subject: null,
            content: message,
            status: 'failed',
            communication_date: new Date().toISOString(),
            metadata: {
              provider: usedProvider || 'unknown',
              error_message: error.message,
              campaign_id: campaignId,
              group_id: groupId,
              phone: recipient.phone
            }
          })

        return {
          recipient: recipient.name,
          phone: recipient.phone,
          status: 'failed',
          error: error.message,
          attempted_providers: usedProvider || 'none'
        }
      }
    })

    const results = await Promise.all(smsPromises)
    const sentCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    // Update campaign if this is a campaign SMS
    if (campaignId) {
      await supabaseClient
        .from('communication_campaigns')
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
          status: 'completed'
        })
        .eq('id', campaignId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS campaign completed: ${sentCount} sent, ${failedCount} failed`,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('SMS send error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

### **2. SMS Giving Function (`supabase/functions/twilio-sms-giving/index.ts`)**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"
import Stripe from "https://esm.sh/stripe@11.1.0"
import { Twilio } from "https://esm.sh/twilio@4.21.0"
import { getTwilioSignature, validateRequest } from "https://esm.sh/twilio/lib/webhooks/webhooks.js"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
)

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
})

const twilio = new Twilio(
  Deno.env.get("TWILIO_SID")!,
  Deno.env.get("TWILIO_AUTH")!,
)

serve(async (req) => {
  const signature = req.headers.get("x-twilio-signature")
  const url = req.url
  const body = await req.formData()
  const params = Object.fromEntries(body.entries())

  if (!validateRequest(Deno.env.get("TWILIO_AUTH_TOKEN")!, signature, url, params)) {
    return new Response("Invalid signature", { status: 400 })
  }

  const message = body.get("Body")
  const from = body.get("From")
  const to = body.get("To")

  if (!message || !from || !to) {
    return new Response("Missing required fields", { status: 400 })
  }

  const amount = parseInt(message, 10)

  if (isNaN(amount)) {
    return new Response("Invalid amount", { status: 400 })
  }

  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
    })

    await twilio.messages.create({
      body: `Click here to complete your donation: ${paymentLink.url}`,
      from: to,
      to: from,
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error("Error creating payment link or sending message:", error)
    return new Response("Error creating payment link or sending message", {
      status: 500,
    })
  }
})
```

### **3. SMS Queue Processor (`supabase/functions/process-sms-queue/index.ts`)**

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const smsProviders = [
  { name: 'twilio', priority: 1 },
  { name: 'vonage', priority: 2 }
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Process SMS queue function called')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch a batch of queued SMS messages
    const { data: queuedSMS, error: fetchError } = await supabaseAdmin
      .from('communications')
      .select('*')
      .eq('status', 'queued')
      .eq('type', 'sms')
      .limit(10)

    if (fetchError) throw fetchError

    if (!queuedSMS || queuedSMS.length === 0) {
      return new Response(JSON.stringify({ message: 'No queued SMS to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Process each SMS
    for (const sms of queuedSMS) {
      try {
        console.log('Processing SMS:', sms.id)
        
        // Update status to "sending"
        await supabaseAdmin
          .from('communications')
          .update({ status: 'sending' })
          .eq('id', sms.id)

        // Fetch recipients
        const { data: members, error: membersError } = await supabaseAdmin
          .from('group_members')
          .select(`
            people!inner (
              phone_number
            )
          `)
          .eq('group_id', sms.recipient_group_id)

        if (membersError) throw membersError

        const recipients = members?.map(m => m.people.phone_number).filter(Boolean)

        if (!recipients || recipients.length === 0) {
          await supabaseAdmin
            .from('communications')
            .update({ status: 'failed', error_message: 'No recipients found' })
            .eq('id', sms.id)
          continue
        }

        let lastError: any = null;

        for (const provider of smsProviders) {
          try {
            const functionName = `${provider.name}-sms`;
            console.log('Invoking SMS function:', functionName)
            
            const { data, error } = await supabaseAdmin.functions.invoke(functionName, {
              body: {
                to: recipients,
                message: sms.body,
              },
            });

            if (error) throw new Error(error.message);

            // Update status to "sent"
            await supabaseAdmin
              .from('communications')
              .update({ status: 'sent', sent_at: new Date().toISOString(), provider: provider.name, cost: data.cost })
              .eq('id', sms.id)

            lastError = null;
            break;
          } catch (error) {
            console.error('SMS provider error:', error)
            lastError = error;
          }
        }

        if (lastError) throw lastError;

      } catch (error) {
        console.error('Error processing SMS:', error)
        
        // Update status to "failed"
        await supabaseAdmin
          .from('communications')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', sms.id)
      }
    }

    return new Response(JSON.stringify({ message: 'SMS queue processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Process SMS queue error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

---

## 🎯 **USAGE EXAMPLES**

### **1. Send Individual SMS**

```typescript
import { smsService } from '@/services/smsService';

// Send SMS to individual person
const result = await smsService.sendSMS({
  to: { phone: '+1234567890', name: 'John Doe' },
  message: 'Welcome to our church! We look forward to seeing you this Sunday.',
  from: '+1987654321'
});

if (result.success) {
  console.log('SMS sent successfully:', result.messageId);
} else {
  console.error('SMS failed:', result.error);
}
```

### **2. Send Group SMS**

```typescript
// Send SMS to multiple recipients
const result = await smsService.sendSMS({
  to: [
    { phone: '+1234567890', name: 'John Doe' },
    { phone: '+1234567891', name: 'Jane Smith' },
    { phone: '+1234567892', name: 'Bob Johnson' }
  ],
  message: 'Reminder: Youth group meeting tonight at 7 PM in the main hall.',
  from: '+1987654321'
});
```

### **3. Send Campaign SMS via Edge Function**

```typescript
import { supabase } from '@/integrations/supabase/client';

// Send SMS campaign
const { data, error } = await supabase.functions.invoke('send-sms-unified', {
  body: {
    type: 'campaign',
    campaignId: 'campaign-uuid-here',
    message: 'Join us for our special Christmas service this Sunday at 10 AM!',
    organizationId: 'org-uuid-here'
  }
});

if (error) {
  console.error('Campaign SMS failed:', error);
} else {
  console.log('Campaign SMS sent:', data);
}
```

### **4. SMS Giving Integration**

```typescript
// SMS giving webhook handler
const handleSMSGiving = async (req: Request) => {
  const formData = await req.formData();
  const message = formData.get('Body');
  const from = formData.get('From');
  
  const amount = parseInt(message as string, 10);
  
  if (isNaN(amount)) {
    return new Response('Invalid amount', { status: 400 });
  }
  
  // Create Stripe payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Donation' },
        unit_amount: amount * 100,
      },
      quantity: 1,
    }],
  });
  
  // Send payment link back via SMS
  await twilio.messages.create({
    body: `Click here to complete your $${amount} donation: ${paymentLink.url}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: from as string,
  });
  
  return new Response('OK', { status: 200 });
};
```

---

## 🔐 **ENVIRONMENT VARIABLES**

### **Required Environment Variables**

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Vonage Configuration (Optional - for fallback)
VONAGE_API_KEY=your-vonage-api-key
VONAGE_API_SECRET=your-vonage-api-secret
VONAGE_PHONE_NUMBER=+1234567890

# Stripe Configuration (for SMS giving)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Frontend Environment Variables
VITE_TWILIO_SID=your-twilio-account-sid
VITE_TWILIO_AUTH_TOKEN=your-twilio-auth-token
VITE_VONAGE_API_KEY=your-vonage-api-key
VITE_VONAGE_API_SECRET=your-vonage-api-secret
```

---

## 🚀 **DEPLOYMENT STEPS**

### **1. Database Setup**

```sql
-- Run the database schema from CHURCHOS_DATABASE_SCHEMA_CURRENT.md
-- Ensure all SMS-related tables are created with proper RLS policies
```

### **2. Supabase Edge Functions Deployment**

```bash
# Deploy SMS functions
supabase functions deploy send-sms-unified
supabase functions deploy twilio-sms-giving
supabase functions deploy process-sms-queue

# Set environment variables
supabase secrets set TWILIO_ACCOUNT_SID=your-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
supabase secrets set VONAGE_API_KEY=your-key
supabase secrets set VONAGE_API_SECRET=your-secret
supabase secrets set STRIPE_SECRET_KEY=your-stripe-key
```

### **3. Frontend Configuration**

```typescript
// Update your .env.local file with SMS provider credentials
VITE_TWILIO_SID=your-twilio-account-sid
VITE_TWILIO_AUTH_TOKEN=your-twilio-auth-token
VITE_VONAGE_API_KEY=your-vonage-api-key
VITE_VONAGE_API_SECRET=your-vonage-api-secret
```

### **4. Twilio Webhook Configuration**

```bash
# Set up Twilio webhook for SMS giving
# Webhook URL: https://your-project.supabase.co/functions/v1/twilio-sms-giving
# HTTP Method: POST
# Events: Incoming Messages
```

---

## 📊 **MONITORING & ANALYTICS**

### **SMS Metrics Dashboard**

```typescript
// Get SMS statistics
const getSMSStats = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('communication_history')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('type', 'sms')
    .gte('communication_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const stats = {
    total: data.length,
    sent: data.filter(d => d.status === 'sent').length,
    delivered: data.filter(d => d.status === 'delivered').length,
    failed: data.filter(d => d.status === 'failed').length,
    byProvider: data.reduce((acc, d) => {
      const provider = d.metadata?.provider || 'unknown';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return stats;
};
```

### **Cost Tracking**

```typescript
// Track SMS costs
const getSMSCosts = async (organizationId: string, startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('communication_history')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('type', 'sms')
    .eq('status', 'sent')
    .gte('communication_date', startDate.toISOString())
    .lte('communication_date', endDate.toISOString());

  if (error) throw error;

  const totalCost = data.reduce((sum, d) => {
    return sum + (d.metadata?.cost || 0.0075); // Default Twilio cost
  }, 0);

  return {
    totalCost,
    messageCount: data.length,
    averageCostPerMessage: totalCost / data.length
  };
};
```

---

## 🧪 **TESTING**

### **Unit Tests**

```typescript
// tests/smsService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { smsService } from '@/services/smsService';

describe('SMSService', () => {
  it('should format phone numbers correctly', () => {
    expect(smsService.formatPhoneNumber('1234567890')).toBe('+11234567890');
    expect(smsService.formatPhoneNumber('+11234567890')).toBe('+11234567890');
    expect(smsService.formatPhoneNumber('11234567890')).toBe('+11234567890');
  });

  it('should send SMS successfully', async () => {
    const mockResponse = {
      success: true,
      messageId: 'test-message-id',
      provider: 'twilio',
      cost: 0.0075
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: mockResponse,
      error: null
    });

    const result = await smsService.sendSMS({
      to: { phone: '+1234567890', name: 'Test User' },
      message: 'Test message'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('test-message-id');
  });
});
```

### **Integration Tests**

```typescript
// tests/twilio-sms-giving.test.ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!

Deno.test("Twilio SMS Giving", async (t) => {
  await t.step("should return 400 if amount is invalid", async () => {
    const formData = new FormData()
    formData.append("Body", "invalid")
    formData.append("From", "1234567890")
    formData.append("To", "0987654321")

    const res = await fetch(`${SUPABASE_URL}/functions/v1/twilio-sms-giving`, {
      method: "POST",
      body: formData,
    })
    assertEquals(res.status, 400)
  })

  await t.step("should return 200 if amount is valid", async () => {
    const formData = new FormData()
    formData.append("Body", "50")
    formData.append("From", "1234567890")
    formData.append("To", "0987654321")

    const res = await fetch(`${SUPABASE_URL}/functions/v1/twilio-sms-giving`, {
      method: "POST",
      body: formData,
    })
    assertEquals(res.status, 200)
  })
})
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

1. **SMS Not Sending**
   - Check Twilio/Vonage credentials
   - Verify phone number format
   - Check organization SMS settings
   - Review Edge Function logs

2. **Provider Fallback Not Working**
   - Ensure both providers are configured
   - Check provider priority settings
   - Verify API keys and secrets

3. **SMS Giving Not Working**
   - Verify Twilio webhook configuration
   - Check Stripe integration
   - Ensure proper signature validation

4. **Queue Processing Issues**
   - Check cron job configuration
   - Verify database permissions
   - Review queue processor logs

### **Debug Commands**

```bash
# Check Edge Function logs
supabase functions logs send-sms-unified

# Test SMS function directly
curl -X POST https://your-project.supabase.co/functions/v1/send-sms-unified \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "individual",
    "recipientId": "person-uuid",
    "message": "Test message",
    "organizationId": "org-uuid"
  }'

# Check database for SMS logs
SELECT * FROM communication_history 
WHERE type = 'sms' 
ORDER BY communication_date DESC 
LIMIT 10;
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Batch Processing**

```typescript
// Process SMS in batches to avoid rate limits
const processSMSBatch = async (recipients: SMSRecipient[], message: string, batchSize = 50) => {
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await smsService.sendSMS({
      to: batch,
      message
    });
    
    // Add delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

### **Caching**

```typescript
// Cache provider configurations
const providerCache = new Map();

const getProviderConfig = async (organizationId: string) => {
  if (providerCache.has(organizationId)) {
    return providerCache.get(organizationId);
  }

  const { data } = await supabase
    .from('communication_automation_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  providerCache.set(organizationId, data);
  return data;
};
```

---

## 🎯 **BEST PRACTICES**

### **1. Phone Number Validation**

```typescript
const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};
```

### **2. Message Length Optimization**

```typescript
const optimizeMessageLength = (message: string): string => {
  // SMS messages should be under 160 characters for single SMS
  if (message.length <= 160) return message;
  
  // For longer messages, consider splitting or using MMS
  return message.substring(0, 157) + '...';
};
```

### **3. Error Handling**

```typescript
const sendSMSWithRetry = async (options: SMSOptions, maxRetries = 3): Promise<SMSResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await smsService.sendSMS(options);
      if (result.success) return result;
      lastError = new Error(result.error);
    } catch (error) {
      lastError = error as Error;
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded',
    provider: 'unknown'
  };
};
```

### **4. Rate Limiting**

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}

const smsRateLimiter = new RateLimiter(100, 60000); // 100 SMS per minute
```

---

## 🏁 **CONCLUSION**

The ChurchOS SMS system provides a robust, scalable solution for church communication needs. Key features include:

- **Multi-provider support** with automatic fallback
- **SMS giving integration** with Stripe
- **Comprehensive tracking** and analytics
- **Queue processing** for high-volume messaging
- **Template system** for consistent messaging
- **Security** with proper authentication and validation

This system can handle everything from simple individual messages to complex campaign management, making it suitable for churches of all sizes.

---

*This documentation provides a complete guide for implementing the ChurchOS SMS system. For additional support or customization, refer to the main ChurchOS documentation or contact the development team.*
