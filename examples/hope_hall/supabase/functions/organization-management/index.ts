// supabase/functions/organization-management/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is system admin (implement your admin check logic)
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'system_admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const body = method !== 'GET' ? await req.json() : null

    switch (method) {
      case 'POST':
        // Create new organization
        const { data: newOrg, error: createError } = await supabaseClient
          .from('organizations')
          .insert([{
            name: body.name,
            email: body.email,
            phone: body.phone,
            address: body.address,
            status: 'active'
          }])
          .select()
          .single()

        if (createError) throw createError

        // Create default branding
        await supabaseClient
          .from('organization_branding')
          .insert([{ organization_id: newOrg.id }])

        return new Response(
          JSON.stringify({ organization: newOrg }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'GET':
        // List organizations
        const { data: orgs, error: listError } = await supabaseClient
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false })

        if (listError) throw listError

        return new Response(
          JSON.stringify({ organizations: orgs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Organization management error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


