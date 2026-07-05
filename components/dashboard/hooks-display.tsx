'use client';

import { useState, useCallback } from 'react';
import {
  Copy, Check, Bookmark, Loader2, RefreshCw, Sparkles, CopyCheck, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Hook {
  id: string;
  text: string;
  copied: boolean;
  saved: boolean;
}

interface HooksDisplayProps {
  hooks: Hook[];
  isLoading: boolean;
  onSaveHook: (hook: string) => void;
  onRegenerate: () => void;
  platform?: string;
  style?: string;
}

const loadingMessages = [
  'Analyzing your topic...',
  'Crafting viral patterns...',
  'Optimizing for engagement...',
  'Adding creative angles...',
  'Polishing your hooks...',
];

export function HooksDisplay({
  hooks,
  isLoading,
  onSaveHook,
  onRegenerate,
  platform,
  style,
}: HooksDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [msgIndex] = useState(() => Math.floor(Math.random() * loadingMessages.length));
  const { toast } = useToast();

  const handleCopy = useCallback(async (hook: Hook) => {
    await navigator.clipboard.writeText(hook.text);
    setCopiedId(hook.id);
    toast({ description: 'Hook copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  }, [toast]);

  const handleCopyAll = useCallback(async () => {
    const text = hooks.map((h, i) => `${i + 1}. ${h.text}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    setAllCopied(true);
    toast({ description: `All ${hooks.length} hooks copied to clipboard` });
    setTimeout(() => setAllCopied(false), 2500);
  }, [hooks, toast]);

  const handleExportTxt = useCallback(() => {
    const lines = [
      `HookForge — Generated Hooks`,
      platform ? `Platform: ${platform}` : '',
      style ? `Style: ${style}` : '',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      ...hooks.map((h, i) => `${i + 1}. ${h.text}`),
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hookforge-hooks.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({ description: 'Hooks exported as text file' });
  }, [hooks, platform, style, toast]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle>Generating Hooks...</CardTitle>
          <CardDescription>AI is crafting your viral hooks</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-amber-400/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-foreground font-medium">{loadingMessages[msgIndex]}</p>
              <p className="text-sm text-muted-foreground">This takes a few seconds</p>
            </div>
            {/* Skeleton hooks */}
            <div className="w-full space-y-3 pt-2">
              {[85, 70, 90, 65, 75].map((w, i) => (
                <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border animate-pulse">
                  <div className={`h-4 bg-secondary rounded`} style={{ width: `${w}%` }} />
                  <div className="h-3 bg-secondary rounded mt-2 w-2/5" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hooks.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle>Generated Hooks</CardTitle>
          <CardDescription>Your AI-generated hooks will appear here</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-amber-400/50" />
            </div>
            <p className="font-medium mb-1">No hooks yet</p>
            <p className="text-sm">Fill out the form above to generate your first hooks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const savedCount = hooks.filter((h) => h.saved).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Generated Hooks
              <Badge variant="secondary" className="text-xs font-normal">
                {hooks.length}
              </Badge>
              {savedCount > 0 && (
                <Badge className="text-xs font-normal bg-amber-400/10 text-amber-400 border-amber-400/20">
                  {savedCount} saved
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">Click bookmark to save or copy any hook</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTxt}
              className="text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="text-muted-foreground hover:text-foreground"
            >
              {allCopied ? (
                <><CopyCheck className="h-4 w-4 mr-1.5 text-green-500" /> Copied!</>
              ) : (
                <><Copy className="h-4 w-4 mr-1.5" /> Copy All</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-3">
        {hooks.map((hook, index) => (
          <div
            key={hook.id}
            className={cn(
              'group relative p-4 pl-12 rounded-xl border transition-all duration-200',
              hook.saved
                ? 'bg-amber-400/5 border-amber-400/25'
                : 'bg-secondary/40 border-border hover:border-amber-500/30 hover:bg-secondary/60'
            )}
          >
            {/* Number badge */}
            <span className="absolute left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>

            {/* Hook text */}
            <p className="text-base leading-relaxed pr-20">{hook.text}</p>

            {/* Char count */}
            <p className="text-xs text-muted-foreground/60 mt-1.5">{hook.text.length} chars</p>

            {/* Actions */}
            <div className="absolute top-3.5 right-3.5 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className={cn(
                  'h-8 w-8',
                  hook.saved ? 'text-amber-400' : 'opacity-0 group-hover:opacity-100 transition-opacity'
                )}
                onClick={() => !hook.saved && onSaveHook(hook.text)}
                disabled={hook.saved}
              >
                <Bookmark className="h-4 w-4" fill={hook.saved ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </div>
        ))}

        {/* Save all prompt */}
        {hooks.filter((h) => !h.saved).length > 1 && (
          <p className="text-center text-xs text-muted-foreground pt-1">
            Bookmark individual hooks to save them to your library
          </p>
        )}
      </CardContent>
    </Card>
  );
}
