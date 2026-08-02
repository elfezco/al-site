import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Car, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { CobrancaModal } from "@/components/CobrancaModal";
import { riscoRing } from "@/components/RiscoBadge";
import { useStore } from "@/lib/store";
import { brl, dataBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContratoView } from "@/lib/types";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/esteira")({
  head: () => ({
    meta: [
      { title: "Esteira de Risco FPD — AL Finanças & Negócios" },
      {
        name: "description",
        content:
          "Kanban de acompanhamento das 3 primeiras parcelas de cada contrato para evitar estorno de comissão.",
      },
      { property: "og:title", content: "Esteira de Risco FPD" },
      {
        property: "og:description",
        content: "Acompanhe parcela 1, 2 e 3 de cada contrato até o status blindado.",
      },
    ],
  }),
  component: EsteiraPage,
});

const colunas = [
  { etapa: 1, titulo: "Aguardando 1ª Parcela" },
  { etapa: 2, titulo: "Aguardando 2ª Parcela" },
  { etapa: 3, titulo: "Aguardando 3ª Parcela" },
  { etapa: 4, titulo: "Blindado (Sucesso)" },
] as const;

function EsteiraPage() {
  const { views } = useStore();
  const loading = useSimulatedLoad();
  const [selecionado, setSelecionado] = useState<ContratoView | null>(null);

  return (
    <AppShell
      title="Esteira de Risco (FPD)"
      subtitle="Controle das 3 primeiras parcelas — evite o estorno de comissão"
    >
      {loading ? (
        <LoadingBlock label="Montando a esteira…" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {colunas.map((col) => {
            const cards = views.filter((v) => v.etapa === col.etapa);
            return (
              <section key={col.etapa} className="rounded-xl border border-white/8 bg-surface/40 p-3">
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.titulo}
                  </h2>
                  <span className="rounded-full border border-gold/30 px-2 text-[11px] text-gold">
                    {cards.length}
                  </span>
                </header>
                <div className="space-y-3">
                  {cards.map((v) => (
                    <button
                      key={v.contrato.id}
                      onClick={() => setSelecionado(v)}
                      className={cn(
                        "w-full rounded-xl border-2 bg-surface-2/70 p-3 text-left transition-transform hover:-translate-y-0.5",
                        riscoRing[v.risco],
                      )}
                    >
                      <p className="truncate text-sm font-semibold">{v.cliente.nome}</p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                        <Car className="h-3.5 w-3.5" /> {v.contrato.veiculo.modelo}
                      </p>
                      <p className="mt-2 text-xs text-gold">{brl(v.contrato.valor_financiado)}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {v.parcelaAtual ? (
                          <>
                            <CalendarClock className="h-3.5 w-3.5" />
                            {dataBR(v.parcelaAtual.data_vencimento)} ·{" "}
                            {v.diasParaVencimento !== null && v.diasParaVencimento < 0
                              ? `${String(Math.abs(v.diasParaVencimento))}d em atraso`
                              : `em ${String(v.diasParaVencimento ?? 0)}d`}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> 3 parcelas quitadas
                          </>
                        )}
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {v.contrato.banco} · {v.lojista.razao_social}
                      </p>
                    </button>
                  ))}
                  {cards.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                      Nenhum contrato nesta etapa
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <CobrancaModal view={selecionado} onClose={() => setSelecionado(null)} />
    </AppShell>
  );
}
