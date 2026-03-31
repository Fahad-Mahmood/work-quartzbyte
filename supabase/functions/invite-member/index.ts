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

    // Admin client with service role — bypasses RLS
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the JWT and get the caller's user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: userError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check caller is admin
    const { data: callerProfile } = await adminClient
      .from('work_profiles')
      .select('role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can invite members' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // If a pending (unconfirmed) user already exists, delete them so re-invite sends a fresh email
    const { data: existingProfile } = await adminClient
      .from('work_profiles')
      .select('user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile?.user_id) {
      // Remove the stale profile row and auth user so inviteUserByEmail works fresh
      await adminClient.from('work_profiles').delete().eq('user_id', existingProfile.user_id);
      await adminClient.auth.admin.deleteUser(existingProfile.user_id);
    }

    // Send invite email — Supabase sends a "Set your password" link
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: { full_name, job_title, role: role ?? 'member' },
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://work.quartzbytee.com'}/auth`,
      },
    );

    if (inviteError) throw inviteError;

    // Upsert invitation record
    const { error: dbError } = await adminClient.from('work_invitations').upsert(
      {
        email: normalizedEmail,
        full_name: full_name.trim(),
        job_title,
        role: role ?? 'member',
        invited_by,
        status: 'pending',
      },
      { onConflict: 'email' },
    );
    if (dbError) throw dbError;

    // Pre-create the work_profile so role is set on first login
    if (inviteData?.user?.id) {
      await adminClient.from('work_profiles').upsert(
        {
          user_id: inviteData.user.id,
          full_name: full_name.trim(),
          job_title,
          role: role ?? 'member',
          email: normalizedEmail,
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
