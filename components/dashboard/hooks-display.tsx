'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Bookmark, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export function HooksDisplay({ hooks, isLoading, onSaveHook, onRegenerate }: HooksDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = useCallback(async (hook: Hook) => {
    await navigator.clipboard.writeText(hook.text);
    setCopiedId(hook.id);
    toast({
      description: 'Hook copied to clipboard',
    });
    setTimeout(() => setCopiedId(null), 2000);
  }, [toast]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle>Generating Hooks...</CardTitle>
          <CardDescription>AI is crafting your viral hooks</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
            <div className="text-center space-y-1">
              <p className="text-muted-foreground">Analyzing your topic...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
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
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Fill out the form above to generate your first hooks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border flex-row justify-between items-center">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Generated Hooks
          </CardTitle>
          <CardDescription>Click to copy or save your favorites</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {hooks.map((hook) => (
          <div
            key={hook.id}
            className="group relative p-4 rounded-xl bg-secondary/50 border border-border hover:border-amber-500/30 transition-all"
          >
            <p className="text-base leading-relaxed pr-24">{hook.text}</p>

            <div className="absolute top-4 right-4 flex gap-2">
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
                className={`h-9 w-9 ${hook.saved ? 'text-amber-400' : ''}`}
                onClick={() => onSaveHook(hook.text)}
              >
                <Bookmark className="h-4 w-4" fill={hook.saved ? 'currentColor' : 'none'} />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
