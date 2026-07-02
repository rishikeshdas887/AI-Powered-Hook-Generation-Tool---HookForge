import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  securityHeaders,
  rateLimit,
  rateLimitError,
  unauthorizedError,
  validateBodySize,
} from '@/lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  if (!validateBodySize(request, 1)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  const rateResult = rateLimit(request, 'default');
  if (!rateResult.success) {
    return rateLimitError(rateResult.resetTime);
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return unauthorizedError();
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return unauthorizedError();
  }

  // Get or create user profile
  let { data: profile, error } = await supabase
    .from('user_profiles')
    .select('generations_count, created_at')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({ user_id: user.id })
      .select('generations_count, created_at')
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500, headers: securityHeaders() }
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
