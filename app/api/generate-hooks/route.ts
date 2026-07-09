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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type AIProvider = 'anthropic' | 'openai' | 'gemini';

const getAvailableProvider = (): { provider: AIProvider } | null => {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey !== 'your-anthropic-api-key-here') {
    return { provider: 'anthropic' };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'your-openai-api-key-here') {
    return { provider: 'openai' };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your-gemini-api-key-here') {
    return { provider: 'gemini' };
  }

  return null;
};

const platformGuides: Record<string, string> = {
  tiktok: 'TikTok: Short, punchy, attention-grabbing. Must hook within the first 2 seconds.',
  instagram: 'Instagram Reels: Visual-first, trendy, relatable.',
  youtube: 'YouTube Shorts: Value-driven, educational hooks.',
  twitter: 'Twitter/X: Controversial, thread-worthy, provocative.',
  linkedin: 'LinkedIn: Professional, career-focused, thought leadership.',
};

const styleGuides: Record<string, string> = {
  curiosity: 'Curiosity Gap: Create an information gap that makes viewers NEED to know more.',
  controversy: 'Controversial Take: Make a bold, slightly provocative statement.',
  storytelling: 'Storytelling: Start a compelling narrative. Use I and personal anecdotes.',
  data: 'Data-Driven: Lead with impressive numbers or statistics.',
  problem: 'Problem-Solution: Identify a painful problem, hint at a solution.',
  transformation: 'Transformation: Show the gap between current and desired state.',
};

function buildPrompt(topic: string, platform: string, style: string, context: string) {
  return {
    system: `You are an expert viral content strategist. Write 5 attention-grabbing hooks.

Platform: ${platformGuides[platform]}
Style: ${styleGuides[style]}

Rules:
1. Generate exactly 5 unique hooks
2. Each hook: 1-2 sentences max
3. No cliches, be specific and actionable
4. Format: one per line, numbered 1-5
5. NO extra text or explanations`,

    user: `Topic: ${topic}${context ? `\nContext: ${context}` : ''}

Generate 5 hooks numbered 1-5:`,
  };
}

async function streamAnthropic(systemPrompt: string, userPrompt: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });
}

async function streamOpenAI(systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  return response.body;
}

async function streamGemini(systemPrompt: string, userPrompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { maxOutputTokens: 500 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  if (!validateBodySize(request, 10)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  const rateResult = rateLimit(request, 'generate-hooks');
  if (!rateResult.success) return rateLimitError(rateResult.resetTime);

  const supabase = getSupabase();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    console.log('[generate-hooks] No authorization token provided');
    return unauthorizedError();
  }

  // Verify the token with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError) {
    console.log('[generate-hooks] Auth error:', authError.message);
    return NextResponse.json(
      { error: `Authentication failed: ${authError.message}` },
      { status: 401, headers: securityHeaders() }
    );
  }

  if (!user) {
    console.log('[generate-hooks] No user found for token');
    return unauthorizedError();
  }

  console.log('[generate-hooks] User authenticated:', user.email);

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

  // Check for available AI provider
  const providerInfo = getAvailableProvider();

  if (!providerInfo) {
    // Fallback: Return cached trending hooks
    const { data: cached } = await supabase
      .from('trending_hooks')
      .select('hook_text, category')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(5);

    if (cached && cached.length > 0) {
      return NextResponse.json({
        hooks: cached.map((h, i) => ({ id: `cached-${i}`, text: h.hook_text })),
        provider: 'cache-fallback',
        warning: 'AI providers not configured. Showing cached trending hooks. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY to .env',
      });
    }

    return NextResponse.json(
      { error: 'AI service not configured. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY to your .env file.' },
      { status: 503 }
    );
  }

  const { provider } = providerInfo;
  const prompts = buildPrompt(sanitizedTopic, platform, style, sanitizedContext);

  // Get or create user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('generations_count')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    await supabase
      .from('user_profiles')
      .insert({ user_id: user.id });
  }

  const encoder = new TextEncoder();

  try {
    if (provider === 'anthropic') {
      const stream = await streamAnthropic(prompts.system, prompts.user);

      // Increment usage count
      await supabase
        .from('user_profiles')
        .update({
          generations_count: (profile?.generations_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && 'text' in event.delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, provider: 'anthropic' })}\n\n`));
            controller.close();
          } catch (err) {
            controller.error(err);
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

    if (provider === 'openai') {
      const body = await streamOpenAI(prompts.system, prompts.user);
      if (!body) throw new Error('No response body');

      await supabase
        .from('user_profiles')
        .update({
          generations_count: (profile?.generations_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      const reader = body.getReader();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

              for (const line of lines) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, provider: 'openai' })}\n\n`));
                } else {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                    }
                  } catch { /* skip */ }
                }
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
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

    if (provider === 'gemini') {
      const text = await streamGemini(prompts.system, prompts.user);

      await supabase
        .from('user_profiles')
        .update({
          generations_count: (profile?.generations_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return NextResponse.json({
        text,
        provider: 'gemini',
        hooks: text
          .split('\n')
          .filter((l: string) => l.match(/^\d+[.)]/))
          .map((l: string) => l.replace(/^\d+[.)]\s*/, '').trim())
          .filter((l: string) => l.length > 10),
      }, { headers: securityHeaders() });
    }
  } catch (err: unknown) {
    console.error('AI generation error:', err);
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ error: 'No provider available' }, { status: 503 });
}
