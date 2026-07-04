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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setState({ session, user: session?.user ?? null, loading: false, error: null });
        }
      } catch {
        if (mounted) {
          setState({ session: null, user: null, loading: false, error: null });
        }
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

  // Step 1: Send OTP code to email (no redirect needed)
  const sendOtp = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }
      setState((prev) => ({ ...prev, loading: false }));
      return { success: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send code';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return { success: false, error: msg };
    }
  }, [supabase]);

  // Step 2: Verify the 6-digit code
  const verifyOtp = useCallback(async (email: string, token: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }
      setState({
        session: data.session,
        user: data.user,
        loading: false,
        error: null,
      });
      return { success: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return { success: false, error: msg };
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await supabase.auth.signOut();
      setState({ user: null, session: null, loading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to sign out' }));
    }
  }, [supabase]);

  return { ...state, sendOtp, verifyOtp, signOut };
}
