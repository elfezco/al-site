import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Search, Zap, Loader2, Image as ImageIcon, Download, Edit } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import Tesseract from "tesseract.js";
import type { Documento } from "@/lib/types";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [{ title: "Cofre de Documentos — AL Finanças & Negócios" }],
  }),
  component: DocumentosPage,
});

const TEMPLATES = [
  {
    nome: "Termo de Entrega de Veículo",
    descricao: "Contrato padrão atestando a retirada do veículo pelo cliente no lojista.",
    formato: "PDF",
  },
  {
    nome: "Termo de Consentimento LGPD",
    descricao: "Autorização para uso de dados pessoais e consulta em birôs de crédito.",
    formato: "DOCX",
  },
  {
    nome: "Contrato de Intermediação",
    descricao: "Documento que formaliza a relação B2B entre a AL Finanças e o Lojista Parceiro.",
    formato: "PDF",
  },
];

function DocumentosPage() {
  const { documentos, contratos, clientes, addDocumento, editDocumento, deleteDocumento } = useStore();
  const loading = useSimulatedLoad();
  const [busca, setBusca] = useState("");
  
  // OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", tipo: "" });

  const filtrados = documentos.filter((d) =>
    d.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleUploadFake = async () => {
    toast.info("Na Fase 3 isso será conectado ao Supabase Storage.");
    await addDocumento({
      contrato_id: contratos[0]?.id,
      nome: "Contrato_Assinado_Exemplo.pdf",
      tipo: "Contrato Assinado",
      url: "https://exemplo.com/doc.pdf",
      tamanho_bytes: 1024 * 1024 * 2.5,
    });
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrResult(null);
    toast.info("Iniciando leitura via OCR... (pode demorar alguns segundos)");

    try {
      const result = await Tesseract.recognize(file, 'por', { logger: m => console.log(m) });
      setOcrResult(result.data.text);
      toast.success("Leitura concluída!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar imagem.");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const excluir = async (id: string) => {
    if (confirm(`Tem certeza que deseja excluir este documento do cofre?`)) {
      await deleteDocumento(id);
    }
  };

  const openEdit = (d: Documento) => {
    setEditingId(d.id);
    setForm({ nome: d.nome, tipo: d.tipo });
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    await editDocumento(editingId, { nome: form.nome, tipo: form.tipo as any });
    setEditOpen(false);
  };

  return (
    <AppShell title="Cofre de Documentos" subtitle="Armazenamento seguro, OCR inteligente e Modelos Padrão">
      
      {/* Modelos e Templates */}
      <section className="mb-6 rounded-xl border border-white/10 bg-black/40 p-5">
        <header className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gold" />
          <h2 className="font-display font-semibold text-white">Modelos e Templates</h2>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <div key={i} className="flex flex-col rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gold">{t.nome}</h3>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white">{t.formato}</span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground flex-1">{t.descricao}</p>
              <button 
                onClick={() => toast.success("Download iniciado! (Mock)")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <Download className="h-3.5 w-3.5" /> Baixar Modelo
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* OCR Section */}
      <section className="mb-6 rounded-xl border border-gold/30 bg-[linear-gradient(135deg,rgba(250,219,95,0.05),rgba(184,134,11,0.05))] p-5">
        <header className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          <h2 className="font-display font-semibold text-gold">OCR Inteligente (Leitura de CNH/RG)</h2>
        </header>
        <p className="mb-4 text-sm text-muted-foreground">
          Faça o upload de uma imagem da CNH ou RG. A inteligência artificial fará a leitura dos dados localmente no seu navegador.
        </p>
        
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleOcr} />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={ocrLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {ocrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          {ocrLoading ? "Lendo documento..." : "Selecionar Imagem para OCR"}
        </button>

        {ocrResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado da Leitura:</h3>
            <pre className="whitespace-pre-wrap text-sm text-white font-mono max-h-48 overflow-y-auto">{ocrResult}</pre>
          </div>
        )}
      </section>

      <div className="mb-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documento no cofre..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-white/12 bg-black/30 pl-10 pr-4 py-2 text-sm outline-none transition-colors focus:border-gold/60"
          />
        </div>
        
        <button
          onClick={handleUploadFake}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-gold/40 hover:text-gold"
        >
          <Upload className="h-4 w-4" /> Upload Manual
        </button>
      </div>

      {loading ? (
        <LoadingBlock label="Carregando cofre…" />
      ) : (
        <div className="card-surface overflow-hidden rounded-xl shadow-[var(--shadow-elegant)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Nome do Arquivo</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Vinculado a</th>
                  <th className="px-5 py-3">Tamanho</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d) => {
                  const c = contratos.find(con => con.id === d.contrato_id);
                  const cli = c ? clientes.find(cl => cl.id === c.cliente_id) : null;
                  
                  return (
                    <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                      <td className="px-5 py-3 font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gold" />
                        {d.nome}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{d.tipo}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {cli ? cli.nome : "Desconhecido"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {d.tamanho_bytes ? `${(d.tamanho_bytes / 1024 / 1024).toFixed(2)} MB` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEdit(d)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-white/10"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => excluir(d.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      O cofre está vazio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass max-w-md text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-muted-foreground">Nome do Arquivo</span>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm(f => ({...f, nome: e.target.value}))}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Tipo de Documento</span>
              <select
                value={form.tipo}
                onChange={(e) => setForm(f => ({...f, tipo: e.target.value}))}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
              >
                <option value="CNH">CNH</option>
                <option value="Comprovante Residência">Comprovante Residência</option>
                <option value="Contrato Assinado">Contrato Assinado</option>
                <option value="Boleto">Boleto</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
            >
              Salvar Alterações
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
