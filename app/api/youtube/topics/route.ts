import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityHeaders, rateLimit, rateLimitError, unauthorizedError } from '@/lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const rateResult = rateLimit(request, 'youtube-topics');
  if (!rateResult.success) return rateLimitError(rateResult.resetTime);

  // Verify Supabase session
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return unauthorizedError();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return unauthorizedError();

  // Get the Google OAuth provider token (passed from client)
  const providerToken = request.headers.get('x-provider-token');
  if (!providerToken) {
    return NextResponse.json(
      { error: 'No Google token found. Please sign in with Google to import YouTube content.' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Get user's channel uploads playlist ID
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&mine=true',
      {
        headers: { Authorization: `Bearer ${providerToken}` },
      }
    );

    if (!channelRes.ok) {
      const err = await channelRes.json();
      if (channelRes.status === 401) {
        return NextResponse.json(
          { error: 'Google token expired. Please sign out and sign in with Google again.' },
          { status: 401 }
        );
      }
      throw new Error(err.error?.message || 'Failed to fetch YouTube channel');
    }

    const channelData = await channelRes.json();
    const items = channelData.items ?? [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No YouTube channel found for this Google account.', topics: [] },
        { status: 200 }
      );
    }

    const channelTitle: string = items[0].snippet?.title ?? 'Your Channel';
    const uploadsPlaylistId: string = items[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json({ topics: [], channelTitle }, { headers: securityHeaders() });
    }

    // Step 2: Fetch recent videos from the uploads playlist
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=25`,
      {
        headers: { Authorization: `Bearer ${providerToken}` },
      }
    );

    if (!videosRes.ok) {
      throw new Error('Failed to fetch YouTube videos');
    }

    const videosData = await videosRes.json();
    const videos: Array<{ id: string; title: string; description: string; thumbnail: string }> =
      (videosData.items ?? [])
        .filter((item: any) => item.snippet?.title && item.snippet.title !== 'Private video')
        .map((item: any) => ({
          id: item.snippet.resourceId?.videoId ?? item.id,
          title: item.snippet.title,
          description: item.snippet.description?.slice(0, 200) ?? '',
          thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
        }));

    return NextResponse.json(
      { topics: videos, channelTitle },
      { headers: securityHeaders() }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch YouTube content';
    console.error('YouTube API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
