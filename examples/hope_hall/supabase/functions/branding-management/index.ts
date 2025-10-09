/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization header',
          message: 'Please provide a valid authorization token'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract the token from the authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authorization token',
          message: 'Please provide a valid authorization token'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle different HTTP methods
    if (req.method === 'POST') {
      // GET branding data
      const { organizationId } = await req.json();
      
      if (!organizationId) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing organization ID',
            message: 'Please provide an organization ID'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get organization data including settings
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          email,
          phone,
          address,
          settings
        `)
        .eq('id', organizationId)
        .single();

      if (orgError) {
        console.error('Error fetching organization data:', orgError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch organization data',
            message: 'Unable to retrieve organization information'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!organization) {
        return new Response(
          JSON.stringify({ 
            error: 'Organization not found',
            message: 'The specified organization was not found'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Extract branding data from settings
      const settings = organization.settings || {};
      const branding = settings.branding || {};
      
      // Return the branding data
      return new Response(
        JSON.stringify({
          success: true,
          branding: {
            organization_id: organization.id,
            organization_name: organization.name,
            logo_url: branding.logo_url || null,
            primary_color: branding.primary_color || '#1e40af',
            secondary_color: branding.secondary_color || '#f59e0b',
            accent_color: branding.accent_color || '#dc2626',
            custom_domain: branding.custom_domain || null,
            custom_domain_verified: branding.custom_domain_verified || false,
            email_template_settings: branding.email_template_settings || {
              header_color: branding.primary_color || '#1e40af',
              footer_color: branding.secondary_color || '#f59e0b',
              button_color: branding.accent_color || '#dc2626',
              font_family: 'Inter, sans-serif'
            },
            email_signature: branding.email_signature || '',
            social_media_links: branding.social_media_links || {
              facebook: '',
              instagram: '',
              twitter: '',
              website: ''
            },
            custom_css: branding.custom_css || '',
            favicon_url: branding.favicon_url || null
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (req.method === 'PUT') {
      // UPDATE branding data
      const { organizationId, ...brandingData } = await req.json();
      
      if (!organizationId) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing organization ID',
            message: 'Please provide an organization ID'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get current organization settings
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        console.error('Error fetching organization settings:', orgError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch organization settings',
            message: 'Unable to retrieve current settings'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!organization) {
        return new Response(
          JSON.stringify({ 
            error: 'Organization not found',
            message: 'The specified organization was not found'
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update settings with new branding data
      const currentSettings = organization.settings || {};
      const updatedSettings = {
        ...currentSettings,
        branding: {
          ...currentSettings.branding,
          ...brandingData
        }
      };

      // Update the organization settings
      const { data: updatedOrg, error: updateError } = await supabase
        .from('organizations')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .select('settings')
        .single();

      if (updateError) {
        console.error('Error updating organization settings:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update branding settings',
            message: 'Unable to save branding changes'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Return the updated branding data
      const updatedBranding = updatedOrg.settings?.branding || {};
      return new Response(
        JSON.stringify({
          success: true,
          branding: {
            organization_id: organizationId,
            logo_url: updatedBranding.logo_url || null,
            primary_color: updatedBranding.primary_color || '#1e40af',
            secondary_color: updatedBranding.secondary_color || '#f59e0b',
            accent_color: updatedBranding.accent_color || '#dc2626',
            custom_domain: updatedBranding.custom_domain || null,
            custom_domain_verified: updatedBranding.custom_domain_verified || false,
            email_template_settings: updatedBranding.email_template_settings || {
              header_color: updatedBranding.primary_color || '#1e40af',
              footer_color: updatedBranding.secondary_color || '#f59e0b',
              button_color: updatedBranding.accent_color || '#dc2626',
              font_family: 'Inter, sans-serif'
            },
            email_signature: updatedBranding.email_signature || '',
            social_media_links: updatedBranding.social_media_links || {
              facebook: '',
              instagram: '',
              twitter: '',
              website: ''
            },
            custom_css: updatedBranding.custom_css || '',
            favicon_url: updatedBranding.favicon_url || null
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
          message: 'Please use POST (GET) or PUT (UPDATE) methods'
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Branding management function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 