import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  if (supabaseAdmin) return supabaseAdmin;
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return supabaseAdmin;
}
