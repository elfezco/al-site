import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Banknote, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { RiscoBadge } from "@/components/RiscoBadge";
import { useStore } from "@/lib/store";
import { brl, dataBR } from "@/lib/format";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AL Finanças & Negócios" },
      {
        name: "description",
        content:
          "Visão executiva do volume financiado, lojistas ativos e alertas de FPD (First Payment Default).",
      },
      { property: "og:title", content: "Dashboard executivo — AL Finanças & Negócios" },
      {
        property: "og:description",
        content: "Volume financiado, lojistas ativos e alertas de inadimplência nas 3 primeiras parcelas.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { views, lojistas } = useStore();
  const loading = useSimulatedLoad();

  const stats = useMemo(() => {
    const volume = views.reduce((s, v) => s + v.contrato.valor_financiado, 0);
    const fpd = views.filter((v) => v.risco === "critico").length;
    const blindados = views.filter((v) => v.risco === "blindado").length;
    const porBanco = ["Daycoval", "BV Financeira"].map((banco) => ({
      banco,
      volume: views
        .filter((v) => v.contrato.banco === banco)
        .reduce((s, v) => s + v.contrato.valor_financiado, 0),
    }));
    return { volume, fpd, blindados, porBanco };
  }, [views]);

  const criticos = views
    .filter((v) => v.risco === "critico" || v.risco === "atencao")
    .sort((a, b) => (a.diasParaVencimento ?? 0) - (b.diasParaVencimento ?? 0));

  return (
    <AppShell title="Dashboard Executivo" subtitle="Panorama da carteira e do risco de FPD">
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Banknote className="h-5 w-5" />}
              label="Volume total financiado"
              value={brl(stats.volume)}
              hint={`${String(views.length)} contratos ativos`}
            />
            <StatCard
              icon={<Store className="h-5 w-5" />}
              label="Lojistas parceiros"
              value={String(lojistas.length)}
              hint="Parceiros originando contratos"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Alerta FPD"
              value={String(stats.fpd)}
              hint="Parcelas 1–3 em atraso"
              danger
            />
            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Contratos blindados"
              value={String(stats.blindados)}
              hint="3 parcelas quitadas"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <section className="card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] lg:col-span-3">
              <header className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold" />
                <h2 className="font-display text-sm font-semibold">Volume por banco</h2>
              </header>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.porBanco}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="banco" stroke="currentColor" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis
                      stroke="currentColor"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(v: number) => `${String(Math.round(v / 1000))}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1F2833",
                        border: "1px solid rgba(212,175,55,0.35)",
                        borderRadius: 10,
                        color: "#fff",
                      }}
                      formatter={(v: number) => [brl(v), "Volume"]}
                    />
                    <Bar dataKey="volume" radius={[8, 8, 0, 0]} barSize={70}>
                      {stats.porBanco.map((d) => (
                        <Cell key={d.banco} fill={d.banco === "Daycoval" ? "#FADB5F" : "#B8860B"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] lg:col-span-2">
              <h2 className="font-display mb-4 text-sm font-semibold">Prioridades de cobrança</h2>
              <ul className="space-y-3">
                {criticos.slice(0, 6).map((v) => (
                  <li key={v.contrato.id} className="rounded-lg border border-white/8 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{v.cliente.nome}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {v.contrato.banco} · parcela {v.parcelaAtual?.numero_parcela ?? "—"}/3 ·{" "}
                          {v.parcelaAtual ? dataBR(v.parcelaAtual.data_vencimento) : "—"}
                        </p>
                      </div>
                      <RiscoBadge risco={v.risco} />
                    </div>
                  </li>
                ))}
                {criticos.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nenhuma pendência crítica no momento.</li>
                )}
              </ul>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <article
      className={
        "card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] transition-colors " +
        (danger ? "border-destructive/40" : "hover:border-gold/30")
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={danger ? "text-destructive" : "text-gold"}>{icon}</span>
      </div>
      <p className={"mt-3 font-display text-2xl font-bold " + (danger ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </article>
  );
}
