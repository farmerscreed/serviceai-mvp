# 📋 Manual Implementation Guide
## VAPI Tools Setup for ServiceAI

**For**: System Administrator / Technical Owner  
**Time Required**: 30-45 minutes  
**Prerequisites**: Access to VAPI dashboard, server environment variables  

---

## 🎯 What You'll Accomplish

By the end of this guide, you will have:
1. ✅ Created 4 reusable tools in your VAPI account
2. ✅ Configured tool IDs in your environment
3. ✅ Verified tools are working with a test call
4. ✅ Enabled appointment booking for ALL organizations

---

## ⚠️ Before You Start

### What You Need

1. **VAPI Account Access**
   - Login: https://dashboard.vapi.ai
   - You need admin access to create tools

2. **VAPI API Key**
   - Find it at: https://dashboard.vapi.ai/keys
   - Should already be in your `.env.local` as `VAPI_API_KEY`

3. **Server Access**
   - Ability to edit `.env.local` file
   - Ability to restart the application

4. **Your Webhook URL**
   - Production: Your live domain (e.g., `https://app.serviceai.com`)
   - Development: Your ngrok URL (e.g., `https://abc123.ngrok-free.app`)

### Important Notes

- ⏰ **DO NOT rush** - Each step is important
- 📝 **Copy tool IDs carefully** - One mistake will break everything
- 🔄 **Test after each major step** - Catch issues early
- 💾 **Backup your .env.local** - Before making changes

---

## 📍 OPTION A: Automated Setup (Recommended)

This is the easiest method. The script does everything for you.

### Step 1: Verify Prerequisites

Open your terminal and check these are set:

```bash
# Check VAPI API Key exists
grep VAPI_API_KEY .env.local

# Check webhook URL exists
grep NEXT_PUBLIC_APP_URL .env.local
# OR
grep VAPI_WEBHOOK_URL .env.local
```

**Expected Output**:
```
VAPI_API_KEY=sk_xxx...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**If missing**: Add them to `.env.local` first!

### Step 2: Run the Setup Script

After your developer implements the code changes:

```bash
npm run setup-vapi-tools
```

### Step 3: Review the Output

The script will create 4 tools and display output like this:

```
╔═══════════════════════════════════════════════════════════╗
║       VAPI TOOLS SETUP - Multi-Tenant ServiceAI          ║
╚═══════════════════════════════════════════════════════════╝

Webhook URL: https://your-domain.com/api/webhooks/vapi

📝 Creating tool: check_availability
✅ Created check_availability with ID: tool_abc123...

📝 Creating tool: book_appointment_with_sms
✅ Created book_appointment_with_sms with ID: tool_def456...

📝 Creating tool: check_emergency_multilingual
✅ Created check_emergency_multilingual with ID: tool_ghi789...

📝 Creating tool: send_sms_notification
✅ Created send_sms_notification with ID: tool_jkl012...

╔═══════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE                         ║
╚═══════════════════════════════════════════════════════════╝

✅ Successfully created 4/4 tools

📋 ADD THESE TO YOUR .env.local FILE:
═══════════════════════════════════════════════════════════

VAPI_CHECK_AVAILABILITY_TOOL_ID=tool_abc123...
VAPI_BOOK_APPOINTMENT_TOOL_ID=tool_def456...
VAPI_EMERGENCY_CHECK_TOOL_ID=tool_ghi789...
VAPI_SMS_NOTIFICATION_TOOL_ID=tool_jkl012...

═══════════════════════════════════════════════════════════
```

### Step 4: Copy Tool IDs to .env.local

**CAREFULLY** copy the 4 lines and add them to your `.env.local` file:

```bash
# Open .env.local in your editor
nano .env.local
# or
code .env.local
```

**Add these lines** (use YOUR tool IDs from the script output):

```bash
# Vapi Tool IDs
VAPI_CHECK_AVAILABILITY_TOOL_ID=tool_abc123xxx
VAPI_BOOK_APPOINTMENT_TOOL_ID=tool_def456xxx
VAPI_EMERGENCY_CHECK_TOOL_ID=tool_ghi789xxx
VAPI_SMS_NOTIFICATION_TOOL_ID=tool_jkl012xxx
```

**CRITICAL**: 
- Copy the ENTIRE tool ID including `tool_` prefix
- No spaces around the `=` sign
- No quotes around the IDs
- Save the file!

### Step 5: Restart Your Application

```bash
# Stop the current process (Ctrl+C)
# Then restart
npm run dev
```

**Watch for these logs** when starting:

```
🔧 Configured 4 tools for assistant
✅ All required tools are configured
```

**If you see warnings**:
```
⚠️ Some tools are missing. Expected 4, got 0
```
→ Check that you saved `.env.local` and restarted properly

### Step 6: Verify in VAPI Dashboard

1. Go to https://dashboard.vapi.ai/tools
2. You should see 4 tools:
   - ✅ check_availability
   - ✅ book_appointment_with_sms
   - ✅ check_emergency_multilingual
   - ✅ send_sms_notification

**Click on each tool** to verify:
- Server URL points to your webhook
- Parameters look correct
- Messages are configured

### Step 7: Test with New Assistant

Create a test assistant (use your normal process):

1. Go to your app's assistant creation page
2. Create an assistant for any test organization
3. Check the server logs during creation:

**Expected logs**:
```
🔧 Configured 4 tools for assistant
✅ Created multilingual assistant: asst_xxx with phone: +1xxx
```

**Bad logs**:
```
⚠️ VAPI_CHECK_AVAILABILITY_TOOL_ID not configured
❌ Tools are missing
```
→ Go back to Step 4 and verify .env.local

### Step 8: Make Test Call

**IMPORTANT**: This tests the COMPLETE flow

1. Call the phone number of your test assistant
2. Say: **"I want to book an appointment for tomorrow"**
3. AI should respond: **"Let me check what time slots are available..."**
4. AI should then say: **"I have openings at 9am, 2pm, and 4pm. Which works best?"**

**If AI says**: "I can help you with that. What service do you need?"
- ❌ Tools are NOT working
- Check logs for errors
- Verify tool IDs are correct

**If AI checks availability** ✅:
5. Say: **"2pm works for me"**
6. Provide your information when asked
7. AI should say: **"Booking your appointment now..."**
8. AI should confirm: **"Your appointment is confirmed for tomorrow at 2pm. You'll receive a text shortly."**

### Step 9: Verify Database

Check your database to confirm appointment was created:

```sql
SELECT 
  id,
  customer_name,
  scheduled_date,
  scheduled_time,
  appointment_type,
  status,
  created_at
FROM appointments 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**: A new appointment from your test call

### Step 10: Check SMS

Check your phone for SMS confirmation message.

**Expected**: Text message with appointment details

**If no SMS received**:
- Check Twilio configuration (separate issue)
- SMS failure won't block appointment creation
- Appointment should still be in database

---

## 📍 OPTION B: Manual Setup via VAPI Dashboard

If the script fails or you prefer manual creation:

### Step 1: Access VAPI Dashboard

1. Go to https://dashboard.vapi.ai
2. Login with your credentials
3. Click **"Tools"** in left sidebar
4. Click **"Create Tool"** button

### Step 2: Create Tool #1 - check_availability

**Basic Information**:
- Name: `check_availability`
- Type: `Function`
- Async: **OFF** (unchecked)

**Function Configuration**:
- Function Name: `check_availability`
- Description: 
  ```
  Check available appointment slots for a specific date and service type. ALWAYS call this BEFORE booking any appointment to ensure the time slot is available.
  ```

**Parameters** (Add each one):

1. **requested_date**
   - Type: `string`
   - Format: `date`
   - Required: ✅ YES
   - Description: `Date to check availability in YYYY-MM-DD format (e.g., 2025-10-15)`

2. **service_type**
   - Type: `string`
   - Enum values: `emergency`, `repair`, `maintenance`, `installation`
   - Required: ✅ YES
   - Description: `Type of service to check availability for`

**Server Configuration**:
- Server URL: `https://your-domain.com/api/webhooks/vapi`
  - ⚠️ Replace `your-domain.com` with your ACTUAL domain!
  - Development: Use your ngrok URL
  - Production: Use your live domain
- Timeout: `20` seconds

**Messages**:
- Request Start: `Let me check what time slots are available...`
- Request Complete: `I found some available times for you.`
- Request Failed: `I had trouble checking availability. Let me try that again.`
- Request Delayed: `This is taking a bit longer than expected. One moment please...`

**Click "Create"**

**COPY THE TOOL ID** that appears (e.g., `tool_abc123...`)

### Step 3: Create Tool #2 - book_appointment_with_sms

**Basic Information**:
- Name: `book_appointment_with_sms`
- Type: `Function`
- Async: **OFF** (unchecked)

**Function Configuration**:
- Function Name: `book_appointment_with_sms`
- Description:
  ```
  Books an appointment for a customer and sends SMS confirmation. ONLY call this AFTER checking availability with check_availability and confirming ALL details with the customer.
  ```

**Parameters** (Add each one):

1. **service_type**
   - Type: `string`
   - Enum: `emergency`, `repair`, `maintenance`, `installation`
   - Required: ✅ YES

2. **scheduled_start_time**
   - Type: `string`
   - Format: `date-time`
   - Required: ✅ YES
   - Description: `Appointment date and time in ISO 8601 format (e.g., 2025-10-15T16:00:00)`

3. **customer_name**
   - Type: `string`
   - Required: ✅ YES
   - Description: `Customer's full name`

4. **customer_phone**
   - Type: `string`
   - Required: ✅ YES
   - Description: `Customer's phone number in E.164 format (e.g., +14099952315)`

5. **customer_email**
   - Type: `string`
   - Format: `email`
   - Required: ❌ NO
   - Description: `Customer's email address (optional but recommended)`

6. **address**
   - Type: `string`
   - Required: ✅ YES
   - Description: `Complete service address where work will be performed`

7. **preferred_language**
   - Type: `string`
   - Enum: `en`, `es`
   - Default: `en`
   - Required: ❌ NO

8. **sms_preference**
   - Type: `boolean`
   - Default: `true`
   - Required: ❌ NO

9. **cultural_formality**
   - Type: `string`
   - Enum: `formal`, `informal`
   - Default: `formal`
   - Required: ❌ NO

**Server Configuration**:
- Server URL: `https://your-domain.com/api/webhooks/vapi`
- Timeout: `20` seconds

**Messages**:
- Request Start: `Booking your appointment now...`
- Request Complete: `Perfect! Your appointment has been confirmed.`
- Request Failed: `I apologize, I had trouble booking the appointment. Let me try again.`
- Request Delayed: `This is taking a bit longer than expected. Please hold on...`

**Click "Create"**

**COPY THE TOOL ID**

### Step 4: Create Tool #3 - check_emergency_multilingual

**Basic Information**:
- Name: `check_emergency_multilingual`
- Type: `Function`
- Async: **OFF**

**Function Configuration**:
- Function Name: `check_emergency_multilingual`
- Description:
  ```
  Analyze the urgency level of a customer issue across multiple languages. Use this to determine if immediate emergency response is needed.
  ```

**Parameters**:

1. **issue_description**
   - Type: `string`
   - Required: ✅ YES

2. **detected_language**
   - Type: `string`
   - Enum: `en`, `es`
   - Required: ✅ YES

3. **urgency_indicators**
   - Type: `array`
   - Items Type: `string`
   - Required: ❌ NO

4. **cultural_context**
   - Type: `string`
   - Required: ❌ NO

**Server Configuration**:
- Server URL: `https://your-domain.com/api/webhooks/vapi`
- Timeout: `20` seconds

**Messages**:
- Request Start: `Let me assess the urgency of your situation...`
- Request Complete: `I've evaluated your request.`
- Request Failed: `I had trouble processing that. Please describe your issue again.`

**Click "Create"**

**COPY THE TOOL ID**

### Step 5: Create Tool #4 - send_sms_notification

**Basic Information**:
- Name: `send_sms_notification`
- Type: `Function`
- Async: **OFF**

**Function Configuration**:
- Function Name: `send_sms_notification`
- Description:
  ```
  Send an SMS notification to a customer in their preferred language. Use for appointment reminders, updates, or important information.
  ```

**Parameters**:

1. **phone_number**
   - Type: `string`
   - Required: ✅ YES

2. **message_type**
   - Type: `string`
   - Enum: `appointment_confirmation`, `appointment_reminder`, `emergency_alert`, `general_notification`
   - Required: ✅ YES

3. **language**
   - Type: `string`
   - Enum: `en`, `es`
   - Required: ✅ YES

4. **urgency_level**
   - Type: `string`
   - Enum: `low`, `medium`, `high`, `emergency`
   - Default: `medium`
   - Required: ❌ NO

**Server Configuration**:
- Server URL: `https://your-domain.com/api/webhooks/vapi`
- Timeout: `15` seconds

**Messages**:
- Request Start: `Sending you a text message...`
- Request Complete: `I've sent you a text message.`
- Request Failed: `I had trouble sending the message. I'll make a note for follow-up.`

**Click "Create"**

**COPY THE TOOL ID**

### Step 6: Record All Tool IDs

You should now have 4 tool IDs. Write them down:

```
check_availability: tool_____________
book_appointment_with_sms: tool_____________
check_emergency_multilingual: tool_____________
send_sms_notification: tool_____________
```

### Step 7: Add to .env.local

Open your `.env.local` file and add:

```bash
# Vapi Tool IDs (Manual Creation)
VAPI_CHECK_AVAILABILITY_TOOL_ID=tool_xxx  # Replace with your IDs
VAPI_BOOK_APPOINTMENT_TOOL_ID=tool_xxx
VAPI_EMERGENCY_CHECK_TOOL_ID=tool_xxx
VAPI_SMS_NOTIFICATION_TOOL_ID=tool_xxx
```

### Step 8: Follow Steps 5-10 from Option A

Continue with the testing steps above to verify everything works.

---

## 🔍 Verification Checklist

Use this checklist to confirm everything is working:

### Configuration
- [ ] VAPI API key is in .env.local
- [ ] Webhook URL is correct (https, not http)
- [ ] All 4 tool IDs are in .env.local
- [ ] .env.local has been saved
- [ ] Application has been restarted

### VAPI Dashboard
- [ ] 4 tools visible at dashboard.vapi.ai/tools
- [ ] Each tool has correct server URL
- [ ] Each tool parameters match specification
- [ ] Each tool has messages configured

### Application Logs
- [ ] On startup: "Configured 4 tools for assistant"
- [ ] No warnings about missing tool IDs
- [ ] New assistants created successfully
- [ ] Assistants have phone numbers assigned

### Test Call
- [ ] Can call the assistant
- [ ] Assistant asks for appointment date
- [ ] Assistant calls check_availability tool
- [ ] Assistant presents available time slots
- [ ] Can complete booking process
- [ ] Assistant calls book_appointment_with_sms tool
- [ ] Receives booking confirmation

### Database
- [ ] Appointment appears in appointments table
- [ ] All fields are populated correctly
- [ ] Status is 'pending'
- [ ] Created timestamp is recent

### SMS
- [ ] SMS confirmation received (if Twilio configured)
- [ ] If no SMS, appointment still created
- [ ] SMS logs show send attempt

---

## 🚨 Troubleshooting

### Issue: "Tool not found" Error

**Symptoms**: Logs show `Unknown tool call: check_availability`

**Causes**:
1. Tool ID is wrong or missing in .env.local
2. Application not restarted after adding IDs
3. Tool was deleted from VAPI dashboard

**Solution**:
```bash
# 1. Check tool IDs in .env.local
cat .env.local | grep VAPI_.*_TOOL_ID

# 2. Verify they match VAPI dashboard
# Go to dashboard.vapi.ai/tools and compare IDs

# 3. If different, update .env.local with correct IDs

# 4. Restart application
# Ctrl+C then npm run dev

# 5. Check logs for "Configured 4 tools" message
```

### Issue: Assistant Not Checking Availability

**Symptoms**: Assistant books directly without checking slots

**Causes**:
1. Tool ID not configured
2. System prompt missing guidance
3. Tool not assigned to assistant

**Solution**:
1. Verify tool ID exists: `echo $VAPI_CHECK_AVAILABILITY_TOOL_ID`
2. Check assistant creation logs for tool configuration
3. Verify developer added prompt guidance (see dev guide)
4. Create new assistant and test again

### Issue: "No result returned" in VAPI Dashboard

**Symptoms**: VAPI shows tool was called but response is empty

**Causes**:
1. Webhook not receiving requests
2. Webhook returning wrong format
3. Network/firewall blocking requests

**Solution**:
```bash
# 1. Check webhook is accessible
curl https://your-domain.com/api/webhooks/vapi

# 2. Check server logs for incoming requests
# Should see: "Received webhook for call: call_xxx"

# 3. Check firewall allows VAPI IPs
# Whitelist: vapi.ai IP ranges if needed

# 4. Verify webhook response format in logs
# Should see: "✅ Tool call check_availability: success"
```

### Issue: Wrong Webhook URL

**Symptoms**: Tools created but not receiving calls

**Causes**:
- Used localhost instead of public URL
- Used HTTP instead of HTTPS
- ngrok URL expired

**Solution**:
1. For development:
   ```bash
   # Get new ngrok URL
   ngrok http 3000
   
   # Copy the HTTPS URL
   # e.g., https://abc123.ngrok-free.app
   ```

2. Update tools in VAPI dashboard:
   - Go to each tool
   - Click "Edit"
   - Update Server URL
   - Save

3. Restart application

### Issue: Script Fails to Create Tools

**Symptoms**: Setup script errors out

**Common Errors**:

**"401 Unauthorized"**
→ VAPI API key is invalid or missing
→ Check: `echo $VAPI_API_KEY`
→ Get new key from dashboard.vapi.ai/keys

**"400 Bad Request"**
→ Tool configuration has errors
→ Check webhook URL is valid HTTPS
→ Review script output for details

**"Network Error"**
→ No internet connection
→ Check: `ping api.vapi.ai`

### Issue: Database Appointment Not Created

**Symptoms**: Call succeeds but no appointment in DB

**Causes**:
1. Database permissions issue
2. Organization ID not found
3. Validation error in appointment data

**Solution**:
```bash
# Check server logs for database errors
# Look for: "❌ Database error creating appointment"

# Check organization exists
# In your database:
SELECT id, organization_name FROM organizations WHERE id = 'org-id';

# Check for validation errors
# Look for: "Missing required fields"

# Verify appointment_type, scheduled_date, scheduled_time are valid
```

---

## 📞 Support Contacts

If you're stuck after trying troubleshooting:

1. **Check Documentation**
   - `docs/VAPI_TOOLS_SETUP.md` (created by developer)
   - This guide

2. **Review Logs**
   - Server logs show most issues
   - VAPI dashboard shows tool call history

3. **Ask Developer**
   - Provide error messages
   - Share relevant log excerpts
   - Mention which step failed

---

## ✅ Success Confirmation

You've successfully completed setup when:

1. ✅ All 4 tools visible in VAPI dashboard
2. ✅ All 4 tool IDs in .env.local
3. ✅ Application starts without tool warnings
4. ✅ New assistants reference tools in logs
5. ✅ Test call checks availability before booking
6. ✅ Test appointment created in database
7. ✅ SMS confirmation sent (if Twilio configured)

---

## 🎉 Next Steps

After successful setup:

1. **Create Production Assistants**
   - Use your normal process
   - Tools will work automatically
   - Each organization gets same capabilities

2. **Monitor Performance**
   - Check tool call success rates
   - Review booking completion rates
   - Monitor SMS delivery

3. **Train Staff** (if applicable)
   - Show them how appointments work
   - Explain the two-step process
   - Demonstrate emergency detection

4. **Optimize**
   - Adjust business hours as needed
   - Customize messages per business type
   - Add more service types if required

---

## 📝 Maintenance

### Regular Tasks

**Weekly**:
- Review tool call logs for errors
- Check appointment booking success rate

**Monthly**:
- Verify tool configurations still correct
- Update tool messages if needed
- Review and optimize business hours

**As Needed**:
- Update webhook URL if domain changes
- Recreate tools if VAPI account changes
- Adjust timeouts if response times increase

### Backup Procedures

**Before Major Changes**:
```bash
# Backup .env.local
cp .env.local .env.local.backup

# Document current tool IDs
cat .env.local | grep VAPI_.*_TOOL_ID > tool-ids-backup.txt
```

### Recovery Procedures

**If Tools Are Deleted**:
1. Run setup script again: `npm run setup-vapi-tools`
2. Update .env.local with new IDs
3. Restart application
4. Test with a call

**If .env.local Is Lost**:
1. Go to dashboard.vapi.ai/tools
2. Copy each tool ID manually
3. Recreate .env.local entries
4. Restart application

---

## 📊 Monitoring Dashboard

Track these metrics to ensure tools are working:

### Key Metrics
- **Tool Call Success Rate**: Should be >95%
- **Availability Check Rate**: Should be 100% before bookings
- **Booking Success Rate**: Should be >90%
- **Average Response Time**: Should be <5 seconds

### Where to Find Data
- VAPI Dashboard: Call logs and tool call history
- Your Database: Appointment creation logs
- Application Logs: Tool call success/failure

---

## 🎓 Understanding the System

### How It Works

1. **Customer Calls** → Assistant answers
2. **Request Detected** → AI recognizes appointment request
3. **Check Availability** → AI calls `check_availability` tool
4. **Your Webhook** → Receives request, queries database
5. **Return Slots** → Sends available times back to AI
6. **Present Options** → AI tells customer available times
7. **Customer Selects** → Customer chooses a time
8. **Collect Info** → AI gathers all required details
9. **Confirm Details** → AI repeats everything back
10. **Book Appointment** → AI calls `book_appointment_with_sms`
11. **Your Webhook** → Creates appointment in database
12. **Send SMS** → Confirmation sent to customer
13. **Confirm to Customer** → AI tells customer it's done

### Why This Matters

- **No Double-Bookings**: Availability check prevents conflicts
- **Better Experience**: Customer sees real available times
- **Automatic SMS**: Reduces no-shows
- **Multi-Tenant**: Works for all your organizations
- **Reusable**: One tool setup serves everyone

---

**That's it! You're all set up. 🎉**

Questions? Check the troubleshooting section or ask your developer.