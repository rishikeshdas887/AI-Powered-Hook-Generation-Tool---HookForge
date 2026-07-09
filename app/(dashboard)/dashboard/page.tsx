'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HooksDisplay } from '@/components/dashboard/hooks-display';
import { TrendingSearch } from '@/components/dashboard/trending-search';
import { YouTubeImport } from '@/components/dashboard/youtube-import';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const platforms = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram Reels' },
  { value: 'youtube', label: 'YouTube Shorts' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const hookStyles = [
  { value: 'curiosity', label: 'Curiosity Gap' },
  { value: 'controversy', label: 'Controversial Take' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'data', label: 'Data-Driven' },
  { value: 'problem', label: 'Problem-Solution' },
  { value: 'transformation', label: 'Transformation' },
];

interface Hook {
  id: string;
  text: string;
  copied: boolean;
  saved: boolean;
}

export default function DashboardPage() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [style, setStyle] = useState('curiosity');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [savedHookIds, setSavedHookIds] = useState<Set<string>>(new Set());
  const [generationsCount, setGenerationsCount] = useState(0);

  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!session) return;
      try {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setGenerationsCount(data.profile.generations_used);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, [session]);

  const generateHooks = async () => {
    if (!topic.trim()) {
      toast({ variant: 'destructive', description: 'Please enter a topic for your content' });
      return;
    }

    if (!session) {
      toast({ variant: 'destructive', description: 'Please sign in to generate hooks' });
      return;
    }

    if (!session.access_token) {
      toast({ variant: 'destructive', description: 'Session not ready. Please refresh the page.' });
      return;
    }

    setIsLoading(true);
    setHooks([]);

    try {
      const response = await fetch('/api/generate-hooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topic, platform, style, context }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate hooks');
      }

      setGenerationsCount((prev) => prev + 1);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) accumulatedText += data.text;
              } catch { /* skip */ }
            }
          }
        }
      }

      const parsedHooks = accumulatedText
        .split('\n')
        .filter((line) => line.trim().match(/^\d+[.)]/))
        .map((line, index) => ({
          id: `hook-${index}-${Date.now()}`,
          text: line.replace(/^\d+[.)]\s*/, '').trim(),
          copied: false,
          saved: false,
        }))
        .filter((hook) => hook.text.length > 0);

      const finalHooks = parsedHooks.length > 0
        ? parsedHooks
        : accumulatedText
            .split('\n')
            .filter((line) => line.trim().length > 10)
            .slice(0, 5)
            .map((line, index) => ({
              id: `hook-${index}-${Date.now()}`,
              text: line.trim(),
              copied: false,
              saved: false,
            }));

      setHooks(finalHooks);
    } catch (error: any) {
      console.error('Error generating hooks:', error);
      toast({ variant: 'destructive', description: error.message || 'Failed to generate hooks. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrendingSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);
    // Scroll to generator form
    setTimeout(() => {
      document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSaveHook = async (hookText: string) => {
    if (!session) {
      toast({ variant: 'destructive', description: 'Please sign in to save hooks' });
      return;
    }

    try {
      const response = await fetch('/api/hooks/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ hookText, topic, platform, style }),
      });

      if (!response.ok) throw new Error('Failed to save hook');

      const { hook } = await response.json();

      setHooks((prev) =>
        prev.map((h) => h.text === hookText ? { ...h, saved: true } : h)
      );
      setSavedHookIds((prev) => { const s = new Set(Array.from(prev)); s.add(hook.id); return s; });

      toast({ description: 'Hook saved to your library' });
    } catch (error) {
      console.error('Error saving hook:', error);
      toast({ variant: 'destructive', description: 'Failed to save hook. Please try again.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
            Generate Viral Hooks
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Search trending topics or describe your content to generate scroll-stopping hooks.
          </p>
        </div>
        {generationsCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/5 border border-amber-400/15 shrink-0">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">{generationsCount}</span>
            <span className="text-sm text-muted-foreground">hooks generated</span>
          </div>
        )}
      </div>

      {/* Trending Search Section */}
      <TrendingSearch onSelectTopic={handleTrendingSelect} session={session} />

      {/* Content import — YouTube + future integrations */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
          Import from your content
        </p>
        <YouTubeImport session={session} onSelectTopic={handleTrendingSelect} />
      </div>

      {/* Generator form */}
      <Card id="generator-form" className="mb-8 border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Hook Generator
          </CardTitle>
          <CardDescription>
            {topic
              ? 'Topic loaded — customize settings and generate your hooks'
              : 'Fill in your content details to generate 5 unique hooks'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); generateHooks(); }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-base font-medium">
                What&apos;s your content about?
              </Label>
              <Textarea
                id="topic"
                placeholder="e.g., How to build a morning routine that actually sticks for busy entrepreneurs"
                className="min-h-[100px] resize-none"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
              {topic && (
                <p className="text-xs text-amber-400">
                  Topic loaded from trending selection
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform} disabled={isLoading}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Hook Style</Label>
                <Select value={style} onValueChange={setStyle} disabled={isLoading}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {hookStyles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context" className="flex items-center gap-2">
                Additional Context
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="context"
                placeholder="e.g., Target audience is 25-35 year old professionals"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating hooks...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate 5 Hooks
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated hooks */}
      <HooksDisplay
        hooks={hooks}
        isLoading={isLoading}
        onSaveHook={handleSaveHook}
        onRegenerate={generateHooks}
        platform={platform}
        style={style}
      />
    </div>
  );
}
