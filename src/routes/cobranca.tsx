import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { AlertTriangle, MessageCircle, PhoneCall, ShieldAlert, CheckCircle2, Search } from "lucide-react";
import { useState } from "react";
import { maskMoney } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/cobranca")({
  head: () => ({
    meta: [
      { title: "Hub de Cobrança FPD — AL Finanças & Negócios" },
      { name: "description", content: "Prevenção de FPD e gestão de inadimplência." },
    ],
  }),
  component: CobrancaPage,
});

function CobrancaPage() {
  const { views, loading, marcarParcelaPaga } = useStore();
  const [busca, setBusca] = useState("");
  const [filtroRisco, setFiltroRisco] = useState<"todos" | "critico" | "atencao">("todos");

  const viewsFiltradas = views.filter((v) => {
    if (v.etapa === 4) return false; // Totalmente pago
    
    if (filtroRisco !== "todos" && v.risco !== filtroRisco) return false;
    
    if (busca) {
      const b = busca.toLowerCase();
      return (
        v.cliente.nome.toLowerCase().includes(b) ||
        v.cliente.cpf.includes(b) ||
        v.lojista.razao_social.toLowerCase().includes(b)
      );
    }
    return true;
  }).sort((a, b) => {
    // Ordenar Críticos primeiro
    if (a.risco === 'critico' && b.risco !== 'critico') return -1;
    if (a.risco !== 'critico' && b.risco === 'critico') return 1;
    return (a.diasParaVencimento ?? 0) - (b.diasParaVencimento ?? 0);
  });

  const totalCritico = views.filter(v => v.risco === 'critico').reduce((acc, curr) => acc + (curr.parcelaAtual?.valor_boleto || curr.contrato.valor_parcela), 0);
  const totalAtencao = views.filter(v => v.risco === 'atencao').reduce((acc, curr) => acc + (curr.parcelaAtual?.valor_boleto || curr.contrato.valor_parcela), 0);

  const handleWhatsApp = (v: any) => {
    const p = v.parcelaAtual;
    const msg = `Olá ${v.cliente.nome}, tudo bem? Aqui é da AL Finanças. Lembramos que a sua ${p.numero_parcela}ª parcela do ${v.contrato.veiculo?.modelo} vence dia ${new Date(p.data_vencimento).toLocaleDateString('pt-BR')} no valor de R$ ${p.valor_boleto || v.contrato.valor_parcela}. Precisando da 2ª via, é só me falar!`;
    const num = v.cliente.telefone.replace(/\D/g, "");
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success("Redirecionando para o WhatsApp com mensagem automática.");
  };

  return (
    <AppShell title="Hub de Cobrança FPD" subtitle="Prevenção Ativa nas 3 Primeiras Parcelas">
      <div className="flex h-full flex-col space-y-6">
        
        {/* KPIs */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass rounded-xl p-6 border-l-4 border-destructive">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Valor em Risco (Atrasado)
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-destructive">
              R$ {maskMoney((totalCritico * 100).toFixed(0))}
            </p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-amber-500">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Vence em 3 Dias
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-amber-500">
              R$ {maskMoney((totalAtencao * 100).toFixed(0))}
            </p>
          </div>
          <div className="glass rounded-xl p-6 border-l-4 border-gold">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-gold" /> Acionamentos Pendentes
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-gold">
              {viewsFiltradas.length} Fichas
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass rounded-xl p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar cliente, loja, CPF..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroRisco("todos")}
              className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors border", filtroRisco === "todos" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-muted-foreground hover:bg-white/5")}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroRisco("critico")}
              className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors border", filtroRisco === "critico" ? "bg-destructive/20 border-destructive/30 text-destructive" : "border-transparent text-muted-foreground hover:bg-white/5")}
            >
              Crítico
            </button>
            <button
              onClick={() => setFiltroRisco("atencao")}
              className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors border", filtroRisco === "atencao" ? "bg-amber-500/20 border-amber-500/30 text-amber-500" : "border-transparent text-muted-foreground hover:bg-white/5")}
            >
              Atenção
            </button>
          </div>
        </div>

        {/* Lista de Cobrança */}
        <div className="glass rounded-xl overflow-hidden flex-1">
          {loading ? (
            <LoadingBlock label="Carregando malha de cobrança..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-muted-foreground">
                    <th className="p-4 font-medium">Cliente / Veículo</th>
                    <th className="p-4 font-medium">Lojista Origem</th>
                    <th className="p-4 font-medium">Parcela</th>
                    <th className="p-4 font-medium">Vencimento</th>
                    <th className="p-4 font-medium">Ação Imediata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {viewsFiltradas.map((v) => {
                    const p = v.parcelaAtual;
                    if (!p) return null;

                    const riskClasses = {
                      critico: "bg-destructive/10 text-destructive",
                      atencao: "bg-amber-500/10 text-amber-500",
                      seguro: "bg-emerald-500/10 text-emerald-500",
                      blindado: "bg-white/10 text-muted-foreground"
                    };

                    return (
                      <tr key={v.contrato.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-semibold">{v.cliente.nome}</div>
                          <div className="text-xs text-muted-foreground">{v.cliente.telefone}</div>
                        </td>
                        <td className="p-4 text-muted-foreground">{v.lojista.razao_social}</td>
                        <td className="p-4">
                          <div className="font-medium text-white">{p.numero_parcela}ª Parcela</div>
                          <div className="text-xs text-gold">R$ {p.valor_boleto || v.contrato.valor_parcela}</div>
                        </td>
                        <td className="p-4">
                          <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", riskClasses[v.risco])}>
                            {v.diasParaVencimento !== null ? (v.diasParaVencimento < 0 ? `Atrasado ${Math.abs(v.diasParaVencimento)}d` : `Faltam ${v.diasParaVencimento}d`) : "Pendente"}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleWhatsApp(v)}
                              className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/30"
                              title="Enviar WhatsApp Mágico"
                            >
                              <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                            <button
                              onClick={() => {
                                if(confirm("Confirmar pagamento manual desta parcela?")) {
                                  marcarParcelaPaga(p.id);
                                }
                              }}
                              className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                              title="Baixar Parcela"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {viewsFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Nenhuma pendência encontrada com os filtros atuais. A operação está limpa!
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
