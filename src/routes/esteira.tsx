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
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

export const Route = createFileRoute("/esteira")({
  head: () => ({
    meta: [
      { title: "Esteira de Risco FPD — AL Finanças & Negócios" },
      {
        name: "description",
        content:
          "Kanban de acompanhamento das 3 primeiras parcelas de cada contrato para evitar estorno de comissão.",
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

function DraggableCard({ v, onClick }: { v: ContratoView; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: v.contrato.id,
    data: v,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 bg-[#1A1C23] p-3 text-left transition-transform cursor-grab active:cursor-grabbing hover:-translate-y-0.5",
        riscoRing[v.risco]
      )}
    >
      <p className="truncate text-sm font-semibold">{v.cliente.nome}</p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
        <Car className="h-3.5 w-3.5" /> {v.contrato.veiculo.modelo}
      </p>
      <p className="mt-2 text-xs text-[#D4AF37]">{brl(Number(v.contrato.valor_financiado))}</p>
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
            <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" /> 3 parcelas quitadas
          </>
        )}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        {v.contrato.banco} · {v.lojista.razao_social}
      </p>
    </div>
  );
}

function DroppableColumn({
  coluna,
  cards,
  onCardClick,
}: {
  coluna: typeof colunas[number];
  cards: ContratoView[];
  onCardClick: (v: ContratoView) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${coluna.etapa}`,
    data: { etapa: coluna.etapa },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-xl border p-3 transition-colors",
        isOver ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-white/8 bg-[#111218]/80"
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {coluna.titulo}
        </h2>
        <span className="rounded-full border border-[#D4AF37]/30 px-2 text-[11px] text-[#D4AF37]">
          {cards.length}
        </span>
      </header>
      <div className="space-y-3 min-h-[150px]">
        {cards.map((v) => (
          <DraggableCard key={v.contrato.id} v={v} onClick={() => onCardClick(v)} />
        ))}
        {cards.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            Nenhum contrato nesta etapa
          </p>
        )}
      </div>
    </section>
  );
}

function EsteiraPage() {
  const { views, loading, marcarParcelaPaga } = useStore();
  const [selecionado, setSelecionado] = useState<ContratoView | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const view = active.data.current as ContratoView;
    const toEtapa = over.data.current?.etapa;

    if (view && toEtapa && toEtapa > view.etapa && view.parcelaAtual) {
      if (toEtapa === view.etapa + 1) {
        // Marcando a parcela atual como paga
        await marcarParcelaPaga(view.parcelaAtual.id);
      } else {
        toast.error("Você só pode avançar uma etapa por vez.");
      }
    }
  };

  return (
    <AppShell
      title="Esteira de Risco (FPD)"
      subtitle="Controle das 3 primeiras parcelas — evite o estorno de comissão"
    >
      {loading ? (
        <LoadingBlock label="Carregando contratos e parcelas..." />
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid gap-4 lg:grid-cols-4 select-none">
            {colunas.map((col) => {
              const cards = views.filter((v) => v.etapa === col.etapa);
              return (
                <DroppableColumn
                  key={col.etapa}
                  coluna={col}
                  cards={cards}
                  onCardClick={setSelecionado}
                />
              );
            })}
          </div>
        </DndContext>
      )}
      <CobrancaModal view={selecionado} onClose={() => setSelecionado(null)} />
    </AppShell>
  );
}
