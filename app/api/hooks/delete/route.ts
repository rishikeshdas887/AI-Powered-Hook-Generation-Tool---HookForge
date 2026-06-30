import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  securityHeaders,
  rateLimit,
  rateLimitError,
  unauthorizedError,
  validationError,
  validateBodySize,
} from '@/lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function DELETE(request: NextRequest) {
  // Validate body size
  if (!validateBodySize(request, 1)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  // Rate limiting
  const rateResult = rateLimit(request, 'hooks-delete');
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
  const hookId = searchParams.get('id');

  if (!hookId) {
    return validationError('Hook ID is required');
  }

  // Validate UUID format to prevent injection
  if (!isValidUUID(hookId)) {
    return validationError('Invalid hook ID format');
  }

  const { error } = await supabase
    .from('saved_hooks')
    .delete()
    .eq('id', hookId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting hook:', error);
    const headers = securityHeaders();
    return NextResponse.json(
      { error: 'Failed to delete hook' },
      { status: 500, headers }
    );
  }

  const headers = securityHeaders();
  headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());

  return NextResponse.json({ success: true }, { headers });
}
