import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  securityHeaders,
  rateLimit,
  rateLimitError,
  unauthorizedError,
  validationError,
  sanitizeInput,
  validatePlatform,
  validateStyle,
  validateBodySize,
} from '@/lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  // Validate body size
  if (!validateBodySize(request, 5)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  // Rate limiting
  const rateResult = rateLimit(request, 'hooks-save');
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

  // Parse body with error handling
  let body;
  try {
    body = await request.json();
  } catch {
    return validationError('Invalid JSON body');
  }

  const { hookText, topic, platform, style } = body;

  // Validate required fields
  if (!hookText || typeof hookText !== 'string' || hookText.trim().length < 5) {
    return validationError('Hook text is required and must be at least 5 characters');
  }

  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    return validationError('Topic is required');
  }

  if (!platform || !validatePlatform(platform)) {
    return validationError('Invalid platform');
  }

  if (!style || !validateStyle(style)) {
    return validationError('Invalid hook style');
  }

  // Sanitize inputs
  const sanitizedHookText = sanitizeInput(hookText, 500);
  const sanitizedTopic = sanitizeInput(topic, 500);

  const { data, error } = await supabase
    .from('saved_hooks')
    .insert({
      user_id: user.id,
      hook_text: sanitizedHookText,
      topic: sanitizedTopic,
      platform,
      style,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving hook:', error);
    const headers = securityHeaders();
    return NextResponse.json(
      { error: 'Failed to save hook' },
      { status: 500, headers }
    );
  }

  const headers = securityHeaders();
  headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());

  return NextResponse.json({ hook: data }, { headers });
}
