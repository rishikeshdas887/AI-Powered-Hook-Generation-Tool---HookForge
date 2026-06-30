'use client';

import { Wand2, Target, Library, RefreshCw, Copy, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Wand2,
    title: 'AI-Powered Generation',
    description: 'Our AI analyzes your topic and generates hooks that are proven to capture attention and drive engagement.',
  },
  {
    icon: Target,
    title: 'Platform-Specific Hooks',
    description: 'Get hooks tailored for TikTok, Instagram, YouTube, Twitter/X, and LinkedIn. Each platform has its own style.',
  },
  {
    icon: Library,
    title: 'Save & Organize',
    description: 'Build your personal hook library. Save your favorites and organize them for future content.',
  },
  {
    icon: RefreshCw,
    title: 'Unlimited Regeneration',
    description: 'Not loving the results? Generate again with one click. Find the perfect hook every time.',
  },
  {
    icon: Copy,
    title: 'One-Click Copy',
    description: 'Copy any hook to your clipboard instantly. Paste right into your scripts or captions.',
  },
  {
    icon: Sparkles,
    title: 'Multiple Styles',
    description: 'Choose from curiosity, controversy, storytelling, and more hook styles to match your brand.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-background">
      {/* Section divider gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to
            <span className="gradient-text"> Stand Out</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed to help you create content that stops the scroll and drives real engagement.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-amber-500/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-colors">
                <feature.icon className="h-7 w-7 text-amber-400" />
              </div>

              {/* Content */}
              <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
