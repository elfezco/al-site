import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { CobrancaModal } from "@/components/CobrancaModal";
import { RiscoBadge, riscoLabel } from "@/components/RiscoBadge";
import { useStore } from "@/lib/store";
import { brl, dataBR } from "@/lib/format";
import type { ContratoView, RiscoNivel } from "@/lib/types";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/central")({
  head: () => ({
    meta: [
      { title: "Central de Dados — AL Finanças & Negócios" },
      {
        name: "description",
        content:
          "Base mestre de todos os contratos de financiamento com busca, filtros por banco, lojista e status, e paginação.",
      },
      { property: "og:title", content: "Central de Dados de Contratos" },
      {
        property: "og:description",
        content: "Todos os contratos em uma tabela filtrável — o substituto definitivo da planilha.",
      },
    ],
  }),
  component: CentralPage,
});

const PAGE_SIZE = 6;
const riscos: RiscoNivel[] = ["seguro", "atencao", "critico", "blindado"];

function CentralPage() {
  const { views, lojistas } = useStore();
  const loading = useSimulatedLoad();
  const [busca, setBusca] = useState("");
  const [banco, setBanco] = useState("todos");
  const [lojista, setLojista] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [selecionado, setSelecionado] = useState<ContratoView | null>(null);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return views.filter((v) => {
      if (banco !== "todos" && v.contrato.banco !== banco) return false;
      if (lojista !== "todos" && v.lojista.id !== lojista) return false;
      if (status !== "todos" && v.risco !== status) return false;
      if (!q) return true;
      return [
        v.cliente.nome,
        v.cliente.cpf,
        v.contrato.id,
        v.contrato.veiculo.placa,
        v.contrato.veiculo.modelo,
        v.lojista.razao_social,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [views, busca, banco, lojista, status]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhas = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  const reset = (fn: () => void) => {
    fn();
    setPagina(1);
  };

  return (
    <AppShell title="Central de Dados" subtitle="Toda a carteira de contratos em um só lugar">
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            maxLength={80}
            onChange={(e) => reset(() => setBusca(e.target.value))}
            placeholder="Buscar cliente, placa, CPF, contrato…"
            className="w-full rounded-lg border border-white/12 bg-surface/60 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gold/60"
          />
        </div>
        <Select value={banco} onChange={(v) => reset(() => setBanco(v))} label="Banco">
          <option value="todos">Todos os bancos</option>
          <option value="Daycoval">Daycoval</option>
          <option value="BV Financeira">BV Financeira</option>
        </Select>
        <Select value={lojista} onChange={(v) => reset(() => setLojista(v))} label="Lojista">
          <option value="todos">Todos os lojistas</option>
          {lojistas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.razao_social}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(v) => reset(() => setStatus(v))} label="Status">
          <option value="todos">Todos os status</option>
          {riscos.map((r) => (
            <option key={r} value={r}>
              {riscoLabel[r]}
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
                {linhas.map((v) => (
                  <tr
                    key={v.contrato.id}
                    onClick={() => setSelecionado(v)}
                    className="cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gold">{v.contrato.id}</td>
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
                {linhas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      Nenhum contrato encontrado com estes filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-3 text-xs text-muted-foreground">
            <span>
              {filtrados.length} contrato(s) · página {paginaAtual} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="inline-flex items-center gap-1 rounded-md border border-white/12 px-2.5 py-1.5 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40"
              >
                Próxima <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <CobrancaModal view={selecionado} onClose={() => setSelecionado(null)} />
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
      className="w-full rounded-lg border border-white/12 bg-surface/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold/60"
    >
      {children}
    </select>
  );
}
