# Phone Number Provisioning & Scaling Guide

## Overview

ServiceAI automatically provisions phone numbers for every assistant using a smart fallback strategy. This guide explains how the system works and how to scale beyond 10 customers.

---

## 🎯 Quick Summary

| Stage | Customers | Solution | Cost | Setup Time |
|-------|-----------|----------|------|------------|
| **MVP** | 1-10 | FREE Vapi Numbers | $0 | 0 minutes ✅ |
| **Growth** | 11-50 | Twilio Numbers | ~$1/mo each | 15 minutes |
| **Scale** | 50+ | Multi-Org Twilio | ~$1/mo each | 30 minutes |

---

## 📱 How Phone Provisioning Works

### Automatic Provisioning Strategy

When an assistant is created, the system attempts provisioning in this order:

```
1. FREE Vapi Phone Number (PRIMARY) 🎯
   ↓ If limit reached (10 max)

2. Organization's Twilio Numbers
   ↓ If not configured

3. Global Twilio Fallback
   ↓ If not configured

4. Manual Assignment (requires user action)
```

---

## 🆓 Stage 1: FREE Vapi Numbers (0-10 Customers)

### What You Get

- **10 FREE US phone numbers**
- Zero configuration required
- Automatic provisioning
- ~2 minute activation time
- Perfect for MVP and early testing

### Implementation

✅ **Already working!** No setup needed.

Every new assistant automatically gets a free Vapi number until you hit the 10-number limit.

### Monitoring Usage

The system automatically tracks usage and warns you:

```typescript
// Automatic usage check before provisioning
📊 Vapi Free Number Usage:
   Used: 7/10 (70%)
   Remaining: 3

⚠️  WARNING: Approaching FREE number limit!
   Only 3 free numbers remaining
   Consider setting up Twilio for additional numbers
```

### When to Move On

When you see this message, it's time to set up Twilio:

```
🚨 FREE NUMBER LIMIT REACHED (10/10 used)
   Next assistant will require Twilio configuration
```

**Congrats!** This means you have 10+ paying customers. Time to scale! 🚀

---

## 💳 Stage 2: Twilio Integration (11-50 Customers)

### Why Twilio?

- **$1-2/month per number** (affordable scaling)
- **International numbers** available
- **SMS capabilities** (Vapi SIP is voice-only)
- **Custom area codes** for all customers
- **No limits** on number count

### Setup Instructions

#### Step 1: Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial ($15 credit)
3. Verify your phone number

#### Step 2: Buy Phone Numbers

1. Visit: [console.twilio.com/us1/develop/phone-numbers/manage/search](https://console.twilio.com/us1/develop/phone-numbers/manage/search)
2. Search for numbers by area code or country
3. Purchase numbers (~$1/month each)
4. Buy multiple numbers if needed (one per customer)

**Pro Tip:** Buy numbers in your customers' area codes for better local presence.

#### Step 3: Get Twilio Credentials

1. Go to [console.twilio.com](https://console.twilio.com)
2. Copy your **Account SID** (starts with `AC...`)
3. Copy your **Auth Token** (click "Show" to reveal)

#### Step 4: Configure ServiceAI

Add to your `.env.local` file:

```bash
# Twilio Configuration (for 10+ customers)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

#### Step 5: Restart Server

```bash
npm run dev
```

### How It Works

Once configured, the system will:

1. **First 10 assistants:** Use FREE Vapi numbers (no Twilio charges)
2. **11th assistant onwards:** Automatically import your Twilio numbers
3. **Seamless fallback:** If Vapi fails, uses Twilio automatically

### Example Console Output

```
📞 STRATEGY 1: Attempting to create FREE Vapi phone number...
⚠️ Could not create FREE Vapi number: limit reached

╔═══════════════════════════════════════════════════════════╗
║  🎯 FREE VAPI NUMBER LIMIT REACHED (10/10 used)          ║
╚═══════════════════════════════════════════════════════════╝

✅ Congrats! You have 10+ customers - time to scale!
📈 Falling back to Twilio for additional phone numbers...

📞 STRATEGY 3: Using GLOBAL Twilio fallback...
✅ Global Twilio number imported: +15551234567
```

---

## 🏢 Stage 3: Multi-Organization Twilio (50+ Customers)

### When to Use Multi-Org

- **50+ customers** across multiple organizations
- **White-label** solutions for resellers
- **Dedicated numbers** per organization/tenant

### Architecture

Instead of one global Twilio account, each organization gets their own:

```
Organization A → Twilio Account A → Numbers pool A
Organization B → Twilio Account B → Numbers pool B
Organization C → Twilio Account C → Numbers pool C
```

### Database Setup

Add Twilio credentials to the `organizations` table:

```sql
UPDATE organizations
SET
  phone_provider = 'twilio',
  twilio_account_sid = 'ACxxxxxxx',
  twilio_auth_token = 'your_token',
  twilio_phone_numbers = ARRAY['+15551234567', '+15559876543']
WHERE id = 'org-id-here';
```

### How It Works

1. System checks if organization has Twilio credentials
2. If yes, uses org-specific numbers (STRATEGY 2)
3. If no, falls back to global Twilio (STRATEGY 3)
4. Tracks which numbers are assigned to prevent conflicts

### Multi-Tenant Benefits

✅ **Isolated phone numbers** per organization
✅ **Custom area codes** per market/region
✅ **Billing separation** (charge org for their numbers)
✅ **Scalable** to unlimited organizations

---

## 📊 Cost Analysis

### Cost Breakdown by Stage

| Stage | Customers | Monthly Cost | Cost per Customer |
|-------|-----------|--------------|-------------------|
| **FREE Vapi** | 10 | $0 | $0 |
| **Twilio (Single)** | 50 | $60 | $1.20 |
| **Twilio (Multi-Org)** | 500 | $600 | $1.20 |

### ROI Example

If you charge $50/month per customer:

- **10 customers:** $500/mo revenue, $0 phone costs = **100% margin**
- **50 customers:** $2,500/mo revenue, $60 phone costs = **97.6% margin**
- **500 customers:** $25,000/mo revenue, $600 phone costs = **97.6% margin**

**Phone numbers are only 2-3% of revenue** - incredibly cost-effective!

---

## 🔧 Troubleshooting

### Issue: "this.vapiClient.phoneNumbers.create is not a function"

✅ **FIXED** in latest version. The `phoneNumbers.create()` method now properly delegates to the Direct API client.

### Issue: All numbers show "Vapi-SIP" instead of actual numbers

This is normal! Vapi free numbers are SIP URIs, not traditional phone numbers.

- **For inbound calls:** Customers call the SIP URI
- **For outbound calls:** Works seamlessly
- **For display:** Shows "Vapi-SIP" in database

If you need actual phone numbers (e.g., for marketing), use Twilio.

### Issue: "FREE VAPI NUMBER LIMIT REACHED"

**Solution 1:** Check Vapi Dashboard for unused numbers

1. Visit: [dashboard.vapi.ai/phone-numbers](https://dashboard.vapi.ai/phone-numbers)
2. Delete unused numbers
3. Try creating assistant again

**Solution 2:** Set up Twilio (recommended for scale)

Follow the **Stage 2: Twilio Integration** instructions above.

### Issue: Twilio number already imported error

This means the number is already registered in Vapi. Options:

1. **Use a different Twilio number**
2. **Unassign** the number from its current assistant in Vapi Dashboard
3. **Delete** the number from Vapi and re-import

---

## 🚀 Best Practices

### For MVPs (0-10 customers)

✅ Use FREE Vapi numbers
✅ Monitor usage with built-in checks
✅ Plan for Twilio when approaching limit

### For Growth (10-50 customers)

✅ Set up Twilio early (don't wait for limit)
✅ Buy numbers in customer area codes
✅ Use global Twilio fallback for simplicity

### For Scale (50+ customers)

✅ Implement multi-organization Twilio
✅ Automate number purchasing via Twilio API
✅ Track number assignments in database
✅ Consider number pooling/recycling strategies

---

## 📞 API Reference

### Check Vapi Number Usage

```typescript
const vapiService = createServerVapiService()
const usage = await vapiService.checkVapiFreeNumberUsage()

console.log(usage)
// {
//   total: 7,
//   limit: 10,
//   remaining: 3,
//   percentUsed: 70
// }
```

### Manual Phone Provisioning

```typescript
const result = await vapiService.provisionAndAssignNumber({
  organizationId: 'org-123',
  assistantId: 'asst-456',
  country: 'US',
  areaCode: '415'
})

if (result) {
  console.log('Phone number:', result.phoneNumber)
  console.log('Phone ID:', result.phoneNumberId)
} else {
  console.log('Manual assignment required')
}
```

---

## 🎓 Learn More

- **Vapi Phone Documentation:** [docs.vapi.ai/phone-calling](https://docs.vapi.ai/phone-calling)
- **Vapi Free Numbers:** [docs.vapi.ai/free-telephony](https://docs.vapi.ai/free-telephony)
- **Twilio Phone Numbers:** [twilio.com/docs/phone-numbers](https://www.twilio.com/docs/phone-numbers)
- **Twilio Pricing:** [twilio.com/pricing](https://www.twilio.com/pricing)

---

## ✅ Summary

1. **0-10 customers:** FREE Vapi numbers (automatic, zero config)
2. **10+ customers:** Twilio integration (15 min setup, $1/mo per number)
3. **50+ customers:** Multi-org Twilio (advanced, unlimited scale)

The system handles all of this automatically once configured. Phone numbers will "just work" for your customers! 🎉
