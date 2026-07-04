import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityHeaders, rateLimit, rateLimitError, unauthorizedError, sanitizeInput } from '@/lib/security';

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') return null;
  return new Anthropic({ apiKey });
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const rateResult = rateLimit(request, 'search-topics');
  if (!rateResult.success) return rateLimitError(rateResult.resetTime);

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return unauthorizedError();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return unauthorizedError();

  const anthropic = getAnthropicClient();
  if (!anthropic) {
    // Return empty topics if API not configured — UI will still show trending section
    return NextResponse.json({ topics: [] }, { headers: securityHeaders() });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { query, platform } = body;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 });
  }

  const sanitizedQuery = sanitizeInput(query, 200);
  const platformContext = platform && platform !== 'all' ? `for ${platform}` : 'for social media';

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate 6 specific, trending content topic ideas ${platformContext} related to: "${sanitizedQuery}".

Return ONLY a JSON array of objects, no other text:
[
  {"topic": "topic description here", "category": "category name"},
  ...
]

Categories can be: business, lifestyle, health, tech, finance, creativity, relationships, productivity

Make topics specific, viral-worthy, and currently trending. Each topic should be 10-30 words describing complete content.`,
      }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Invalid response');

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found');

    const topics = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ topics }, { headers: securityHeaders() });
  } catch {
    return NextResponse.json(
      { topics: [{ topic: sanitizedQuery, category: 'general' }] },
      { headers: securityHeaders() }
    );
  }
}
