import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { Store, Megaphone, MapPin, MessageCircle, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing B2B — AL Finanças" },
      { name: "description", content: "CRM e reativação de lojistas." },
    ],
  }),
  component: MarketingPage,
});

function MarketingPage() {
  const { lojistaMetrics, loading } = useStore();
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "inativos" | "ativos">("todos");
  const [busca, setBusca] = useState("");

  const lojistasFiltrados = lojistaMetrics.filter((l) => {
    const inativo = l.contratos < 2;
    if (filtroStatus === "inativos" && !inativo) return false;
    if (filtroStatus === "ativos" && inativo) return false;
    
    if (busca) {
      const b = busca.toLowerCase();
      return (
        l.razao_social.toLowerCase().includes(b) ||
        (l.endereco || "").toLowerCase().includes(b)
      );
    }
    return true;
  }).sort((a, b) => a.contratos - b.contratos); 

  const handleWhatsAppMarketing = (l: any) => {
    const msg = `Olá ${l.socio_nome || 'Parceiro'}, tudo bem? Aqui é da AL Finanças! Notamos que faz um tempo que não recebemos propostas da sua loja. Temos condições especiais para o banco Daycoval essa semana, quer dar uma olhada na tabela?`;
    const num = l.contato_whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success("Script de Marketing gerado!");
  };

  return (
    <AppShell title="Marketing B2B" subtitle="Relacionamento, Captação e Reativação de Lojistas">
      <div className="flex h-full flex-col space-y-6">
        
        {/* KPIs */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass rounded-xl p-6 border-l-4 border-gold">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-gold" /> Total da Base Alvo
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-gold">
              {lojistaMetrics.length} Lojistas
            </p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-destructive">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Lojistas Inativos
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-destructive">
              {lojistaMetrics.filter(l => l.contratos < 2).length} Lojas
            </p>
          </div>
          <div className="glass rounded-xl p-6 bg-[linear-gradient(135deg,#FADB5F/10,#B8860B/10)]">
            <p className="text-sm text-gold flex items-center gap-2">
              <Store className="h-4 w-4 text-gold" /> Ação Imediata
            </p>
            <button className="mt-4 w-full rounded-lg bg-gold/20 hover:bg-gold/30 text-gold px-4 py-2 font-semibold text-sm transition-colors border border-gold/40">
              Disparar SMS em Massa
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass rounded-xl p-4">
          <div className="relative w-full max-w-sm">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou região (ex: Centro)..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroStatus("todos")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${filtroStatus === "todos" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-muted-foreground hover:bg-white/5"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroStatus("inativos")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${filtroStatus === "inativos" ? "bg-destructive/20 border-destructive/30 text-destructive" : "border-transparent text-muted-foreground hover:bg-white/5"}`}
            >
              Inativos (Para Reativar)
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="glass rounded-xl overflow-hidden flex-1">
          {loading ? (
            <LoadingBlock label="Carregando funil de relacionamento..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-muted-foreground">
                    <th className="p-4 font-medium">Razão Social</th>
                    <th className="p-4 font-medium">Sócio / Contato</th>
                    <th className="p-4 font-medium">Endereço (Região)</th>
                    <th className="p-4 font-medium">Volume Produzido</th>
                    <th className="p-4 font-medium">Ação (Relacionamento)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lojistasFiltrados.map((l) => {
                    const inativo = l.contratos < 2;
                    return (
                      <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-semibold">{l.razao_social}</div>
                          {inativo && <span className="inline-block mt-1 bg-destructive/20 text-destructive text-[10px] px-2 py-0.5 rounded-full">Risco de Evasão</span>}
                        </td>
                        <td className="p-4">
                          <div className="text-white">{l.socio_nome || 'Não informado'}</div>
                          <div className="text-xs text-muted-foreground">{l.contato_whatsapp}</div>
                        </td>
                        <td className="p-4 text-muted-foreground">{l.endereco || 'Endereço não cadastrado'}</td>
                        <td className="p-4 font-medium text-gold">
                          {l.contratos} Fichas
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleWhatsAppMarketing(l)}
                            className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/30"
                            title="Chamar para Negociar"
                          >
                            <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Reativar Venda</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {lojistasFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Nenhum lojista encontrado para a busca atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
