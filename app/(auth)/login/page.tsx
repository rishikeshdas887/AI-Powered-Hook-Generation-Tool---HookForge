'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Zap, ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { signInWithMagicLink, loading, error: authError } = useAuth();
  const searchParams = useSearchParams();
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) setUrlError(decodeURIComponent(error));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    const result = await signInWithMagicLink(email);
    if (result.success) setSubmitted(true);
  };

  const displayError = urlError || authError;

  if (submitted) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a magic link to{' '}
            <span className="text-foreground font-medium">{email}</span>.{' '}
            Click the link to sign in.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive it? Check spam or{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Welcome to HookForge</h1>
        <p className="text-muted-foreground">
          Enter your email to sign in or create a free account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        {displayError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending magic link...
            </>
          ) : (
            'Continue with Email'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link href="#" className="text-foreground hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="#" className="text-foreground hover:underline">Privacy Policy</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">
              Hook<span className="gradient-text">Forge</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
