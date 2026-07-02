'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-orange-500/5 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-card border border-border p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Start Creating Today</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to Create Hooks That
              <span className="gradient-text"> Stop the Scroll?</span>
            </h2>

            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Join creators who are already using HookForge to craft compelling hooks.
              Start for free, no credit card required.
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold px-10 h-14 text-lg hover:opacity-90 transition-opacity glow-amber"
              asChild
            >
              <Link href="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
