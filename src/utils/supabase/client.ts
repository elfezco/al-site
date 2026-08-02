import { createBrowserClient } from "@supabase/ssr";

function getEnv(key: string): string {
  // 1. Vite client-side (build-time replacement)
  try {
    const val = (import.meta as any).env?.[key];
    if (val) return val;
  } catch {
    // import.meta may not exist in SSR
  }
  // 2. Node.js server-side (Vercel Functions runtime)
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key] as string;
  }
  return "";
}

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseKey = getEnv("VITE_SUPABASE_ANON_KEY");

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    // Return a no-op proxy during SSR when env vars are missing,
    // instead of crashing the entire server.
    console.warn(
      "[Supabase] URL or Key not found. Returning stub client for SSR."
    );
    return new Proxy({} as any, {
      get: (_target, prop) => {
        if (prop === "auth") {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: async () => ({ data: null, error: { message: "Supabase not configured" } }),
            signOut: async () => ({}),
          };
        }
        if (prop === "from") {
          return () => ({
            select: () => ({ eq: () => ({ eq: () => ({ range: () => ({ order: () => ({ data: [], count: 0, error: null }) }) }) }) }),
          });
        }
        return () => {};
      },
    });
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};

