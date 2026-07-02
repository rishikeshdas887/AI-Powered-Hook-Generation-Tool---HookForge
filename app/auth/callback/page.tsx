'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );

        if (error) {
          console.error('Auth error:', error);
          router.push('/login?error=' + encodeURIComponent(error.message));
          return;
        }

        // Get redirect path or default to dashboard
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      } catch (err) {
        console.error('Auth callback error:', err);
        router.push('/login?error=' + encodeURIComponent('Authentication failed'));
      }
    };

    handleCallback();
  }, [router, supabase.auth, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
