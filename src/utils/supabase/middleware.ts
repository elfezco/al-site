import { createServerClient } from "@supabase/ssr";
// Importações Next.js omitidas para evitar quebra de Build no Vite
// import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env['VITE_SUPABASE_URL'] || (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = process.env['VITE_SUPABASE_ANON_KEY'] || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// No ecossistema Vite / TanStack Start, o middleware global é gerenciado por 
// hooks de roteamento (ex: `beforeLoad` no TanStack Router) em vez de um arquivo
// middleware.ts rodando na Edge. 
// A função abaixo é uma estrutura mock adaptada para não quebrar seu build atual.

export const createClient = (request: any) => {
  let supabaseResponse = {
    request: { headers: request?.headers || new Headers() },
    cookies: new Map(),
    next: () => {}
  };

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet) {
          // Lógica omitida para SSR Edge puro, pois o TanStack usa a Store e o BeforeLoad
        },
      },
    },
  );

  return supabaseResponse;
};
