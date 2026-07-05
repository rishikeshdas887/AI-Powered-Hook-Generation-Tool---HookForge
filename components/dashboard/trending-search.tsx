'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Sparkles, Loader2, X, ArrowRight, Flame, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Session } from '@supabase/supabase-js';

interface TrendingHook {
  id: string;
  category: string;
  hook_text: string;
  source_platform: string;
  search_keywords: string[];
  engagement_score: number;
}

const platformIcons: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'IG',
  youtube: 'YT',
  twitter: 'X',
  linkedin: 'in',
};

const CATEGORY_COLORS: Record<string, string> = {
  entrepreneurship: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  productivity: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'side-hustle': 'text-green-400 bg-green-400/10 border-green-400/20',
  fitness: 'text-red-400 bg-red-400/10 border-red-400/20',
  marketing: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  finance: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  default: 'text-muted-foreground bg-secondary border-border',
};

interface AITopic {
  topic: string;
  category: string;
}

interface TrendingSearchProps {
  onSelectTopic: (topic: string) => void;
  session: Session | null;
}

export function TrendingSearch({ onSelectTopic, session }: TrendingSearchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [trendingHooks, setTrendingHooks] = useState<TrendingHook[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [aiTopics, setAiTopics] = useState<AITopic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);

  // Load trending hooks from cache
  useEffect(() => {
    const fetchTrending = async () => {
      setLoadingTrending(true);
      try {
        const res = await fetch('/api/trending?limit=24');
        if (res.ok) {
          const data = await res.json();
          setTrendingHooks(data.hooks || []);
        }
      } catch {
        // Keep empty state
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  const refreshTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch('/api/trending?limit=24&' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setTrendingHooks(data.hooks || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingTrending(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(trendingHooks.map((h) => h.category)))];

  const filtered = activeCategory === 'all'
    ? trendingHooks
    : trendingHooks.filter((h) => h.category === activeCategory);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    if (!session) {
      onSelectTopic(query.trim());
      return;
    }

    setIsSearching(true);
    setShowAiResults(true);
    setAiTopics([]);

    try {
      const res = await fetch('/api/search-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: query.trim(), platform: 'all' }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiTopics(data.topics || []);
      }
    } catch {
      onSelectTopic(query.trim());
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setQuery('');
      setShowAiResults(false);
      setAiTopics([]);
    }
  };

  const handleSelectTopic = (topic: string) => {
    onSelectTopic(topic);
    setQuery('');
    setShowAiResults(false);
    setAiTopics([]);
  };

  const clearSearch = () => {
    setQuery('');
    setShowAiResults(false);
    setAiTopics([]);
  };

  return (
    <div className="mb-8">
      {/* Search row */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search a topic or describe your content idea..."
            className="pl-10 pr-10 h-11 text-base bg-card border-border focus:border-amber-400/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
          />
          {query && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="h-11 px-5 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />AI Search</>
          )}
        </Button>
      </div>

      {/* AI results overlay */}
      {showAiResults && (
        <div className="mb-5 bg-card border border-border rounded-xl shadow-xl overflow-hidden relative z-10">
          {isSearching ? (
            <div className="p-5 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              <span>Finding trending topic ideas...</span>
            </div>
          ) : aiTopics.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b border-border mb-2">
                <Sparkles className="h-3 w-3 text-amber-400" />
                AI-suggested topics
              </div>
              {aiTopics.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectTopic(item.topic)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary/50 flex items-center gap-3 group transition-colors"
                >
                  <span className={cn(
                    'shrink-0 px-2 py-0.5 rounded text-xs font-medium border capitalize',
                    CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default
                  )}>
                    {item.category}
                  </span>
                  <span className="text-sm flex-1">{item.topic}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 shrink-0 transition-colors" />
                </button>
              ))}
              <div className="px-3 pt-2 border-t border-border mt-2">
                <button
                  onClick={() => handleSelectTopic(query)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <ArrowRight className="h-3 w-3" />
                  Use &quot;{query}&quot; directly
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No suggestions found.{' '}
              <button onClick={() => handleSelectTopic(query)} className="text-amber-400 hover:text-amber-300 transition-colors">
                Use your query directly
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trending hooks section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Trending Hooks</span>
            <span className="text-xs text-muted-foreground">— pre-generated ready to use</span>
          </div>
          <button
            onClick={refreshTrending}
            disabled={loadingTrending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <RefreshCw className={cn('h-3 w-3', loadingTrending && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize',
                  activeCategory === cat
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-400'
                    : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loadingTrending && trendingHooks.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border animate-pulse">
                <div className="h-3 w-16 bg-secondary rounded mb-3" />
                <div className="h-4 bg-secondary rounded w-full" />
                <div className="h-4 bg-secondary rounded w-3/4 mt-1" />
              </div>
            ))}
          </div>
        )}

        {/* Hook cards grid */}
        {!loadingTrending && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((hook) => (
              <button
                key={hook.id}
                onClick={() => handleSelectTopic(hook.hook_text)}
                className="group text-left p-4 rounded-xl bg-card border border-border hover:border-amber-400/30 hover:bg-card/80 active:bg-secondary transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'shrink-0 px-2 py-0.5 rounded text-xs font-medium border capitalize',
                      CATEGORY_COLORS[hook.category] || CATEGORY_COLORS.default
                    )}>
                      {hook.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">
                      {platformIcons[hook.source_platform] || hook.source_platform}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
                <p className="text-sm text-foreground leading-snug line-clamp-2">{hook.hook_text}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-muted-foreground">{hook.engagement_score}% engagement</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingTrending && filtered.length === 0 && trendingHooks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm bg-card border border-border rounded-xl">
            <Flame className="h-8 w-8 mx-auto mb-2 text-amber-400 opacity-50" />
            <p>Trending hooks will appear here</p>
            <p className="text-xs mt-1">Database is being populated...</p>
          </div>
        )}
      </div>
    </div>
  );
}
