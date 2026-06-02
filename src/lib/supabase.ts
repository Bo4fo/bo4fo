import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,      // keep the session in localStorage across reloads
    autoRefreshToken: true,    // silently refresh the access token before it expires
    detectSessionInUrl: true,
  },
});
