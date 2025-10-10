import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'

// Initialize Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Email service configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@serviceai.com'
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://app.serviceai.com'

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

function createUsageWarningEmail(orgName: string, usagePercentage: number, remainingMinutes: number): EmailTemplate {
  const subject = `⚠️ ServiceAI Usage Alert: ${usagePercentage.toFixed(0)}% of minutes used`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ServiceAI Usage Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ServiceAI Usage Alert</h1>
        </div>
        
        <p>Hello ${orgName},</p>
        
        <div class="alert">
          <h3>⚠️ High Usage Alert</h3>
          <p>You have used <strong>${usagePercentage.toFixed(0)}%</strong> of your allocated call minutes for this billing cycle.</p>
          <p><strong>Remaining minutes:</strong> ${remainingMinutes}</p>
        </div>
        
        <p>To avoid service interruption, we recommend:</p>
        <ul>
          <li>Monitoring your usage more closely</li>
          <li>Purchasing additional minutes if needed</li>
          <li>Reviewing your current plan</li>
        </ul>
        
        <p>
          <a href="${APP_URL}/billing" class="button">Manage Your Usage</a>
        </p>
        
        <div class="footer">
          <p>This is an automated message from ServiceAI. If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
ServiceAI Usage Alert

Hello ${orgName},

You have used ${usagePercentage.toFixed(0)}% of your allocated call minutes for this billing cycle.
Remaining minutes: ${remainingMinutes}

To avoid service interruption, we recommend:
- Monitoring your usage more closely
- Purchasing additional minutes if needed
- Reviewing your current plan

Manage your usage: ${APP_URL}/billing

This is an automated message from ServiceAI.
  `
  
  return { subject, html, text }
}

function createUsageExhaustedEmail(orgName: string): EmailTemplate {
  const subject = `🚫 ServiceAI: Call minutes exhausted - Service suspended`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ServiceAI Service Suspended</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ServiceAI Service Suspended</h1>
        </div>
        
        <p>Hello ${orgName},</p>
        
        <div class="alert">
          <h3>🚫 Service Suspended</h3>
          <p>You have exhausted all your allocated call minutes for this billing cycle.</p>
          <p><strong>Your service has been temporarily suspended to prevent unexpected charges.</strong></p>
        </div>
        
        <p>To restore service immediately:</p>
        <ul>
          <li>Purchase additional minutes</li>
          <li>Upgrade to a higher plan</li>
          <li>Wait for your next billing cycle</li>
        </ul>
        
        <p>
          <a href="${APP_URL}/billing" class="button">Purchase Minutes Now</a>
        </p>
        
        <div class="footer">
          <p>This is an automated message from ServiceAI. If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
ServiceAI Service Suspended

Hello ${orgName},

You have exhausted all your allocated call minutes for this billing cycle.
Your service has been temporarily suspended to prevent unexpected charges.

To restore service immediately:
- Purchase additional minutes
- Upgrade to a higher plan
- Wait for your next billing cycle

Purchase minutes: ${APP_URL}/billing

This is an automated message from ServiceAI.
  `
  
  return { subject, html, text }
}

async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send email:', error)
      return false
    }

    const result = await response.json()
    console.log(`✅ Email sent successfully to ${to}:`, result.id)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

serve(async (req) => {
  try {
    // Only allow requests from Supabase (e.g., scheduled jobs)
    if (req.headers.get('x-supabase-event') !== 'scheduled') {
      return new Response('Not Found', { status: 404 })
    }

    console.log('Running daily usage check for notifications...')

    // Fetch organizations with active subscriptions
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        email,
        minutes_used_this_cycle,
        credit_minutes,
        subscription_plans (
          included_minutes
        )
      `)
      .eq('subscription_status', 'active')
      .not('email', 'is', null) // Only notify organizations with an email

    if (orgError) {
      console.error('Error fetching organizations:', orgError.message)
      return new Response(JSON.stringify({ error: orgError.message }), { status: 500 })
    }

    let emailsSent = 0
    let emailsFailed = 0

    for (const org of organizations) {
      const includedMinutes = org.subscription_plans?.included_minutes || 0
      const minutesUsed = org.minutes_used_this_cycle || 0
      const creditMinutes = org.credit_minutes || 0
      const totalAllocated = includedMinutes + creditMinutes

      if (totalAllocated > 0) {
        const usagePercentage = (minutesUsed / totalAllocated) * 100
        const remainingMinutes = totalAllocated - minutesUsed

        // Notify at 80% usage threshold
        if (usagePercentage >= 80 && usagePercentage < 100) {
          console.log(`⚠️ Organization ${org.name} (${org.id}) is at ${usagePercentage.toFixed(2)}% usage. Sending notification.`)
          
          const emailTemplate = createUsageWarningEmail(org.name, usagePercentage, remainingMinutes)
          const emailSent = await sendEmail(org.email, emailTemplate)
          
          if (emailSent) {
            emailsSent++
            console.log(`✅ Usage warning email sent to ${org.email}`)
          } else {
            emailsFailed++
            console.error(`❌ Failed to send usage warning email to ${org.email}`)
          }
        } else if (usagePercentage >= 100) {
          console.log(`🚫 Organization ${org.name} (${org.id}) has exhausted its minutes.`)
          
          const emailTemplate = createUsageExhaustedEmail(org.name)
          const emailSent = await sendEmail(org.email, emailTemplate)
          
          if (emailSent) {
            emailsSent++
            console.log(`✅ Usage exhausted email sent to ${org.email}`)
          } else {
            emailsFailed++
            console.error(`❌ Failed to send usage exhausted email to ${org.email}`)
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Usage check completed',
      emailsSent,
      emailsFailed,
      organizationsChecked: organizations.length
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in usage check Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
