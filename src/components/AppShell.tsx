import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  KanbanSquare,
  Store,
  Database,
  ChevronLeft,
  Menu,
  ShieldCheck,
  X,
  Users,
  Car,
  Files,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/esteira", label: "Esteira de Risco", icon: KanbanSquare },
  { to: "/lojistas", label: "Lojistas", icon: Store },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/documentos", label: "Cofre", icon: Files },
  { to: "/relatorios", label: "Relatórios", icon: PieChart },
  { to: "/central", label: "Central de Dados", icon: Database },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = (
    <nav className="flex flex-col gap-1 px-3">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-gold/60 bg-gold/10 text-gold"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-gold/10 bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 lg:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)]">
            <ShieldCheck className="h-5 w-5 text-[#0B0C10]" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="gold-text font-display text-sm font-bold leading-tight">AL Finanças</p>
              <p className="truncate text-[11px] text-muted-foreground">& Negócios</p>
            </div>
          )}
        </div>
        {items}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mt-auto m-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Recolher"}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="glass absolute inset-y-0 left-0 flex w-[264px] flex-col py-6">
            <div className="mb-4 flex items-center justify-between px-5">
              <p className="gold-text font-display text-sm font-bold">AL Finanças</p>
              <button onClick={() => setMobileOpen(false)} aria-label="Fechar">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {items}
          </aside>
        </div>
      )}

      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
        <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
