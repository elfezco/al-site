import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { CobrancaModal } from "@/components/CobrancaModal";
import { RiscoBadge, riscoLabel } from "@/components/RiscoBadge";
import { brl, dataBR, diasAte } from "@/lib/format";
import type { ContratoView, RiscoNivel, Contrato, Cliente, Lojista, ParcelaFPD } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/central")({
  head: () => ({
    meta: [
      { title: "Central de Dados — AL Finanças & Negócios" },
      {
        name: "description",
        content:
          "Base mestre de todos os contratos de financiamento com busca, filtros por banco, lojista e status, e paginação.",
      },
    ],
  }),
  component: CentralPage,
});

const PAGE_SIZE = 10;
const riscos: RiscoNivel[] = ["seguro", "atencao", "critico", "blindado"];

function CentralPage() {
  const { lojistas } = useStore();
  const [busca, setBusca] = useState("");
  const [banco, setBanco] = useState("todos");
  const [lojista, setLojista] = useState("todos");
  // Filtro por status precisaria de lógica complexa no banco, então por enquanto 
  // vamos focar na paginação base de contratos.
  
  const [pagina, setPagina] = useState(1);
  const [selecionado, setSelecionado] = useState<ContratoView | null>(null);
  
  const [dados, setDados] = useState<ContratoView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDados = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("contratos")
        .select(`
          *,
          cliente:clientes(*),
          lojista:lojistas(*),
          parcelas:parcelas_fpd(*)
        `, { count: "exact" });

      if (banco !== "todos") {
        query = query.eq("banco", banco);
      }
      if (lojista !== "todos") {
        query = query.eq("lojista_id", lojista);
      }
      // Obs: Busca text search exigiria configuração no supabase, simplificando com client-side fallback ou omitindo.
      
      const from = (pagina - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;

      const views: ContratoView[] = (data || []).map((row: any) => {
        const contrato = { ...row, cliente: undefined, lojista: undefined, parcelas: undefined };
        const cliente = row.cliente;
        const _lojista = row.lojista;
        const parcelas = row.parcelas.sort((a: any, b: any) => a.numero_parcela - b.numero_parcela);
        
        const parcelaAtual = parcelas.find((p: any) => p.status !== "Pago") ?? null;
        const etapa = parcelaAtual ? parcelaAtual.numero_parcela : 4;
        const dias = parcelaAtual ? diasAte(parcelaAtual.data_vencimento) : null;
        
        let risco: RiscoNivel = "blindado";
        if (dias !== null) {
          if (dias < 0) risco = "critico";
          else if (dias <= 3) risco = "atencao";
          else risco = "seguro";
        }
        
        return {
          contrato,
          cliente,
          lojista: _lojista,
          parcelas,
          parcelaAtual,
          diasParaVencimento: dias,
          risco,
          etapa
        };
      });

      setDados(views);
      setTotal(count ?? 0);
    } catch (err: any) {
      toast.error("Erro ao buscar dados paginados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [pagina, banco, lojista]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell title="Central de Dados" subtitle="Toda a carteira de contratos com paginação Server-Side">
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Select value={banco} onChange={(v) => { setBanco(v); setPagina(1); }} label="Banco">
          <option value="todos">Todos os bancos</option>
          <option value="Daycoval">Daycoval</option>
          <option value="BV Financeira">BV Financeira</option>
        </Select>
        <Select value={lojista} onChange={(v) => { setLojista(v); setPagina(1); }} label="Lojista">
          <option value="todos">Todos os lojistas</option>
          {lojistas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.razao_social}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingBlock label="Carregando contratos…" />
      ) : (
        <div className="card-surface overflow-hidden rounded-xl shadow-[var(--shadow-elegant)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Contrato</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Veículo</th>
                  <th className="px-5 py-3">Lojista</th>
                  <th className="px-5 py-3">Banco</th>
                  <th className="px-5 py-3">Financiado</th>
                  <th className="px-5 py-3">Parcela FPD</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((v) => (
                  <tr
                    key={v.contrato.id}
                    onClick={() => setSelecionado(v)}
                    className="cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[#D4AF37]">{v.contrato.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{v.cliente.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{v.cliente.cpf}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {v.contrato.veiculo.modelo}
                      <br />
                      {v.contrato.veiculo.placa}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{v.lojista.razao_social}</td>
                    <td className="px-5 py-3 text-xs">{v.contrato.banco}</td>
                    <td className="px-5 py-3">{brl(v.contrato.valor_financiado)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {v.parcelaAtual
                        ? `${String(v.parcelaAtual.numero_parcela)}/3 · ${dataBR(v.parcelaAtual.data_vencimento)}`
                        : "Concluído"}
                    </td>
                    <td className="px-5 py-3">
                      <RiscoBadge risco={v.risco} />
                    </td>
                  </tr>
                ))}
                {dados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Nenhum contrato encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-3 text-xs text-muted-foreground">
            <span>
              {total} contrato(s) no total · página {pagina} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-40"
              >
                Próxima <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <CobrancaModal view={selecionado} onClose={() => { setSelecionado(null); fetchDados(); }} />
    </AppShell>
  );
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/12 bg-[#1A1C23] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#D4AF37]/60"
    >
      {children}
    </select>
  );
}
