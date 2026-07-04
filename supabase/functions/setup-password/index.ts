import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass email confirmation
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (existingUser) {
      // Update existing user's password (works for magic-link users too)
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true }
      );
      if (updateError) throw updateError;
    } else {
      // Create new user with email already confirmed
      const { error: createError } = await adminSupabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
      });
      if (createError) throw createError;
    }

    // Sign in to get the session (use anon client)
    const anonSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (signInError) throw signInError;

    return new Response(
      JSON.stringify({
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
        user: signInData.user,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
