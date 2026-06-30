'use client';

import { Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
  'Unlimited hook generations',
  'All 5 social platforms',
  'All 6 hook styles',
  'Save hooks to library',
  'Copy to clipboard',
  'No credit card required',
  'Fast AI-powered generation',
  'Always free',
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32 bg-background">
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">100% Free Forever</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Completely
            <span className="gradient-text"> Free</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No limits, no subscriptions, no credit card required. Generate unlimited hooks for free.
          </p>
        </div>

        {/* Single free plan */}
        <div className="max-w-lg mx-auto">
          <div className="relative rounded-2xl p-8 bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-2 border-amber-500/30">
            {/* Free badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-background text-sm font-semibold flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Free Forever
            </div>

            {/* Plan name */}
            <h3 className="font-heading text-2xl font-bold mb-2 text-center mt-2">
              HookForge Free
            </h3>

            {/* Price */}
            <div className="text-center mb-4">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>

            {/* Description */}
            <p className="text-center text-muted-foreground mb-6">
              Everything you need to create viral hooks
            </p>

            {/* CTA */}
            <Button
              className="w-full mb-8 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90"
              size="lg"
              asChild
            >
              <Link href="/login">Get Started Free</Link>
            </Button>

            {/* Features */}
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 mt-0.5">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
