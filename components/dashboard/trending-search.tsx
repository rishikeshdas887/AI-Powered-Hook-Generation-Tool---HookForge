'use client';

import { useState } from 'react';
import { Search, TrendingUp, Sparkles, Loader2, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TRENDING_TOPICS = [
  { topic: 'How I went from broke to $10k/month with one skill nobody teaches in school', category: 'finance', platform: 'tiktok' },
  { topic: 'Morning routine habits that top CEOs follow but never talk about publicly', category: 'productivity', platform: 'linkedin' },
  { topic: 'The brutal truth about why most people never achieve their fitness goals', category: 'health', platform: 'instagram' },
  { topic: 'I tried 30 days of cold showers and this is what nobody tells you', category: 'lifestyle', platform: 'youtube' },
  { topic: 'AI tools that will replace 90% of jobs in the next 5 years — and what to do about it', category: 'tech', platform: 'twitter' },
  { topic: 'Why successful people never share their real secrets to success on social media', category: 'business', platform: 'linkedin' },
  { topic: 'The one mindset shift that changed everything about how I make money online', category: 'finance', platform: 'tiktok' },
  { topic: 'Things I stopped buying that made me richer and happier at the same time', category: 'lifestyle', platform: 'instagram' },
  { topic: 'Unpopular opinion: working less makes you more productive — here is the science', category: 'productivity', platform: 'twitter' },
  { topic: 'How to build a personal brand from zero with no followers and no money', category: 'business', platform: 'tiktok' },
  { topic: 'Side hustles that actually made me money vs ones that were total waste of time', category: 'finance', platform: 'youtube' },
  { topic: 'Why most relationship advice is completely wrong and what actually works', category: 'relationships', platform: 'instagram' },
];

const CATEGORIES = ['all', 'finance', 'business', 'productivity', 'health', 'tech', 'lifestyle', 'relationships'];

const CATEGORY_COLORS: Record<string, string> = {
  finance: 'text-green-400 bg-green-400/10 border-green-400/20',
  business: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  productivity: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  health: 'text-red-400 bg-red-400/10 border-red-400/20',
  tech: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  lifestyle: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  relationships: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  general: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

interface AITopic {
  topic: string;
  category: string;
}

interface TrendingSearchProps {
  onSelectTopic: (topic: string) => void;
  session: { access_token: string } | null;
}

export function TrendingSearch({ onSelectTopic, session }: TrendingSearchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [aiTopics, setAiTopics] = useState<AITopic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);

  const filtered = activeCategory === 'all'
    ? TRENDING_TOPICS
    : TRENDING_TOPICS.filter((t) => t.category === activeCategory);

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
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query: query.trim(), platform: 'all' }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiTopics(data.topics || []);
      }
    } catch {
      // Fall back to using query directly
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
      {/* Search bar */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search a topic or describe your content idea..."
              className="pl-10 pr-10 h-12 text-base bg-card border-border focus:border-amber-400/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="h-12 px-5 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Search
              </>
            )}
          </Button>
        </div>

        {/* AI search results dropdown */}
        {showAiResults && (
          <div className="absolute top-14 left-0 right-0 z-10 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {isSearching ? (
              <div className="p-6 flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                <span>Finding trending topic ideas...</span>
              </div>
            ) : aiTopics.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b border-border mb-2">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>AI-suggested topics based on your search</span>
                </div>
                {aiTopics.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectTopic(item.topic)}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-secondary/50 active:bg-secondary flex items-start gap-3 group transition-colors"
                  >
                    <div className={cn(
                      'mt-0.5 shrink-0 px-2 py-0.5 rounded text-xs font-medium border capitalize',
                      CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general
                    )}>
                      {item.category}
                    </div>
                    <span className="text-sm text-foreground leading-relaxed flex-1">{item.topic}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 shrink-0 mt-0.5 transition-colors" />
                  </button>
                ))}
                <div className="px-3 pt-2 border-t border-border mt-2">
                  <button
                    onClick={() => handleSelectTopic(query)}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Use "{query}" directly
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No suggestions found.{' '}
                <button
                  onClick={() => handleSelectTopic(query)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Use your query directly
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trending section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Trending Topics</span>
          <span className="text-xs text-muted-foreground">— click to generate hooks instantly</span>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
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

        {/* Topic cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSelectTopic(item.topic)}
              className="group text-left p-4 rounded-xl bg-card border border-border hover:border-amber-400/30 hover:bg-card/80 active:bg-secondary transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={cn(
                  'shrink-0 px-2 py-0.5 rounded text-xs font-medium border capitalize',
                  CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general
                )}>
                  {item.category}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 transition-colors shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">{item.topic}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
