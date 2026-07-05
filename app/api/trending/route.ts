import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityHeaders, rateLimit, rateLimitError } from '@/lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const rateResult = rateLimit(request, 'search-topics');
  if (!rateResult.success) return rateLimitError(rateResult.resetTime);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  try {
    let query = supabase
      .from('trending_hooks')
      .select('id, category, hook_text, source_platform, search_keywords, engagement_score')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('engagement_score', { ascending: false })
      .limit(limit);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Trending hooks fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending hooks' },
        { status: 500 }
      );
    }

    // Group by category for the frontend
    const grouped: Record<string, typeof data> = {};
    for (const hook of data || []) {
      if (!grouped[hook.category]) grouped[hook.category] = [];
      grouped[hook.category].push(hook);
    }

    const headers = securityHeaders();
    headers.set('Cache-Control', 'public, max-age=300'); // 5 min cache

    return NextResponse.json(
      {
        hooks: data || [],
        grouped,
        categories: Object.keys(grouped),
        total: data?.length || 0,
        cached: true,
        provider: 'supabase-cache',
      },
      { headers }
    );
  } catch (err) {
    console.error('Trending hooks error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch trending hooks' },
      { status: 500 }
    );
  }
}
