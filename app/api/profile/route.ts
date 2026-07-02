import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, rateLimit, rateLimitError, unauthorizedError, validateBodySize } from '@/lib/security';

export async function GET(request: NextRequest) {
  // Validate body size (should be empty for GET, but check anyway)
  if (!validateBodySize(request, 1)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  // Rate limiting
  const rateResult = rateLimit(request, 'default');
  if (!rateResult.success) {
    return rateLimitError(rateResult.resetTime);
  }

  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return unauthorizedError();
  }

  // Get or create user profile
  let { data: profile, error } = await supabase
    .from('user_profiles')
    .select('generations_count, created_at')
    .eq('user_id', session.user.id)
    .single();

  // If profile doesn't exist, create it
  if (error || !profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({ user_id: session.user.id })
      .select('generations_count, created_at')
      .single();

    if (createError) {
      const headers = securityHeaders();
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500, headers }
      );
    }
    profile = newProfile;
  }

  const headers = securityHeaders();
  headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());

  return NextResponse.json({
    profile: {
      generations_used: profile.generations_count,
      created_at: profile.created_at,
    },
  }, { headers });
}
