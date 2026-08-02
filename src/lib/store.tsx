import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clientesSeed, contratosSeed, lojistasSeed, parcelasSeed } from "./mock-data";
import { diasAte } from "./format";
import type {
  Cliente,
  Contrato,
  ContratoView,
  Lojista,
  ParcelaFPD,
  RiscoNivel,
} from "./types";

interface LojistaMetrics extends Lojista {
  contratos: number;
  volume: number;
  inadimplentes: number;
  taxaInadimplencia: number;
}

interface StoreValue {
  lojistas: Lojista[];
  clientes: Cliente[];
  contratos: Contrato[];
  parcelas: ParcelaFPD[];
  views: ContratoView[];
  lojistaMetrics: LojistaMetrics[];
  addLojista: (data: Omit<Lojista, "id">) => void;
  marcarParcelaPaga: (parcelaId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function buildView(
  contrato: Contrato,
  clientes: Cliente[],
  lojistas: Lojista[],
  parcelas: ParcelaFPD[],
): ContratoView | null {
  const cliente = clientes.find((c) => c.id === contrato.cliente_id);
  const lojista = lojistas.find((l) => l.id === contrato.lojista_id);
  if (!cliente || !lojista) return null;

  const own = parcelas
    .filter((p) => p.contrato_id === contrato.id)
    .sort((a, b) => a.numero_parcela - b.numero_parcela);

  const parcelaAtual = own.find((p) => p.status !== "Pago") ?? null;
  const etapa: ContratoView["etapa"] = parcelaAtual ? parcelaAtual.numero_parcela : 4;
  const dias = parcelaAtual ? diasAte(parcelaAtual.data_vencimento) : null;

  let risco: RiscoNivel = "blindado";
  if (dias !== null) {
    if (dias < 0) risco = "critico";
    else if (dias <= 3) risco = "atencao";
    else risco = "seguro";
  }

  return { contrato, cliente, lojista, parcelas: own, parcelaAtual, diasParaVencimento: dias, risco, etapa };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lojistas, setLojistas] = useState<Lojista[]>(lojistasSeed);
  const [clientes] = useState<Cliente[]>(clientesSeed);
  const [contratos] = useState<Contrato[]>(contratosSeed);
  const [parcelas, setParcelas] = useState<ParcelaFPD[]>(parcelasSeed);

  const value = useMemo<StoreValue>(() => {
    const views = contratos
      .map((c) => buildView(c, clientes, lojistas, parcelas))
      .filter((v): v is ContratoView => v !== null);

    const lojistaMetrics: LojistaMetrics[] = lojistas.map((l) => {
      const own = views.filter((v) => v.lojista.id === l.id);
      const inadimplentes = own.filter((v) => v.risco === "critico").length;
      return {
        ...l,
        contratos: own.length,
        volume: own.reduce((s, v) => s + v.contrato.valor_financiado, 0),
        inadimplentes,
        taxaInadimplencia: own.length ? (inadimplentes / own.length) * 100 : 0,
      };
    });

    return {
      lojistas,
      clientes,
      contratos,
      parcelas,
      views,
      lojistaMetrics,
      addLojista: (data) =>
        setLojistas((prev) => [...prev, { ...data, id: `L${String(prev.length + 1)}${Date.now() % 1000}` }]),
      marcarParcelaPaga: (parcelaId) =>
        setParcelas((prev) =>
          prev.map((p) => (p.id === parcelaId ? { ...p, status: "Pago" } : p)),
        ),
    };
  }, [lojistas, clientes, contratos, parcelas]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}

export type { LojistaMetrics };
