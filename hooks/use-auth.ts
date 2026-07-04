'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const supabaseRef = useRef(createBrowserClient());
  const supabase = supabaseRef.current;

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setState({ session, user: session?.user ?? null, loading: false, error: null });
        }
      } catch {
        if (mounted) setState({ session: null, user: null, loading: false, error: null });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setState({ session, user: session?.user ?? null, loading: false, error: null });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign in with email + password (for users who already have a password)
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return { success: false, error: error.message };
    }
    setState({ session: data.session, user: data.user, loading: false, error: null });
    return { success: true, error: null };
  }, [supabase]);

  // Create account OR update existing magic-link account with a real password.
  // Uses an Edge Function with service role — no email confirmation email needed.
  const setupPassword = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || 'Failed to set up account';
        setState((prev) => ({ ...prev, loading: false, error: msg }));
        return { success: false, error: msg };
      }

      // Set the session returned from the Edge Function
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        setState((prev) => ({ ...prev, loading: false, error: sessionError.message }));
        return { success: false, error: sessionError.message };
      }

      setState({ session: null, user: data.user, loading: false, error: null });
      return { success: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return { success: false, error: msg };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setState({ user: null, session: null, loading: false, error: null });
  }, [supabase]);

  return { ...state, signIn, setupPassword, signOut };
}
