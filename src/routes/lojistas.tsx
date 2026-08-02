import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, MessageCircle } from "lucide-react";
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
import { useStore } from "@/lib/store";
import { brl, soDigitos } from "@/lib/format";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/lojistas")({
  head: () => ({
    meta: [
      { title: "Lojistas & Repasses — AL Finanças & Negócios" },
      {
        name: "description",
        content:
          "CRM B2B dos lojistas parceiros: volume originado, taxa de inadimplência e dados de repasse via Pix.",
      },
      { property: "og:title", content: "Lojistas & Repasses" },
      {
        property: "og:description",
        content: "Volume originado, inadimplência e chave Pix de cada loja parceira.",
      },
    ],
  }),
  component: LojistasPage,
});

const schema = z.object({
  razao_social: z.string().trim().min(3, "Informe a razão social").max(120),
  contato_whatsapp: z
    .string()
    .trim()
    .min(10, "Informe o WhatsApp com DDD")
    .max(20)
    .refine((v) => soDigitos(v).length >= 10, "WhatsApp inválido"),
  chave_pix: z.string().trim().min(5, "Informe a chave Pix").max(120),
});

function LojistasPage() {
  const { lojistaMetrics, addLojista } = useStore();
  const loading = useSimulatedLoad();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ razao_social: "", contato_whatsapp: "", chave_pix: "" });
  const [erros, setErros] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErros(next);
      toast.error("Verifique os campos destacados");
      return;
    }
    addLojista({ ...parsed.data, contato_whatsapp: soDigitos(parsed.data.contato_whatsapp) });
    setErros({});
    setForm({ razao_social: "", contato_whatsapp: "", chave_pix: "" });
    setOpen(false);
    toast.success(`Lojista ${parsed.data.razao_social} cadastrado`);
  };

  return (
    <AppShell title="Lojistas & Repasses" subtitle="CRM B2B dos parceiros e controle de inadimplência">
      <div className="mb-5 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo Lojista
          </DialogTrigger>
          <DialogContent className="glass max-w-md text-foreground">
            <DialogHeader>
              <DialogTitle className="font-display">Cadastrar Lojista</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <Field
                label="Razão social"
                value={form.razao_social}
                error={erros["razao_social"]}
                onChange={(v) => setForm((f) => ({ ...f, razao_social: v }))}
              />
              <Field
                label="WhatsApp (com DDI/DDD)"
                value={form.contato_whatsapp}
                error={erros["contato_whatsapp"]}
                onChange={(v) => setForm((f) => ({ ...f, contato_whatsapp: v }))}
              />
              <Field
                label="Chave Pix"
                value={form.chave_pix}
                error={erros["chave_pix"]}
                onChange={(v) => setForm((f) => ({ ...f, chave_pix: v }))}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
              >
                Salvar lojista
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
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Lojista</th>
                  <th className="px-5 py-3">Contratos</th>
                  <th className="px-5 py-3">Volume originado</th>
                  <th className="px-5 py-3">Inadimplentes</th>
                  <th className="px-5 py-3">Taxa</th>
                  <th className="px-5 py-3">Chave Pix</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {lojistaMetrics.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">{l.razao_social}</td>
                    <td className="px-5 py-3 text-muted-foreground">{l.contratos}</td>
                    <td className="px-5 py-3 text-gold">{brl(l.volume)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{l.inadimplentes}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          l.taxaInadimplencia > 25
                            ? "text-destructive"
                            : l.taxaInadimplencia > 0
                              ? "text-amber-300"
                              : "text-emerald-300"
                        }
                      >
                        {l.taxaInadimplencia.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{l.chave_pix}</td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`https://wa.me/${soDigitos(l.contato_whatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => toast.success(`Abrindo conversa com ${l.razao_social}`)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 px-2.5 py-1.5 text-xs text-gold transition-colors hover:bg-gold/10"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Falar
                      </a>
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
}: {
  label: string;
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={120}
        className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
      />
      {error && <span className="mt-1 block text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
