import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Edit } from "lucide-react";
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
import { soDigitos } from "@/lib/format";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import type { Cliente } from "@/lib/types";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [{ title: "Clientes — AL Finanças & Negócios" }],
  }),
  component: ClientesPage,
});

const schema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo"),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  rg: z.string().trim().optional(),
  telefone: z.string().trim().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  data_nascimento: z.string().optional(),
  endereco: z.string().optional(),
});

function mascararCPF(cpf: string) {
  const limpo = soDigitos(cpf);
  if (limpo.length !== 11) return cpf;
  return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-**`;
}

function ClientesPage() {
  const { clientes, addCliente, editCliente, deleteCliente } = useStore();
  const loading = useSimulatedLoad();
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [revelarCPFs, setRevelarCPFs] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    rg: "",
    telefone: "",
    email: "",
    data_nascimento: "",
    endereco: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      soDigitos(c.cpf).includes(soDigitos(busca))
  );

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ nome: "", cpf: "", rg: "", telefone: "", email: "", data_nascimento: "", endereco: "" });
    setErros({});
    setOpen(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingId(c.id);
    setForm({
      nome: c.nome,
      cpf: c.cpf,
      rg: c.rg || "",
      telefone: c.telefone,
      email: c.email || "",
      data_nascimento: c.data_nascimento || "",
      endereco: c.endereco || "",
    });
    setErros({});
    setOpen(true);
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
      cpf: soDigitos(parsed.data.cpf),
      telefone: soDigitos(parsed.data.telefone),
      email: parsed.data.email || undefined,
      rg: parsed.data.rg || undefined,
      data_nascimento: parsed.data.data_nascimento || undefined,
      endereco: parsed.data.endereco || undefined,
    };

    if (editingId) {
      await editCliente(editingId, payload);
    } else {
      await addCliente(payload);
    }
    
    setOpen(false);
  };

  const excluir = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o cliente ${nome}? Isso removerá os contratos vinculados a ele.`)) {
      await deleteCliente(id);
    }
  };

  return (
    <AppShell title="Clientes" subtitle="Gestão de clientes finais e proteção de dados (LGPD)">
      <div className="mb-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-white/12 bg-black/30 pl-10 pr-4 py-2 text-sm outline-none transition-colors focus:border-gold/60"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRevelarCPFs((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-white"
          >
            {revelarCPFs ? "Ocultar CPFs" : "Revelar CPFs"}
          </button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button onClick={handleOpenNew} className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4" /> Novo Cliente
              </button>
            </DialogTrigger>
            <DialogContent className="glass max-w-md text-foreground max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">{editingId ? "Editar Cliente" : "Cadastrar Cliente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <Field
                  label="Nome completo *"
                  value={form.nome}
                  error={erros["nome"]}
                  onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="CPF *"
                    value={form.cpf}
                    error={erros["cpf"]}
                    onChange={(v) => setForm((f) => ({ ...f, cpf: v }))}
                  />
                  <Field
                    label="RG"
                    value={form.rg}
                    error={erros["rg"]}
                    onChange={(v) => setForm((f) => ({ ...f, rg: v }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Telefone *"
                    value={form.telefone}
                    error={erros["telefone"]}
                    onChange={(v) => setForm((f) => ({ ...f, telefone: v }))}
                  />
                  <Field
                    label="Data de Nasc."
                    type="date"
                    value={form.data_nascimento}
                    error={erros["data_nascimento"]}
                    onChange={(v) => setForm((f) => ({ ...f, data_nascimento: v }))}
                  />
                </div>
                <Field
                  label="E-mail"
                  type="email"
                  value={form.email}
                  error={erros["email"]}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                />
                <Field
                  label="Endereço"
                  value={form.endereco}
                  error={erros["endereco"]}
                  onChange={(v) => setForm((f) => ({ ...f, endereco: v }))}
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
                >
                  {editingId ? "Salvar Alterações" : "Salvar Cliente"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Carregando clientes…" />
      ) : (
        <div className="card-surface overflow-hidden rounded-xl shadow-[var(--shadow-elegant)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">CPF</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Cadastrado em</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">
                      {c.nome}
                      {c.endereco && <span className="block text-[11px] text-muted-foreground mt-0.5">{c.endereco}</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono">
                      {revelarCPFs ? c.cpf : mascararCPF(c.cpf)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-white">{c.telefone}</div>
                      {c.email && <div className="text-[11px] text-muted-foreground/60">{c.email}</div>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Date(c.created_at || Date.now()).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-white/10"
                        >
                          <Edit className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => excluir(c.id, c.nome)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
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
