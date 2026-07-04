'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

// Google logo SVG (exact brand colors)
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const { signIn, setupPassword, signInWithGoogle, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      const result = await signIn(email.trim(), password);
      if (result.success) router.push('/dashboard');
    } else {
      const result = await setupPassword(email.trim(), password);
      if (result.success) router.push('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    await signInWithGoogle();
    // Browser navigates away — no need to reset
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setPassword('');
  };

  const passwordStrength =
    password.length >= 12 ? 'strong' :
    password.length >= 8  ? 'medium' :
    password.length > 0   ? 'weak'   : null;

  return (
    <div>
      {/* Google OAuth button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 flex items-center justify-center gap-3 border-border hover:bg-secondary/60 transition-colors mb-4 font-medium"
        onClick={handleGoogleSignIn}
        disabled={oauthLoading || loading}
      >
        {oauthLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleLogo size={18} />
        )}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground">or continue with email</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl bg-secondary/60 p-1 mb-5 gap-1">
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

          {/* Strength bar */}
          {mode === 'signup' && password.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {(['weak', 'medium', 'strong'] as const).map((level, i) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-200',
                    passwordStrength === 'weak'   && i === 0 ? 'bg-red-500'    : '',
                    passwordStrength === 'medium' && i <= 1  ? 'bg-amber-400'  : '',
                    passwordStrength === 'strong'             ? 'bg-green-500'  : '',
                    !( (passwordStrength === 'weak' && i === 0) ||
                       (passwordStrength === 'medium' && i <= 1) ||
                        passwordStrength === 'strong' ) ? 'bg-border' : ''
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
              {error === 'Invalid login credentials' ? (
                <>Wrong email or password.{' '}
                  <button type="button" className="underline" onClick={() => switchMode('signup')}>
                    Use Create Account to set a new password.
                  </button>
                </>
              ) : error}
            </span>
          </div>
        )}

        {/* Existing magic-link user note */}
        {mode === 'signup' && (
          <p className="text-xs text-muted-foreground bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
            Previously used a magic link? Enter your email here with a new password to link your account.
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Setting up account...'}
            </>
          ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {mode === 'signin' ? (
            <>No account?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                Create one free
              </button>
            </>
          ) : (
            <>Have a password?{' '}
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
          <Link href="#" className="hover:underline">Terms</Link>{' '}&{' '}
          <Link href="#" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
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
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg">
              <Zap className="h-7 w-7 text-background" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Welcome to HookForge</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate viral hooks with AI</p>
          </div>

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
