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
  // Validate body size
  if (!validateBodySize(request, 1)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  // Rate limiting
  const rateResult = rateLimit(request, 'default');
  if (!rateResult.success) {
    return rateLimitError(rateResult.resetTime);
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return unauthorizedError();
  }

  // Verify the user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return unauthorizedError();
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');

  // Validate and sanitize limit parameter
  let limit = 50;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      limit = 50;
    } else {
      limit = parsedLimit;
    }
  }

  const { data, error } = await supabase
    .from('saved_hooks')
    .select('id, hook_text, topic, platform, style, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching hooks:', error);
    const headers = securityHeaders();
    return NextResponse.json(
      { error: 'Failed to fetch hooks' },
      { status: 500, headers }
    );
  }

  const headers = securityHeaders();
  headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());

  return NextResponse.json({ hooks: data }, { headers });
}
