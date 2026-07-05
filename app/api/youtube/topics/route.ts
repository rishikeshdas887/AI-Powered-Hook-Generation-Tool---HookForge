import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityHeaders, rateLimit, rateLimitError, unauthorizedError } from '@/lib/security';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key!);
}

export async function GET(request: NextRequest) {
  const rateResult = rateLimit(request, 'youtube-topics');
  if (!rateResult.success) return rateLimitError(rateResult.resetTime);

  const supabase = getSupabase();
  const supabaseAdmin = getSupabaseAdmin();

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return unauthorizedError();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return unauthorizedError();

  // Try to get provider token from header first (fresh from OAuth)
  let providerToken = request.headers.get('x-provider-token');

  // If not in header, try to get from stored OAuth tokens
  if (!providerToken) {
    const { data: oauthData } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('provider_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (oauthData?.provider_token) {
      providerToken = oauthData.provider_token;
    }
  }

  if (!providerToken) {
    return NextResponse.json(
      { error: 'No Google token found. Please sign in with Google to import YouTube content.', hasGoogleToken: false },
      { status: 400 }
    );
  }

  try {
    // Get user's channel uploads playlist ID
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&mine=true',
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );

    if (!channelRes.ok) {
      const err = await channelRes.json().catch(() => ({}));
      if (channelRes.status === 401) {
        // Token expired - clear stored token
        await supabaseAdmin
          .from('user_oauth_tokens')
          .delete()
          .eq('user_id', user.id);

        return NextResponse.json(
          { error: 'Google token expired. Please sign in with Google again.', hasGoogleToken: false, needsReauth: true },
          { status: 401 }
        );
      }
      throw new Error(err.error?.message || 'Failed to fetch YouTube channel');
    }

    const channelData = await channelRes.json();
    const items = channelData.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No YouTube channel found for this Google account.', topics: [], channelTitle: '' },
        { status: 200 }
      );
    }

    const channelTitle: string = items[0].snippet?.title ?? 'Your Channel';
    const uploadsPlaylistId: string = items[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json({ topics: [], channelTitle, hasGoogleToken: true }, { headers: securityHeaders() });
    }

    // Fetch recent videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=25`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );

    if (!videosRes.ok) {
      throw new Error('Failed to fetch YouTube videos');
    }

    const videosData = await videosRes.json();
    const videos: Array<{ id: string; title: string; description: string; thumbnail: string }> =
      (videosData.items ?? [])
        .filter((item: unknown) => {
          const snippet = (item as { snippet?: { title?: string } }).snippet;
          return snippet?.title && snippet.title !== 'Private video';
        })
        .map((item: unknown) => {
          const i = item as {
            snippet: {
              resourceId?: { videoId?: string };
              title: string;
              description?: string;
              thumbnails?: { medium?: { url: string }; default?: { url: string } };
            };
            id: string;
          };
          return {
            id: i.snippet.resourceId?.videoId ?? i.id,
            title: i.snippet.title,
            description: i.snippet.description?.slice(0, 200) ?? '',
            thumbnail: i.snippet.thumbnails?.medium?.url ?? i.snippet.thumbnails?.default?.url ?? '',
          };
        });

    return NextResponse.json(
      { topics: videos, channelTitle, hasGoogleToken: true },
      { headers: securityHeaders() }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch YouTube content';
    console.error('YouTube API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
