import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createDirectVapiClient } from '@/lib/vapi/direct-vapi-client'
import { z } from 'zod' // For input validation

// Define schema for input validation
const DemoCallRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone_number: z.string().min(10, 'Valid phone number is required'),
  industry: z.string().optional(),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
})

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies }) // Not strictly needed for this endpoint, but good practice

  try {
    const body = await request.json()
    const validatedData = DemoCallRequestSchema.parse(body)

    const { name, phone_number, industry } = validatedData

    // 1. Implement Rate Limiting (Basic example: check last request from this phone number)
    // In a production app, this would be more robust (e.g., using Redis, IP-based limits)
    const { data: lastDemoRequest, error: lastRequestError } = await supabase
      .from('demo_requests')
      .select('requested_at')
      .eq('phone_number', phone_number)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single()

    if (lastRequestError && lastRequestError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking last demo request:', lastRequestError.message)
      // Allow to proceed as a fallback, or return error
    }

    if (lastDemoRequest) {
      const lastRequestTime = new Date(lastDemoRequest.requested_at).getTime()
      const oneDay = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      if (Date.now() - lastRequestTime < oneDay) {
        return NextResponse.json({ error: 'You can only request one demo call per day.' }, { status: 429 })
      }
    }

    // 2. Store the demo request in the database
    const { data: demoRequest, error: insertError } = await supabase
      .from('demo_requests')
      .insert({
        name,
        phone_number,
        industry,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !demoRequest) {
      console.error('Error storing demo request:', insertError?.message)
      return NextResponse.json({ error: 'Failed to store demo request.' }, { status: 500 })
    }

    // 3. Trigger Vapi outbound call
    const vapiClient = createDirectVapiClient()
    const demoAssistantId = process.env.VAPI_DEMO_ASSISTANT_ID // Ensure this is set in .env

    if (!demoAssistantId) {
      console.error('VAPI_DEMO_ASSISTANT_ID is not set.')
      return NextResponse.json({ error: 'Demo assistant not configured.' }, { status: 500 })
    }

    const outboundCall = await vapiClient.createOutboundCall({
      assistantId: demoAssistantId,
      phoneNumberId: process.env.VAPI_DEMO_PHONE_NUMBER_ID, // Or dynamically select an available number
      customer: {
        number: phone_number,
        name: name,
      },
      metadata: {
        demoRequestId: demoRequest.id,
        name: name,
        industry: industry,
      },
    })

    // 4. Update demo request with Vapi call ID and status
    const { error: updateError } = await supabase
      .from('demo_requests')
      .update({
        vapi_call_id: outboundCall.id,
        status: 'calling',
      })
      .eq('id', demoRequest.id)

    if (updateError) {
      console.error('Error updating demo request with Vapi call ID:', updateError.message)
      // Log but don't fail the user request
    }

    return NextResponse.json({ success: true, message: 'Demo call initiated successfully!' })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('Error processing demo call request:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
