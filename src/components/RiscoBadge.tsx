import { cn } from "@/lib/utils";
import type { RiscoNivel } from "@/lib/types";

export const riscoLabel: Record<RiscoNivel, string> = {
  seguro: "Em dia",
  atencao: "Vence em breve",
  critico: "Atrasado",
  blindado: "Blindado",
};

export const riscoRing: Record<RiscoNivel, string> = {
  seguro: "border-emerald-400/50",
  atencao: "border-amber-300/60",
  critico: "border-destructive/70 animate-pulse-danger",
  blindado: "border-gold/50",
};

export function RiscoBadge({ risco }: { risco: RiscoNivel }) {
  const styles: Record<RiscoNivel, string> = {
    seguro: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    atencao: "bg-amber-400/15 text-amber-200 border-amber-300/30",
    critico: "bg-destructive/20 text-red-300 border-destructive/40",
    blindado: "bg-gold/15 text-gold border-gold/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        styles[risco],
      )}
    >
      {riscoLabel[risco]}
    </span>
  );
}
