import { createBrowserClient } from "@supabase/ssr";

// Valores públicos do Supabase (Anon Key é projetada para ser pública no client-side).
// As variáveis de ambiente sobrescrevem os defaults quando disponíveis.
const SUPABASE_URL = "https://amdslwktgvdbdugdpkmj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CW4NhDJ8hJEislFlF5fjzQ__RozJyMT";

export const createClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);


