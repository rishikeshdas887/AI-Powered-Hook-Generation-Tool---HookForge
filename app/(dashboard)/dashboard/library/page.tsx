'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Library, ArrowRight, Copy, Check, Trash2, Loader2,
  Search, Filter, Download, BookOpen, X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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

const platformColors: Record<string, string> = {
  tiktok:    'text-pink-400 bg-pink-400/10 border-pink-400/20',
  instagram: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  youtube:   'text-red-400 bg-red-400/10 border-red-400/20',
  twitter:   'text-sky-400 bg-sky-400/10 border-sky-400/20',
  linkedin:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

export default function LibraryPage() {
  const [hooks, setHooks] = useState<SavedHook[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');

  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (session) fetchHooks();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHooks = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await fetch('/api/hooks/list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setHooks(data.hooks || []);
    } catch {
      toast({ variant: 'destructive', description: 'Failed to load saved hooks' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => hooks.filter((h) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      h.hook_text.toLowerCase().includes(q) ||
      h.topic.toLowerCase().includes(q);
    const matchPlatform = filterPlatform === 'all' || h.platform === filterPlatform;
    const matchStyle = filterStyle === 'all' || h.style === filterStyle;
    return matchSearch && matchPlatform && matchStyle;
  }), [hooks, search, filterPlatform, filterStyle]);

  const hasFilters = search || filterPlatform !== 'all' || filterStyle !== 'all';

  const clearFilters = () => { setSearch(''); setFilterPlatform('all'); setFilterStyle('all'); };

  const handleCopy = async (hook: SavedHook) => {
    await navigator.clipboard.writeText(hook.hook_text);
    setCopiedId(hook.id);
    toast({ description: 'Hook copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const header = ['Hook Text', 'Topic', 'Platform', 'Style', 'Created At'].join(',');
    const rows = filtered.map((h) => [
      `"${h.hook_text.replace(/"/g, '""')}"`,
      `"${h.topic.replace(/"/g, '""')}"`,
      platformLabels[h.platform] || h.platform,
      styleLabels[h.style] || h.style,
      new Date(h.created_at).toLocaleDateString(),
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hookforge-library.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ description: `Exported ${filtered.length} hooks` });
  };

  const handleDelete = async (hookId: string) => {
    if (!session) return;
    setDeletingId(hookId);
    try {
      const response = await fetch(`/api/hooks/delete?id=${hookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error();
      setHooks((prev) => prev.filter((h) => h.id !== hookId));
      toast({ description: 'Hook removed from library' });
    } catch {
      toast({ variant: 'destructive', description: 'Failed to delete hook' });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Library className="h-7 w-7 text-amber-400" />
            Saved Hooks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hooks.length} hook{hooks.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        {hooks.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Empty state */}
      {hooks.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-amber-400" />
            </div>
            <h3 className="font-heading text-xl font-semibold mb-2">Library is empty</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
              Generate hooks and bookmark your favorites — they all land here.
            </p>
            <Button asChild className="bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold">
              <Link href="/dashboard">
                Generate Hooks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {hooks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search hooks or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-full sm:w-40 h-10">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {Object.entries(platformLabels).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStyle} onValueChange={setFilterStyle}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All styles</SelectItem>
              {Object.entries(styleLabels).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 h-10 text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* No results */}
      {hooks.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hooks match your filters</p>
          <button onClick={clearFilters} className="text-amber-400 text-sm mt-2 hover:underline">Clear filters</button>
        </div>
      )}

      {/* Hooks list */}
      {filtered.length > 0 && (
        <>
          <div className="space-y-3">
            {filtered.map((hook) => (
              <Card key={hook.id} className="border-border bg-card hover:border-amber-500/20 transition-colors group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <p className="text-base leading-relaxed">{hook.hook_text}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${platformColors[hook.platform] || 'text-muted-foreground'}`}
                        >
                          {platformLabels[hook.platform] || hook.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {styleLabels[hook.style] || hook.style}
                        </Badge>
                        <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
                          {hook.topic}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/50">
                        {new Date(hook.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleCopy(hook)}
                      >
                        {copiedId === hook.id
                          ? <Check className="h-4 w-4 text-green-500" />
                          : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(hook.id)}
                        disabled={deletingId === hook.id}
                      >
                        {deletingId === hook.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasFilters && (
            <p className="text-center text-xs text-muted-foreground mt-5">
              Showing {filtered.length} of {hooks.length} hooks
            </p>
          )}
        </>
      )}
    </div>
  );
}
