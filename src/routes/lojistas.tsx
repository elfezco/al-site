import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, MessageCircle, Edit, Trash2, Award, TrendingUp } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore, type LojistaMetrics } from "@/lib/store";
import { brl, soDigitos } from "@/lib/format";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/lojistas")({
  head: () => ({
    meta: [
      { title: "Lojistas & Performance — AL Finanças & Negócios" },
    ],
  }),
  component: LojistasPage,
});

const schema = z.object({
  razao_social: z.string().trim().min(3, "Informe a razão social").max(120),
  contato_whatsapp: z.string().trim().min(10, "WhatsApp inválido").refine((v) => soDigitos(v).length >= 10, "WhatsApp inválido"),
  socio_nome: z.string().trim().optional(),
  socio_telefone: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  fichas_enviadas: z.coerce.number().min(0).optional(),
});

function LojistasPage() {
  const { lojistaMetrics, addLojista, editLojista, deleteLojista } = useStore();
  const loading = useSimulatedLoad();
  const [open, setOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    razao_social: "",
    contato_whatsapp: "",
    socio_nome: "",
    socio_telefone: "",
    endereco: "",
    fichas_enviadas: 0,
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  const topAprovacao = [...lojistaMetrics].sort((a, b) => b.taxaAprovacao - a.taxaAprovacao)[0];
  const topVolume = [...lojistaMetrics].sort((a, b) => b.volume - a.volume)[0];

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ razao_social: "", contato_whatsapp: "", socio_nome: "", socio_telefone: "", endereco: "", fichas_enviadas: 0 });
    setErros({});
    setOpen(true);
  };

  const handleOpenEdit = (l: LojistaMetrics) => {
    setEditingId(l.id);
    setForm({
      razao_social: l.razao_social,
      contato_whatsapp: l.contato_whatsapp,
      socio_nome: l.socio_nome || "",
      socio_telefone: l.socio_telefone || "",
      endereco: l.endereco || "",
      fichas_enviadas: l.fichas_enviadas || 0,
    });
    setErros({});
    setOpen(true);
  };

  const excluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o lojista ${nome}? Isso apagará contratos associados!`)) {
      await deleteLojista(id);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErros(next);
      toast.error("Verifique os campos destacados");
      return;
    }
    
    const payload = {
      ...parsed.data,
      contato_whatsapp: soDigitos(parsed.data.contato_whatsapp),
      socio_telefone: parsed.data.socio_telefone ? soDigitos(parsed.data.socio_telefone) : undefined,
    };

    if (editingId) {
      await editLojista(editingId, payload);
    } else {
      await addLojista(payload);
    }
    
    setOpen(false);
  };

  return (
    <AppShell title="Lojistas parceiros" subtitle="CRM B2B, performance de aprovação e inadimplência">
      {/* Ranking Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-gold/30 bg-[linear-gradient(135deg,rgba(250,219,95,0.05),rgba(184,134,11,0.05))] p-5">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gold/20 text-gold">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Melhor Conversão</p>
            <p className="font-display text-lg font-bold text-white">{topAprovacao ? topAprovacao.razao_social : "N/D"}</p>
            <p className="text-xs text-emerald-400">{topAprovacao ? `${topAprovacao.taxaAprovacao.toFixed(1)}% de aprovação` : "—"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maior Volume</p>
            <p className="font-display text-lg font-bold text-white">{topVolume ? topVolume.razao_social : "N/D"}</p>
            <p className="text-xs text-gold">{topVolume ? brl(topVolume.volume) : "—"}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button onClick={handleOpenNew} className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90">
              <Plus className="h-4 w-4" /> Novo Lojista
            </button>
          </DialogTrigger>
          <DialogContent className="glass max-w-md text-foreground max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? "Editar Lojista" : "Cadastrar Lojista"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <Field
                label="Razão social *"
                value={form.razao_social}
                error={erros["razao_social"]}
                onChange={(v) => setForm((f) => ({ ...f, razao_social: v }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="WhatsApp da Loja *"
                  value={form.contato_whatsapp}
                  error={erros["contato_whatsapp"]}
                  onChange={(v) => setForm((f) => ({ ...f, contato_whatsapp: v }))}
                />
                <Field
                  label="Total de Fichas (Mês)"
                  type="number"
                  value={String(form.fichas_enviadas)}
                  error={erros["fichas_enviadas"]}
                  onChange={(v) => setForm((f) => ({ ...f, fichas_enviadas: Number(v) }))}
                />
              </div>
              
              <div className="my-2 border-t border-white/10 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Dados do Sócio / Responsável</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Nome do Sócio"
                    value={form.socio_nome}
                    error={erros["socio_nome"]}
                    onChange={(v) => setForm((f) => ({ ...f, socio_nome: v }))}
                  />
                  <Field
                    label="Telefone do Sócio"
                    value={form.socio_telefone}
                    error={erros["socio_telefone"]}
                    onChange={(v) => setForm((f) => ({ ...f, socio_telefone: v }))}
                  />
                </div>
              </div>
              
              <Field
                label="Endereço Completo"
                value={form.endereco}
                error={erros["endereco"]}
                onChange={(v) => setForm((f) => ({ ...f, endereco: v }))}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
              >
                {editingId ? "Salvar Alterações" : "Salvar lojista"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <LoadingBlock label="Carregando parceiros…" />
      ) : (
        <div className="card-surface overflow-hidden rounded-xl shadow-[var(--shadow-elegant)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Lojista</th>
                  <th className="px-5 py-3">Fichas / Aprovação</th>
                  <th className="px-5 py-3">Volume originado</th>
                  <th className="px-5 py-3">Inadimplentes</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {lojistaMetrics.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <p className="font-medium">{l.razao_social}</p>
                      {l.socio_nome && <p className="text-[11px] text-muted-foreground">Sócio: {l.socio_nome}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{l.contratos} aprovadas</p>
                      <p className="text-[11px] text-muted-foreground">
                        de {l.fichas_enviadas || l.contratos} enviadas ({l.taxaAprovacao.toFixed(1)}%)
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gold">{brl(l.volume)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          l.taxaInadimplencia > 25
                            ? "text-destructive font-semibold"
                            : l.taxaInadimplencia > 0
                              ? "text-amber-300"
                              : "text-emerald-300"
                        }
                      >
                        {l.inadimplentes} ({l.taxaInadimplencia.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://wa.me/${soDigitos(l.contato_whatsapp)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 px-2.5 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Falar
                        </a>
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-white/10"
                        >
                          <Edit className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => excluir(l.id, l.razao_social)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
      />
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
