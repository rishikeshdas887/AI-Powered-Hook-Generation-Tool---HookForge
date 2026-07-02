'use client';

import { ArrowRight, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(38 92% 58%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(38 92% 58%) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-muted-foreground">
              AI-Powered Hook Generation
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Craft Viral Hooks
            <br className="hidden sm:block" />
            <span className="gradient-text">In Seconds, Not Hours</span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
            Stop staring at blank screens. Generate scroll-stopping hooks for your social media content with AI.
            Perfect for creators, marketers, and anyone who wants to capture attention instantly.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold px-8 h-12 text-lg hover:opacity-90 transition-opacity glow-amber-sm"
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
              className="border-border px-8 h-12 text-lg"
              asChild
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">5 Hooks</div>
                <div className="text-sm text-muted-foreground">Per Generation</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">10x Faster</div>
                <div className="text-sm text-muted-foreground">Than Writing</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">AI-Powered</div>
                <div className="text-sm text-muted-foreground">Smart Generation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
