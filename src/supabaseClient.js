import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // ponytail: keepalive lets the debounced save-on-unload finish even if the tab is
  // already navigating away/reloading — a plain fetch gets cancelled mid-flight otherwise
  global: { fetch: (url, options) => fetch(url, { ...options, keepalive: true }) },
});
