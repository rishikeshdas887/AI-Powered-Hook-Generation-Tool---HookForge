'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Zap, TrendingUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const exampleHooks = [
  {
    platform: 'TikTok',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    hooks: [
      "Nobody talks about this morning habit because they don't want you to succeed before 9AM.",
      "Stop blaming your phone for ruining productivity — here's what's actually stealing your focus.",
      "The habit that took me from 3 tasks to 30 tasks per day (it's embarrassingly simple).",
    ],
  },
  {
    platform: 'LinkedIn',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    hooks: [
      "After 8 years in marketing, I was replaced by a $29/month AI tool. Here's what I learned.",
      "Hot take: Most productivity advice is written by people who've never managed a real team.",
      "The email that got me a $180K salary increase — and the 3-word subject line that made it work.",
    ],
  },
  {
    platform: 'YouTube',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    hooks: [
      "I tried waking up at 4AM for 30 days. Here's the thing nobody warns you about.",
      "The secret to viral content isn't what you say — it's the first 3 seconds.",
      "3 things I wish I knew before starting my business (skip the $50K mistake).",
    ],
  },
  {
    platform: 'Instagram',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    hooks: [
      "POV: You finally found the content strategy that converts followers to customers.",
      "Things that just make sense when you stop chasing viral and start creating value.",
      "The editing trick that doubled my Reel views — takes under 60 seconds to use.",
    ],
  },
];

function HookCard({
  text, platform, color, bg, border,
}: { text: string; platform: string; color: string; bg: string; border: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group relative p-5 rounded-2xl border bg-card/80 backdrop-blur-sm', border)}>
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', color, bg, border)}>
          {platform}
        </span>
        <div className="flex-1" />
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-secondary"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-green-500" />
            : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
      <p className="text-base leading-relaxed text-foreground font-medium">{text}</p>
    </div>
  );
}

export function HeroSection() {
  const [activeSet, setActiveSet] = useState(0);
  const [hookIndex, setHookIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setHookIndex((prev) => {
          const next = prev + 1;
          if (next >= exampleHooks[activeSet].hooks.length) {
            setActiveSet((s) => (s + 1) % exampleHooks.length);
            return 0;
          }
          return next;
        });
        setFade(true);
      }, 300);
    }, 3400);
    return () => clearInterval(interval);
  }, [activeSet]);

  const current = exampleHooks[activeSet];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(38 92% 58%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(38 92% 58%) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-muted-foreground">AI-Powered Hook Generation</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Hooks That
              <br />
              <span className="gradient-text">Stop the Scroll</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
              Stop staring at blank screens. Generate 5 viral hooks for TikTok, YouTube,
              LinkedIn & more in seconds — not hours.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold px-8 h-12 text-lg hover:opacity-90 transition-opacity glow-amber-sm w-full sm:w-auto"
                asChild
              >
                <Link href="/login">
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border px-8 h-12 text-lg w-full sm:w-auto"
                asChild
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 sm:gap-10">
              {[
                { icon: Zap, label: '5 Hooks', sub: 'per generation' },
                { icon: TrendingUp, label: '10x Faster', sub: 'than writing' },
                { icon: Sparkles, label: '6 Styles', sub: 'available' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{label}</div>
                    <div className="text-xs text-muted-foreground">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live animated hook preview */}
          <div className="relative">
            {/* "AI Generated" badge */}
            <div className="absolute -top-4 -right-2 sm:-right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-background text-xs font-bold shadow-lg rotate-3 flex items-center gap-1.5 z-10">
              <Sparkles className="h-3.5 w-3.5" />
              AI Generated
            </div>

            {/* Platform filter tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {exampleHooks.map((set, i) => (
                <button
                  key={set.platform}
                  onClick={() => { setActiveSet(i); setHookIndex(0); setFade(true); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    activeSet === i
                      ? `${set.color} ${set.bg} ${set.border}`
                      : 'text-muted-foreground border-border hover:border-muted-foreground/30'
                  )}
                >
                  {set.platform}
                </button>
              ))}
            </div>

            {/* Animated hook card */}
            <div
              className={cn(
                'transition-all duration-300',
                fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
            >
              <HookCard
                text={current.hooks[hookIndex]}
                platform={current.platform}
                color={current.color}
                bg={current.bg}
                border={current.border}
              />
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 justify-center mt-4">
              {current.hooks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setHookIndex(i); setFade(true); }}
                  className={cn(
                    'rounded-full transition-all duration-300 h-1.5',
                    i === hookIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-border'
                  )}
                />
              ))}
            </div>

            {/* Depth cards */}
            <div className="absolute -bottom-3 left-3 right-3 h-full rounded-2xl border border-border bg-card/30 -z-10" />
            <div className="absolute -bottom-6 left-6 right-6 h-full rounded-2xl border border-border bg-card/15 -z-20" />
          </div>
        </div>
      </div>
    </section>
  );
}
