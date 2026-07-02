import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const platformGuides: Record<string, string> = {
  tiktok: 'TikTok: Short, punchy, attention-grabbing. Must hook within the first 2 seconds. Use patterns like "Nobody talks about...", "The reason why...", "Stop doing this..."',
  instagram: 'Instagram Reels: Visual-first, trendy, relatable. Patterns like "POV:", "Things that just make sense...", "The grass is greener where you water it..."',
  youtube: 'YouTube Shorts: Value-driven, educational hooks. Patterns like "Here\'s how I...", "The secret to...", "3 things I wish I knew..."',
  twitter: 'Twitter/X: Controversial, thread-worthy, provocative. Patterns like "Unpopular opinion:", "Hot take:", "Let me explain..."',
  linkedin: 'LinkedIn: Professional, career-focused, thought leadership. Patterns like "After 10 years in...", "The best advice I ever received...", "Here\'s what top performers do differently..."',
};

const styleGuides: Record<string, string> = {
  curiosity: 'Curiosity Gap: Create an information gap that makes viewers NEED to know more. Never reveal the answer in the hook.',
  controversy: 'Controversial Take: Make a bold, slightly provocative statement that challenges common beliefs.',
  storytelling: 'Storytelling: Start a compelling narrative that pulls viewers in. Use "I", personal anecdotes, or scenarios.',
  data: 'Data-Driven: Lead with impressive numbers, statistics, or research-backed claims.',
  problem: 'Problem-Solution: Identify a painful problem the audience faces, hint at a solution.',
  transformation: 'Transformation: Show the gap between current state and desired state. Before/after, normal to extraordinary.',
};

export async function POST(request: NextRequest) {
  // Validate body size (max 10KB)
  if (!validateBodySize(request, 10)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  // Rate limiting
  const rateResult = rateLimit(request, 'generate-hooks');
  if (!rateResult.success) {
    return rateLimitError(rateResult.resetTime);
  }

  // Check authentication
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return unauthorizedError();
  }

  // Parse body with error handling
  let body;
  try {
    body = await request.json();
  } catch {
    return validationError('Invalid JSON body');
  }

  const { topic, platform, style, context } = body;

  // Validate required fields
  if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
    return validationError('Topic is required and must be at least 5 characters');
  }

  if (!platform || !validatePlatform(platform)) {
    return validationError('Invalid platform selected');
  }

  if (!style || !validateStyle(style)) {
    return validationError('Invalid hook style selected');
  }

  // Sanitize inputs
  const sanitizedTopic = sanitizeInput(topic, 500);
  const sanitizedContext = context ? sanitizeInput(context, 200) : '';

  // Get or create user profile
  let { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('generations_count')
    .eq('user_id', session.user.id)
    .single();

  if (profileError || !profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({ user_id: session.user.id })
      .select('generations_count')
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

  const systemPrompt = `You are an expert viral content strategist. Your job is to write attention-grabbing hooks for social media content.

Platform context: ${platformGuides[platform]}
Hook style: ${styleGuides[style]}

Rules:
1. Generate 5 unique hooks
2. Each hook must be 1-2 sentences maximum
3. Each hook should be different from the others, exploring different angles
4. Avoid clichés and overused phrases
5. Make each hook specific and actionable when possible
6. Format each hook on a new line, numbered 1-5
7. Do not include any explanation or additional text, ONLY the 5 hooks`;

  const userPrompt = `Create 5 viral hooks for the following content topic:

Topic: ${sanitizedTopic}
${sanitizedContext ? `Additional context: ${sanitizedContext}` : ''}

Generate 5 unique hooks in the style requested, one per line, numbered 1-5.`;

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  const encoder = new TextEncoder();

  // Increment usage count after successful generation
  await supabase
    .from('user_profiles')
    .update({
      generations_count: profile.generations_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', session.user.id);

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            'text' in event.delta
          ) {
            const text = event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-RateLimit-Remaining': rateResult.remaining.toString(),
      ...Object.fromEntries(securityHeaders().entries()),
    },
  });
}
