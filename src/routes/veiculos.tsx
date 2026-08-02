import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
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
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/veiculos")({
  head: () => ({
    meta: [{ title: "Veículos — AL Finanças & Negócios" }],
  }),
  component: VeiculosPage,
});

const schema = z.object({
  placa: z.string().trim().toUpperCase().min(7, "Placa inválida").max(8),
  modelo: z.string().trim().min(2, "Informe o modelo"),
  ano: z.coerce.number().min(1900, "Ano inválido").max(new Date().getFullYear() + 1).optional(),
  cor: z.string().trim().optional(),
  chassi: z.string().trim().toUpperCase().optional(),
  renavam: z.string().trim().optional(),
});

function VeiculosPage() {
  const { veiculos, addVeiculo, deleteVeiculo } = useStore();
  const loading = useSimulatedLoad();
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    placa: "",
    modelo: "",
    ano: "",
    cor: "",
    chassi: "",
    renavam: "",
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  const filtrados = veiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(busca.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.toLowerCase())
  );

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
    await addVeiculo({
      ...parsed.data,
      ano: parsed.data.ano || undefined,
      cor: parsed.data.cor || undefined,
      chassi: parsed.data.chassi || undefined,
      renavam: parsed.data.renavam || undefined,
    });
    setErros({});
    setForm({ placa: "", modelo: "", ano: "", cor: "", chassi: "", renavam: "" });
    setOpen(false);
  };

  const excluir = async (id: string, modelo: string, placa: string) => {
    if (confirm(`Tem certeza que deseja excluir o veículo ${modelo} (${placa})?`)) {
      await deleteVeiculo(id);
    }
  };

  return (
    <AppShell title="Veículos" subtitle="Cadastro de bens financiados">
      <div className="mb-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por placa ou modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-white/12 bg-black/30 pl-10 pr-4 py-2 text-sm outline-none transition-colors focus:border-gold/60"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo Veículo
          </DialogTrigger>
          <DialogContent className="glass max-w-md text-foreground max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Cadastrar Veículo</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Placa *"
                  value={form.placa}
                  error={erros["placa"]}
                  onChange={(v) => setForm((f) => ({ ...f, placa: v.toUpperCase() }))}
                />
                <Field
                  label="Modelo *"
                  value={form.modelo}
                  error={erros["modelo"]}
                  onChange={(v) => setForm((f) => ({ ...f, modelo: v }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Ano"
                  type="number"
                  value={form.ano}
                  error={erros["ano"]}
                  onChange={(v) => setForm((f) => ({ ...f, ano: v }))}
                />
                <Field
                  label="Cor"
                  value={form.cor}
                  error={erros["cor"]}
                  onChange={(v) => setForm((f) => ({ ...f, cor: v }))}
                />
              </div>
              <Field
                label="Chassi"
                value={form.chassi}
                error={erros["chassi"]}
                onChange={(v) => setForm((f) => ({ ...f, chassi: v.toUpperCase() }))}
              />
              <Field
                label="Renavam"
                value={form.renavam}
                error={erros["renavam"]}
                onChange={(v) => setForm((f) => ({ ...f, renavam: v }))}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
              >
                Salvar Veículo
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <LoadingBlock label="Carregando veículos…" />
      ) : (
        <div className="card-surface overflow-hidden rounded-xl shadow-[var(--shadow-elegant)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Placa</th>
                  <th className="px-5 py-3">Modelo</th>
                  <th className="px-5 py-3">Ano/Cor</th>
                  <th className="px-5 py-3">Cadastrado em</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((v) => (
                  <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium font-mono text-gold">{v.placa}</td>
                    <td className="px-5 py-3 font-medium">{v.modelo}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {v.ano || "—"} {v.cor && `/ ${v.cor}`}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Date(v.created_at || Date.now()).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => excluir(v.id, v.modelo, v.placa)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhum veículo encontrado.
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
