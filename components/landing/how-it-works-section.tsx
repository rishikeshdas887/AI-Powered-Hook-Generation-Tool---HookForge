'use client';

import { PenLine, Sparkles, Check, Copy } from 'lucide-react';

const steps = [
  {
    icon: PenLine,
    step: '01',
    title: 'Enter Your Topic',
    description: 'Tell us what your content is about. Be as specific or broad as you like.',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'AI Generates Hooks',
    description: 'Our AI analyzes your input and crafts 5 unique, attention-grabbing hooks.',
    color: 'from-orange-400 to-red-500',
  },
  {
    icon: Check,
    step: '03',
    title: 'Pick Your Favorite',
    description: 'Review the options and select the hook that resonates with your audience.',
    color: 'from-red-400 to-pink-500',
  },
  {
    icon: Copy,
    step: '04',
    title: 'Copy & Create',
    description: 'One click copies it to your clipboard. Start creating content that converts.',
    color: 'from-pink-400 to-rose-500',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-secondary/30">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(38 92% 58%) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            From Idea to Hook in
            <span className="gradient-text"> Four Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No complicated setup. No learning curve. Just results.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="relative p-6 rounded-2xl bg-card border border-border">
                {/* Step number */}
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-background border border-border text-xs font-semibold text-muted-foreground">
                  {step.step}
                </div>

                {/* Icon */}
                <div className={`mt-4 mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${step.color}`}>
                  <step.icon className="h-8 w-8 text-background" />
                </div>

                {/* Content */}
                <h3 className="font-heading text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
