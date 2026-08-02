import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";
import { diasAte } from "./format";
import type {
  Cliente,
  Contrato,
  ContratoView,
  Lojista,
  ParcelaFPD,
  RiscoNivel,
  Veiculo,
  Documento,
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
  veiculos: Veiculo[];
  documentos: Documento[];
  views: ContratoView[];
  lojistaMetrics: LojistaMetrics[];
  loading: boolean;
  carregarDados: () => Promise<void>;
  // Lojistas
  addLojista: (data: Omit<Lojista, "id">) => Promise<void>;
  // Clientes
  addCliente: (data: Omit<Cliente, "id">) => Promise<void>;
  editCliente: (id: string, data: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  // Veículos
  addVeiculo: (data: Omit<Veiculo, "id">) => Promise<void>;
  editVeiculo: (id: string, data: Partial<Veiculo>) => Promise<void>;
  deleteVeiculo: (id: string) => Promise<void>;
  // Contratos & Parcelas
  criarContrato: (contrato: Omit<Contrato, "id" | "data_contrato">) => Promise<void>;
  marcarParcelaPaga: (parcelaId: string) => Promise<void>;
  // Documentos
  addDocumento: (data: Omit<Documento, "id" | "created_at">) => Promise<void>;
  deleteDocumento: (id: string) => Promise<void>;
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
  const { user } = useAuth();
  const [lojistas, setLojistas] = useState<Lojista[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [parcelas, setParcelas] = useState<ParcelaFPD[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [lojRes, cliRes, conRes, parRes, veiRes, docRes] = await Promise.all([
        supabase.from("lojistas").select("*"),
        supabase.from("clientes").select("*"),
        supabase.from("contratos").select("*"),
        supabase.from("parcelas_fpd").select("*"),
        supabase.from("veiculos").select("*"),
        supabase.from("documentos").select("*"),
      ]);

      if (lojRes.error) throw lojRes.error;
      if (cliRes.error) throw cliRes.error;
      if (conRes.error) throw conRes.error;
      if (parRes.error) throw parRes.error;
      if (veiRes.error) throw veiRes.error;
      if (docRes.error) throw docRes.error;

      setLojistas(lojRes.data || []);
      setClientes(cliRes.data || []);
      setContratos(conRes.data || []);
      setParcelas(parRes.data || []);
      setVeiculos(veiRes.data || []);
      setDocumentos(docRes.data || []);
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
      veiculos,
      documentos,
      views,
      lojistaMetrics,
      loading,
      carregarDados,

      // === LOJISTAS ===
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

      // === CLIENTES ===
      addCliente: async (data) => {
        try {
          const { error } = await supabase.from("clientes").insert(data);
          if (error) throw error;
          toast.success("Cliente cadastrado com sucesso!");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao cadastrar cliente.");
        }
      },
      editCliente: async (id, data) => {
        try {
          const { error } = await supabase.from("clientes").update(data).eq("id", id);
          if (error) throw error;
          toast.success("Cliente atualizado!");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao atualizar cliente.");
        }
      },
      deleteCliente: async (id) => {
        try {
          const { error } = await supabase.from("clientes").delete().eq("id", id);
          if (error) throw error;
          toast.success("Cliente removido.");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao remover cliente.");
        }
      },

      // === VEÍCULOS ===
      addVeiculo: async (data) => {
        try {
          const { error } = await supabase.from("veiculos").insert(data);
          if (error) throw error;
          toast.success("Veículo cadastrado com sucesso!");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao cadastrar veículo.");
        }
      },
      editVeiculo: async (id, data) => {
        try {
          const { error } = await supabase.from("veiculos").update(data).eq("id", id);
          if (error) throw error;
          toast.success("Veículo atualizado!");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao atualizar veículo.");
        }
      },
      deleteVeiculo: async (id) => {
        try {
          const { error } = await supabase.from("veiculos").delete().eq("id", id);
          if (error) throw error;
          toast.success("Veículo removido.");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao remover veículo.");
        }
      },

      // === CONTRATOS ===
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
      },

      // === PARCELAS ===
      marcarParcelaPaga: async (parcelaId) => {
        try {
          const { error } = await supabase
            .from("parcelas_fpd")
            .update({ status: "Pago" })
            .eq("id", parcelaId);

          if (error) throw error;

          setParcelas((prev) =>
            prev.map((p) => (p.id === parcelaId ? { ...p, status: "Pago" } : p)),
          );
          toast.success("Parcela atualizada para Paga!");
        } catch (error: any) {
          toast.error("Falha ao atualizar parcela.");
        }
      },

      // === DOCUMENTOS ===
      addDocumento: async (data) => {
        try {
          const { error } = await supabase.from("documentos").insert(data);
          if (error) throw error;
          toast.success("Documento adicionado ao cofre!");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao adicionar documento.");
        }
      },
      deleteDocumento: async (id) => {
        try {
          const { error } = await supabase.from("documentos").delete().eq("id", id);
          if (error) throw error;
          toast.success("Documento removido.");
          await carregarDados();
        } catch (error: any) {
          toast.error("Erro ao remover documento.");
        }
      },
    };
  }, [lojistas, clientes, contratos, parcelas, veiculos, documentos, loading]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}

export type { LojistaMetrics };
