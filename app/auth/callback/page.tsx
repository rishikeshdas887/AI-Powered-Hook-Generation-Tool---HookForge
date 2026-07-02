'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createBrowserClient();
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDesc = params.get('error_description');

        // Handle error from Supabase
        if (errorParam) {
          setError(errorDesc || errorParam);
          return;
        }

        if (!code) {
          // Check if there's a hash fragment (implicit flow)
          const hash = window.location.hash;
          if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                setError(sessionError.message);
                return;
              }

              router.push('/dashboard');
              return;
            }
          }

          setError('No authentication code found. Please try signing in again.');
          return;
        }

        // Exchange code for session (PKCE flow)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        router.push('/dashboard');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Authentication Failed</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-background font-semibold hover:opacity-90 transition-opacity"
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
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
