import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'

// Initialize Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    // Only allow requests from Supabase (e.g., scheduled jobs)
    if (req.headers.get('x-supabase-event') !== 'scheduled') {
      return new Response('Not Found', { status: 404 })
    }

    console.log('Running demo follow-up processing...')

    // Fetch demo requests that need follow-up
    const { data: demoRequests, error: fetchError } = await supabaseAdmin
      .from('demo_requests')
      .select('*')
      .eq('follow_up_flag', false)
      .not('status', 'in', ['pending', 'calling']) // Only process completed, failed, no_answer calls
      .order('requested_at', { ascending: true })
      .limit(100) // Process in batches

    if (fetchError) {
      console.error('Error fetching demo requests for follow-up:', fetchError.message)
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
    }

    if (demoRequests.length === 0) {
      console.log('No demo requests found for follow-up.')
      return new Response(JSON.stringify({ message: 'No demo requests found for follow-up.' }), { status: 200 })
    }

    for (const demoRequest of demoRequests) {
      console.log(`Processing follow-up for demo request ${demoRequest.id} (Status: ${demoRequest.status}, Lead Score: ${demoRequest.lead_score})`)

      let followUpAction: string | null = null
      let conversionStatus: string = demoRequest.conversion_status

      // Implement follow-up logic based on status and lead score
      if (demoRequest.status === 'completed') {
        if (demoRequest.lead_score >= 70) { // High lead score
          followUpAction = 'send_signup_link_email'
          conversionStatus = 'nurturing' // Or 'signed_up' if we detect it
          // TODO: Send personalized email with signup link + promo
          console.log(`Action: Sending high lead score email to ${demoRequest.name}`)
        } else { // Medium/Low lead score
          followUpAction = 'send_nurture_email'
          conversionStatus = 'nurturing'
          // TODO: Add to nurture email sequence
          console.log(`Action: Sending nurture email to ${demoRequest.name}`)
        }
      } else if (demoRequest.status === 'no_answer') {
        followUpAction = 'send_missed_call_sms'
        // TODO: Send SMS with "missed call" message and link to reschedule
        console.log(`Action: Sending missed call SMS to ${demoRequest.phone_number}`)
      } else if (demoRequest.status === 'failed') {
        followUpAction = 'log_failure'
        console.log(`Action: Logging failed demo call for ${demoRequest.phone_number}`)
      }

      // Update follow_up_flag and conversion_status
      const { error: updateError } = await supabaseAdmin
        .from('demo_requests')
        .update({
          follow_up_flag: true,
          conversion_status: conversionStatus,
        })
        .eq('id', demoRequest.id)

      if (updateError) {
        console.error(`Error updating follow-up flag for demo request ${demoRequest.id}:`, updateError.message)
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${demoRequests.length} demo requests for follow-up.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error in process-demo-followups Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
