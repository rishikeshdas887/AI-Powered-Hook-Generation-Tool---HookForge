import { Anthropic } from '@anthropic-ai/sdk';
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

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
    return null;
  }
  return new Anthropic({ apiKey });
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    return NextResponse.json(
      { error: 'AI service not configured. Please set the ANTHROPIC_API_KEY environment variable.' },
      { status: 503 }
    );
  }

  if (!validateBodySize(request, 10)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  const rateResult = rateLimit(request, 'generate-hooks');
  if (!rateResult.success) {
    return rateLimitError(rateResult.resetTime);
  }

  // Auth via Bearer token
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return unauthorizedError();
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return unauthorizedError();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return validationError('Invalid JSON body');
  }

  const { topic, platform, style, context } = body;

  if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
    return validationError('Topic is required and must be at least 5 characters');
  }

  if (!platform || !validatePlatform(platform)) {
    return validationError('Invalid platform selected');
  }

  if (!style || !validateStyle(style)) {
    return validationError('Invalid hook style selected');
  }

  const sanitizedTopic = sanitizeInput(topic, 500);
  const sanitizedContext = context ? sanitizeInput(context, 200) : '';

  // Get or create user profile
  let { data: profile } = await supabase
    .from('user_profiles')
    .select('generations_count')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .insert({ user_id: user.id })
      .select('generations_count')
      .single();
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
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  // Increment usage count
  await supabase
    .from('user_profiles')
    .update({
      generations_count: (profile?.generations_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && 'text' in event.delta) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
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
      ...Object.fromEntries(securityHeaders().entries()),
    },
  });
}
