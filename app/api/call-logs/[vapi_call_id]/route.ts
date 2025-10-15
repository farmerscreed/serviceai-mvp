import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface GetContext {
  params: {
    vapi_call_id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: GetContext
) {
  const { vapi_call_id } = context.params;
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!vapi_call_id) {
      return NextResponse.json({ error: 'vapi_call_id is required' }, { status: 400 });
    }

    // Fetch the user's current organization from their profile or a session management system
    // For simplicity, we'll assume the user's current organization ID is available
    // In a real app, you'd get this from a context or a user_metadata table
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.current_organization_id) {
      return NextResponse.json({ error: 'User not associated with an organization' }, { status: 403 });
    }

    const organizationId = userProfile.current_organization_id;

    const { data: callLog, error } = await supabase
      .from('call_logs')
      .select('id, summary, duration_seconds, transcript, created_at')
      .eq('vapi_call_id', vapi_call_id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching call log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, callLog });
  } catch (error: any) {
    console.error('API error fetching call log:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
