import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LoadingBlock } from "@/components/GoldSpinner";
import { useRouterState, useNavigate } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AL Finanças & Negócios — Intranet de Crédito Veicular" },
      { name: "description", content: "Intranet de gestão de contratos de financiamento veicular, lojistas parceiros e risco de FPD." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "AL Finanças & Negócios — Intranet" },
      { property: "og:description", content: "Gestão de contratos, lojistas e risco de FPD em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthBarrier({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouterState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && router.location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [user, loading, router.location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0C10]">
        <LoadingBlock label="Verificando autenticação..." />
      </div>
    );
  }

  // Prevent flashing protected content before redirect
  if (!user && router.location.pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <ErrorBoundary>
            <AuthBarrier>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </AuthBarrier>
          </ErrorBoundary>
        </StoreProvider>
        <Toaster position="top-right" theme="dark" toastOptions={{
          style: { background: "#0B0C10", border: "1px solid rgba(212, 175, 55, 0.3)", color: "white" }
        }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
