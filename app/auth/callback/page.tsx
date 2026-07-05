'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createBrowserClient();

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDesc = params.get('error_description');

        if (errorParam) {
          setError(errorDesc || errorParam);
          return;
        }

        // Handle hash-based implicit flow (older OAuth flow)
        const hash = window.location.hash;
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let providerToken: string | null = null;
        let providerRefreshToken: string | null = null;

        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
          providerToken = hashParams.get('provider_token');
          providerRefreshToken = hashParams.get('provider_refresh_token');
        }

        // PKCE flow: exchange code for session
        if (!accessToken && code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
          // After exchange, get the session to access provider_token
          const { data: { session } } = await supabase.auth.getSession();
          accessToken = session?.access_token ?? null;
          refreshToken = session?.refresh_token ?? null;
          providerToken = session?.provider_token ?? null;
          providerRefreshToken = session?.provider_refresh_token ?? null;
        }

        if (!accessToken) {
          setError('No authentication token found. Please try signing in again.');
          return;
        }

        // Set session if we have tokens from implicit flow
        if (!code && accessToken && refreshToken) {
          const { error: sessErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessErr) {
            setError(sessErr.message);
            return;
          }
        }

        // Store OAuth provider tokens (Google) for API access if present
        if (providerToken) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Use service role via API route to store the token
              await fetch('/api/oauth/store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider_token: providerToken,
                  provider_refresh_token: providerRefreshToken,
                  provider: 'google',
                }),
              });
            }
          } catch {
            // Non-critical - continue even if token storage fails
            console.warn('Could not store provider token');
          }
        }

        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 800);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Authentication Failed</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {success ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-foreground font-medium">Signed in successfully!</p>
            <p className="text-muted-foreground text-sm">Redirecting to dashboard...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
            <p className="text-muted-foreground">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
