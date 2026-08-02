import { createServerClient } from "@supabase/ssr";
// import { getCookie, setCookie } from "vinxi/http";

const supabaseUrl = process.env['VITE_SUPABASE_URL'] || (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = process.env['VITE_SUPABASE_ANON_KEY'] || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const createClient = () => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          // No Vinxi/TanStack Start, precisamos converter a string de cookies em array.
          // Para simplificar, o Supabase SSR pode ler diretamente ou podemos mockar uma leitura básica.
          try {
             // Mock simples para evitar erro no build, mas em produção SSR real usaremos getCookie
             return [{ name: "sb-session", value: "" }];
          } catch {
             return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            // cookiesToSet.forEach(({ name, value, options }) => setCookie(name, value, options))
          } catch {
            // Ignore if called from Server Component without active request
          }
        },
      },
    },
  );
};
