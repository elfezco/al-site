import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { Clock, Download, Wand2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { useState } from "react";
import { ImportarFichaModal } from "@/components/ImportarFichaModal";
import { NovoContratoModal } from "@/components/NovoContratoModal";

export const Route = createFileRoute("/fabrica")({
  head: () => ({
    meta: [
      { title: "Fábrica de Crédito (Produção) — AL Finanças & Negócios" },
      { name: "description", content: "Kanban de acompanhamento de aprovação e formalização." },
    ],
  }),
  component: FabricaPage,
});

const colunas = [
  { id: "Digitada", titulo: "Digitada" },
  { id: "Análise Banco", titulo: "Análise Banco" },
  { id: "Pendência", titulo: "Pendências" },
  { id: "Aprovada", titulo: "Aprovada" },
  { id: "Formalizando", titulo: "Formalizando" },
  { id: "Paga", titulo: "Paga" },
] as const;

function FabricaPage() {
  const { contratos, clientes, lojistas, loading } = useStore();
  const [openOcr, setOpenOcr] = useState(false);
  const [openContrato, setOpenContrato] = useState(false);

  const getStatus = (c: any) => {
    // Simulação do Status Baseado em Campos
    if (c.status_formalizacao === 'Formalizado') return 'Formalizando';
    if (c.status_formalizacao === 'Devolvido') return 'Pendência';
    if (c.status_comissao === 'Recebida') return 'Paga';
    return 'Digitada';
  };

  const getTempo = (c: any) => {
    const horas = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60));
    return horas;
  };

  const handleDownloadDossie = async (e: React.MouseEvent, c: any) => {
    e.stopPropagation();
    toast.info("Gerando Dossiê ZIP...");
    try {
      const cli = clientes.find((x) => x.id === c.cliente_id);
      const zip = new JSZip();
      
      // Simulação de adição de arquivos ao ZIP
      zip.file("resumo_contrato.txt", `Contrato: ${c.id}\nCliente: ${cli?.nome}\nCPF: ${cli?.cpf}\nValor: R$ ${c.valor_financiado}`);
      zip.file("cnh_cliente.pdf", "%PDF-1.4... (arquivo simulado)");
      zip.file("comprovante_residencia.pdf", "%PDF-1.4... (arquivo simulado)");
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Dossie_${cli?.cpf || 'cliente'}.zip`);
      toast.success("Dossiê gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar Dossiê ZIP");
    }
  };

  return (
    <AppShell>
      <div className="flex h-full flex-col p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Fábrica de Crédito</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhamento de aprovação e formalização de propostas
            </p>
          </div>
          <button
            onClick={() => setOpenOcr(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
          >
            <Wand2 className="h-4 w-4" /> Importar Ficha (OCR)
          </button>
        </div>

        {loading ? (
          <LoadingBlock label="Carregando esteira..." />
        ) : (
          <div className="flex h-[calc(100vh-200px)] gap-6 overflow-x-auto pb-4">
            {colunas.map((col) => (
              <div key={col.id} className="flex h-full w-80 shrink-0 flex-col rounded-2xl bg-black/40 border border-white/5 p-4">
                <div className="mb-4 flex items-center justify-between px-2">
                  <h3 className="font-semibold text-white/90">{col.titulo}</h3>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
                    {contratos.filter((c) => getStatus(c) === col.id).length}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
                  {contratos.filter((c) => getStatus(c) === col.id).map((c) => {
                    const cli = clientes.find((x) => x.id === c.cliente_id);
                    const loj = lojistas.find((x) => x.id === c.lojista_id);
                    const horas = getTempo(c);
                    const tempoColor = horas > 48 ? "text-destructive bg-destructive/10 border-destructive/20" : horas > 24 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                    
                    return (
                      <div key={c.id} className="w-full rounded-xl border border-white/10 bg-[#1A1C23] p-3 text-left shadow-lg cursor-pointer hover:-translate-y-0.5 transition-transform">
                        <div className="flex items-start justify-between">
                          <p className="truncate text-sm font-semibold">{cli?.nome || "Desconhecido"}</p>
                          <button 
                            onClick={(e) => handleDownloadDossie(e, c)}
                            title="Baixar Dossiê ZIP"
                            className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-gold"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">Loja: {loj?.razao_social}</p>
                        <p className="truncate text-[11px] text-gold">{c.veiculo?.modelo}</p>
                        
                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                          <div className={cn("flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold", tempoColor)}>
                            <Clock className="h-3 w-3" />
                            {horas}h SLA
                          </div>
                          <span className="text-[11px] text-white/50">{c.banco}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ImportarFichaModal 
        open={openOcr} 
        onOpenChange={setOpenOcr} 
        onFichaLida={() => toast.success("Esteira Atualizada!")} 
      />
      <NovoContratoModal 
        open={openContrato} 
        onOpenChange={setOpenContrato} 
      />
    </AppShell>
  );
}
