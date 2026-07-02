import { createClient } from '@supabase/supabase-js';

// Server-side client using service role for admin operations
// For user auth in API routes, use the Bearer token from the request header
export const createServerClient = async () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};

// Verify a user JWT token and return the user
export const verifyUser = async (token: string) => {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user, error };
};
