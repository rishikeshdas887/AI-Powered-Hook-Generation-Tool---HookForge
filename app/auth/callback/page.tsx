'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error: authError } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );

        if (authError) {
          setError(authError.message);
          return;
        }

        router.push('/dashboard');
      } catch (err) {
        setError('Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <a
            href="/login"
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
