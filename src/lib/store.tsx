import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { diasAte } from "./format";
import type {
  Cliente,
  Contrato,
  ContratoView,
  Lojista,
  ParcelaFPD,
  RiscoNivel,
} from "./types";
import { supabase } from "./supabase";
import { toast } from "sonner";
import { useAuth } from "./auth-context";

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
  addLojista: (data: Omit<Lojista, "id">) => Promise<void>;
  marcarParcelaPaga: (parcelaId: string) => Promise<void>;
  criarContrato: (contrato: Omit<Contrato, "id" | "data_contrato">) => Promise<void>;
  carregarDados: () => Promise<void>;
  loading: boolean;
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

  // Lógica de Risco baseada nos dias para o vencimento
  let risco: RiscoNivel = "blindado";
  if (dias !== null) {
    if (dias < 0) risco = "critico";
    else if (dias <= 3) risco = "atencao";
    else risco = "seguro";
  }

  return { contrato, cliente, lojista, parcelas: own, parcelaAtual, diasParaVencimento: dias, risco, etapa };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lojistas, setLojistas] = useState<Lojista[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [parcelas, setParcelas] = useState<ParcelaFPD[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [lojRes, cliRes, conRes, parRes] = await Promise.all([
        supabase.from("lojistas").select("*"),
        supabase.from("clientes").select("*"),
        supabase.from("contratos").select("*"),
        supabase.from("parcelas_fpd").select("*"),
      ]);

      if (lojRes.error) throw lojRes.error;
      if (cliRes.error) throw cliRes.error;
      if (conRes.error) throw conRes.error;
      if (parRes.error) throw parRes.error;

      setLojistas(lojRes.data || []);
      setClientes(cliRes.data || []);
      setContratos(conRes.data || []);
      setParcelas(parRes.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao carregar os dados do servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [user]);

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
        volume: own.reduce((s, v) => s + Number(v.contrato.valor_financiado), 0),
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
      loading,
      carregarDados,
      addLojista: async (data) => {
        try {
          const { error } = await supabase.from("lojistas").insert(data);
          if (error) throw error;
          toast.success("Lojista adicionado com sucesso!");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao adicionar lojista.");
        }
      },
      marcarParcelaPaga: async (parcelaId) => {
        try {
          // Atualiza via API
          const { error } = await supabase
            .from("parcelas_fpd")
            .update({ status: "Pago" })
            .eq("id", parcelaId);

          if (error) throw error;
          
          // Otimista na UI local (ou apenas chamar carregarDados)
          setParcelas((prev) =>
            prev.map((p) => (p.id === parcelaId ? { ...p, status: "Pago" } : p)),
          );
          toast.success("Parcela atualizada para Paga!");
        } catch (error: any) {
          toast.error("Falha ao atualizar parcela.");
        }
      },
      criarContrato: async (dados) => {
        try {
          const hoje = new Date();
          const { data: contratoData, error: contratoErr } = await supabase
            .from("contratos")
            .insert({
              ...dados,
              data_contrato: hoje.toISOString().split("T")[0],
            })
            .select()
            .single();

          if (contratoErr || !contratoData) throw contratoErr;

          const vencimentos = [30, 60, 90].map((dias) => {
            const data = new Date(hoje);
            data.setDate(data.getDate() + dias);
            return data.toISOString().split("T")[0];
          });

          const parcelasData = vencimentos.map((vencimento, idx) => ({
            contrato_id: contratoData.id,
            numero_parcela: idx + 1,
            data_vencimento: vencimento,
            status: "Pendente",
          }));

          const { error: parcelasErr } = await supabase.from("parcelas_fpd").insert(parcelasData);
          if (parcelasErr) throw parcelasErr;

          toast.success("Contrato e parcelas FPD criados!");
          await carregarDados();
        } catch (error: any) {
          console.error(error);
          toast.error("Erro ao criar contrato.");
        }
      }
    };
  }, [lojistas, clientes, contratos, parcelas, loading]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}

export type { LojistaMetrics };
