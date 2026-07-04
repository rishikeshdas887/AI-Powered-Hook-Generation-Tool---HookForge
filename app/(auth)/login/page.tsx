'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, setupPassword, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signin') {
      const result = await signIn(email.trim(), password);
      if (result.success) {
        router.push('/dashboard');
      }
    } else {
      // setupPassword works for both new users AND existing magic-link users.
      // The Edge Function uses admin privileges — no email confirmation email sent.
      const result = await setupPassword(email.trim(), password);
      if (result.success) {
        router.push('/dashboard');
      }
    }
  };

  const passwordStrength =
    password.length >= 12 ? 'strong' :
    password.length >= 8  ? 'medium' :
    password.length > 0   ? 'weak'   : null;

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setPassword('');
  };

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex rounded-xl bg-secondary/60 p-1 mb-6 gap-1">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              mode === m
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {m === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
              required
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'signup' ? 'Create a password (8+ chars)' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
              required
              minLength={mode === 'signup' ? 8 : 1}
              disabled={loading}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength bar — sign-up only */}
          {mode === 'signup' && password.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {(['weak', 'medium', 'strong'] as const).map((level, i) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-200',
                    passwordStrength === 'weak'   && i === 0 && 'bg-red-500',
                    passwordStrength === 'medium' && i <= 1  && 'bg-amber-400',
                    passwordStrength === 'strong'             && 'bg-green-500',
                    !( (passwordStrength === 'weak' && i === 0) ||
                       (passwordStrength === 'medium' && i <= 1) ||
                       (passwordStrength === 'strong') ) && 'bg-border'
                  )}
                />
              ))}
              <span className={cn(
                'text-xs w-12 text-right',
                passwordStrength === 'weak'   && 'text-red-500',
                passwordStrength === 'medium' && 'text-amber-400',
                passwordStrength === 'strong' && 'text-green-500',
              )}>
                {passwordStrength}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {error === 'Invalid login credentials'
                ? <>Wrong email or password.{' '}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => switchMode('signup')}
                    >
                      Use Create Account to set a new password.
                    </button>
                  </>
                : error}
            </span>
          </div>
        )}

        {/* Hint for sign-up */}
        {mode === 'signup' && (
          <p className="text-xs text-muted-foreground bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
            If you previously used a magic link, enter your email here with a new password to link your account.
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Setting up account...'}
            </>
          ) : (
            mode === 'signin' ? 'Sign In' : 'Create Account'
          )}
        </Button>

        {/* Switch mode */}
        <p className="text-center text-xs text-muted-foreground">
          {mode === 'signin' ? (
            <>No account yet?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                Create one free
              </button>
            </>
          ) : (
            <>Already have a password?{' '}
              <button type="button" onClick={() => switchMode('signin')} className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </form>

      <div className="mt-5 pt-5 border-t border-border">
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{' '}
          <Link href="#" className="hover:underline">Terms</Link>
          {' '}&{' '}
          <Link href="#" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
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
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg">
              <Zap className="h-7 w-7 text-background" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Welcome to HookForge</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate viral hooks with AI</p>
          </div>

          {/* Auth card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
              </div>
            }>
              <AuthForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
