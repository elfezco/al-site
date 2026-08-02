import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";

export function Omnisearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { clientes, veiculos, lojistas } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  const results = [
    ...clientes.filter(c => c.nome.toLowerCase().includes(query.toLowerCase()) || c.cpf.includes(query)).map(c => ({
      id: c.id, tipo: 'Cliente', texto: `${c.nome} (${c.cpf})`, link: '/clientes'
    })),
    ...lojistas.filter(l => l.razao_social.toLowerCase().includes(query.toLowerCase())).map(l => ({
      id: l.id, tipo: 'Lojista', texto: l.razao_social, link: '/lojistas'
    })),
    ...veiculos.filter(v => v.placa.toLowerCase().includes(query.toLowerCase())).map(v => ({
      id: v.id, tipo: 'Veículo', texto: `${v.placa} - ${v.modelo}`, link: '/veiculos'
    }))
  ].slice(0, 5);

  const handleSelect = (link: string) => {
    setOpen(false);
    setQuery("");
    navigate({ to: link });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1A1C23] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar por Nome, CPF, Placa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder:text-muted-foreground"
          />
          <div className="text-[10px] text-muted-foreground border border-white/10 rounded px-1.5 py-0.5">ESC</div>
        </div>
        {query.length > 1 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length > 0 ? results.map(r => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.link)}
                className="w-full text-left p-3 hover:bg-white/5 rounded-lg flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs text-gold mb-1">{r.tipo}</div>
                  <div className="text-sm text-white group-hover:text-gold transition-colors">{r.texto}</div>
                </div>
                <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Ir para {r.tipo} &rarr;</div>
              </button>
            )) : (
              <div className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</div>
            )}
          </div>
        )}
        <div className="bg-black/40 p-3 text-xs text-muted-foreground text-center border-t border-white/5">
          Dica: Pressione <strong className="text-white">Ctrl + K</strong> em qualquer lugar para abrir o Omnisearch.
        </div>
      </div>
    </div>
  );
}
