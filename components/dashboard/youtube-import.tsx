'use client';

import { useState, useEffect } from 'react';
import { Youtube, Loader2, ChevronRight, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Session } from '@supabase/supabase-js';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface YouTubeImportProps {
  session: Session | null;
  onSelectTopic: (topic: string) => void;
}

export function YouTubeImport({ session, onSelectTopic }: YouTubeImportProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [channelTitle, setChannelTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hasStoredToken, setHasStoredToken] = useState<boolean | null>(null);

  // Check if we have a stored Google OAuth token
  useEffect(() => {
    const checkToken = async () => {
      if (!session?.access_token) {
        setHasStoredToken(null);
        return;
      }

      try {
        const res = await fetch('/api/oauth/store', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHasStoredToken(data.hasToken);
        } else {
          setHasStoredToken(false);
        }
      } catch {
        // Fall back to checking provider_token in session
        setHasStoredToken(!!session?.provider_token);
      }
    };

    checkToken();
  }, [session]);

  const hasGoogleToken = !!session?.provider_token || hasStoredToken === true;

  const fetchVideos = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    setVideos([]);

    try {
      const res = await fetch('/api/youtube/topics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(session.provider_token ? { 'X-Provider-Token': session.provider_token } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsReauth) {
          setHasStoredToken(false);
          setError('Your Google connection has expired. Please sign in with Google again.');
        } else {
          setError(data.error || 'Failed to fetch YouTube content');
        }
        return;
      }

      setVideos(data.topics ?? []);
      setChannelTitle(data.channelTitle ?? '');

      if ((data.topics ?? []).length === 0) {
        setError('No videos found on your YouTube channel.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && videos.length === 0 && !loading && hasGoogleToken) {
      fetchVideos();
    }
  };

  const handleSelect = (video: Video) => {
    setSelected(video.id);
    onSelectTopic(video.title);
    setTimeout(() => setOpen(false), 300);
  };

  // Not signed in
  if (!session) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
          <Youtube className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Import from YouTube</p>
          <p className="text-xs text-muted-foreground">Sign in to import your videos</p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs shrink-0" asChild>
          <a href="/login">Sign In</a>
        </Button>
      </div>
    );
  }

  // Signed in but no Google token
  if (!hasGoogleToken && hasStoredToken !== null) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
          <Youtube className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Import from YouTube</p>
          <p className="text-xs text-muted-foreground">Connect Google to import your videos</p>
        </div>
        <Button
          size="sm"
          className="text-xs shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold"
          asChild
        >
          <a
            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback&scopes=openid%20email%20profile%20https://www.googleapis.com/auth/youtube.readonly&prompt=consent`}
          >
            Connect Google
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </div>
    );
  }

  // Checking token status
  if (hasStoredToken === null) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
          <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Import from YouTube</p>
          <p className="text-xs text-muted-foreground">Checking Google connection...</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 transition-all w-full text-left group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
            <Youtube className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Import from YouTube</p>
            <p className="text-xs text-muted-foreground">Use your video titles as hook topics</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Import from YouTube
          </DialogTitle>
          <DialogDescription>
            {channelTitle
              ? `Showing videos from "${channelTitle}" — select one to generate hooks for it`
              : 'Select a video to use its title as your hook topic'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <p className="text-sm text-muted-foreground">Fetching your YouTube videos...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-6 space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchVideos} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <ScrollArea className="h-[360px] -mx-1 px-1">
              <div className="space-y-2 pr-2">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleSelect(video)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                      selected === video.id
                        ? 'border-amber-400/60 bg-amber-400/5'
                        : 'border-border hover:border-amber-400/30 hover:bg-secondary/40'
                    )}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="w-20 h-[52px] object-cover rounded-lg shrink-0 bg-secondary"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-20 h-[52px] rounded-lg bg-secondary shrink-0 flex items-center justify-center">
                        <Youtube className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{video.title}</p>
                      {video.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video.description}</p>
                      )}
                    </div>

                    {selected === video.id && (
                      <CheckCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {!loading && videos.length > 0 && (
            <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
              <Badge variant="secondary" className="text-xs">
                {videos.length} videos
              </Badge>
              <Button variant="ghost" size="sm" onClick={fetchVideos} className="text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
