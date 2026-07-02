'use client';

import { useEffect, useState } from 'react';
import { Library, ArrowRight, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SavedHook {
  id: string;
  hook_text: string;
  topic: string;
  platform: string;
  style: string;
  created_at: string;
}

const platformLabels: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
};

const styleLabels: Record<string, string> = {
  curiosity: 'Curiosity',
  controversy: 'Controversy',
  storytelling: 'Story',
  data: 'Data',
  problem: 'Problem-Solution',
  transformation: 'Transformation',
};

export default function LibraryPage() {
  const [hooks, setHooks] = useState<SavedHook[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      fetchHooks();
    }
  }, [session]);

  const fetchHooks = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/hooks/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hooks');
      }

      const data = await response.json();
      setHooks(data.hooks || []);
    } catch (error) {
      console.error('Error fetching hooks:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load saved hooks',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (hook: SavedHook) => {
    await navigator.clipboard.writeText(hook.hook_text);
    setCopiedId(hook.id);
    toast({
      description: 'Hook copied to clipboard',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (hookId: string) => {
    if (!session) return;

    setDeletingId(hookId);
    try {
      const response = await fetch(`/api/hooks/delete?id=${hookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete hook');
      }

      setHooks((prev) => prev.filter((h) => h.id !== hookId));
      toast({
        description: 'Hook deleted from library',
      });
    } catch (error) {
      console.error('Error deleting hook:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to delete hook',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (hooks.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
            <Library className="h-8 w-8 text-amber-400" />
            Saved Hooks
          </h1>
          <p className="text-muted-foreground">
            Your collection of favorite hooks, ready to use in your content
          </p>
        </div>

        {/* Empty state */}
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Library className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">
              No saved hooks yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Generate hooks and save your favorites to build your personal hook library.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold"
            >
              <Link href="/dashboard">
                Generate Hooks
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2 flex items-center gap-3">
          <Library className="h-8 w-8 text-amber-400" />
          Saved Hooks
        </h1>
        <p className="text-muted-foreground">
          {hooks.length} hook{hooks.length !== 1 ? 's' : ''} in your library
        </p>
      </div>

      {/* Hooks list */}
      <div className="space-y-4">
        {hooks.map((hook) => (
          <Card key={hook.id} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <p className="text-lg leading-relaxed">{hook.hook_text}</p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {platformLabels[hook.platform] || hook.platform}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {styleLabels[hook.style] || hook.style}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {hook.topic.slice(0, 30)}{hook.topic.length > 30 ? '...' : ''}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => handleCopy(hook)}
                  >
                    {copiedId === hook.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(hook.id)}
                    disabled={deletingId === hook.id}
                  >
                    {deletingId === hook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
