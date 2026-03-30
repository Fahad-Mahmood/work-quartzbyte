import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, full_name, job_title, role, invited_by } = await req.json();

    if (!email || !full_name || !job_title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client uses service role key — safe here, never exposed to browser
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller is an admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: callerProfile } = await adminClient
      .from('work_profiles')
      .select('role')
      .eq('user_id', caller.id)
      .single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can invite members' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send the invite email — Supabase sends a "Set your password" link
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name, job_title, role: role ?? 'member' },
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/auth`,
      },
    );

    if (inviteError) {
      // If user already exists in auth, that's okay — still record the invitation
      if (!inviteError.message.includes('already been registered')) {
        throw inviteError;
      }
    }

    // Upsert into work_invitations
    const { error: dbError } = await adminClient.from('work_invitations').upsert(
      {
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        job_title,
        role: role ?? 'member',
        invited_by,
        status: 'pending',
      },
      { onConflict: 'email' },
    );
    if (dbError) throw dbError;

    // Pre-create the work_profile row so role is set before first login
    if (inviteData?.user) {
      await adminClient.from('work_profiles').upsert(
        {
          user_id: inviteData.user.id,
          full_name: full_name.trim(),
          job_title,
          role: role ?? 'member',
          email: email.trim().toLowerCase(),
        },
        { onConflict: 'user_id' },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
