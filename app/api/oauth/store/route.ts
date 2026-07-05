import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityHeaders, unauthorizedError } from '@/lib/security';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key!);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return unauthorizedError();

  // Verify the user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return unauthorizedError();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { provider_token, provider_refresh_token, provider = 'google' } = body;

  if (!provider_token) {
    return NextResponse.json({ error: 'No provider token provided' }, { status: 400 });
  }

  // Upsert the OAuth token
  const { error } = await supabaseAdmin
    .from('user_oauth_tokens')
    .upsert({
      user_id: user.id,
      provider,
      provider_token,
      provider_refresh_token: provider_refresh_token || null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Failed to store OAuth token:', error);
    return NextResponse.json(
      { error: 'Failed to store OAuth token' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { headers: securityHeaders() });
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return unauthorizedError();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return unauthorizedError();

  const { data, error } = await supabaseAdmin
    .from('user_oauth_tokens')
    .select('provider, scopes, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch OAuth token status:', error);
    return NextResponse.json({ hasToken: false, provider: null });
  }

  if (!data) {
    return NextResponse.json({ hasToken: false, provider: null });
  }

  return NextResponse.json({
    hasToken: true,
    provider: data.provider,
    scopes: data.scopes || [],
    createdAt: data.created_at,
  }, { headers: securityHeaders() });
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return unauthorizedError();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return unauthorizedError();

  await supabaseAdmin
    .from('user_oauth_tokens')
    .delete()
    .eq('user_id', user.id);

  return NextResponse.json({ success: true }, { headers: securityHeaders() });
}
