import { createClient } from "@supabase/supabase-js";

// Server-only. Never import this file into a client component.
// The service role key bypasses RLS — that is why it lives here,
// and why this file must never reach the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);