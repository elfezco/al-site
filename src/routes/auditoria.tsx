import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ShieldCheck, Clock, User, Activity, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — AL Finanças" },
      { name: "description", content: "Log de ações e acessos ao sistema." },
    ],
  }),
  component: AuditoriaPage,
});

// Dados Mock de Auditoria (No futuro virá de `logs_sessao` ou `logs_auditoria` do Supabase)
const mockLogs = [
  { id: 1, usuario: "Administrador (Você)", acao: "Importou Ficha via OCR", recurso: "Contrato CT-1020", data: new Date().toISOString(), ip: "192.168.1.45" },
  { id: 2, usuario: "Sistema", acao: "Gerou Alerta Crítico FPD", recurso: "Cliente C1", data: new Date(Date.now() - 3600000).toISOString(), ip: "localhost" },
  { id: 3, usuario: "Equipe Comercial", acao: "Atualizou Endereço", recurso: "Lojista Auto Center Prime", data: new Date(Date.now() - 7200000).toISOString(), ip: "10.0.0.12" },
  { id: 4, usuario: "Administrador (Você)", acao: "Marcou Parcela 2 como Paga", recurso: "Contrato CT-1004", data: new Date(Date.now() - 86400000).toISOString(), ip: "192.168.1.45" },
  { id: 5, usuario: "Administrador (Você)", acao: "Login no Sistema", recurso: "Sessão", data: new Date(Date.now() - 90000000).toISOString(), ip: "192.168.1.45" },
];

function AuditoriaPage() {
  const [busca, setBusca] = useState("");

  const logsFiltrados = mockLogs.filter(log => {
    if (busca) {
      const b = busca.toLowerCase();
      return log.acao.toLowerCase().includes(b) || log.recurso.toLowerCase().includes(b) || log.usuario.toLowerCase().includes(b);
    }
    return true;
  });

  return (
    <AppShell title="Auditoria e Logs" subtitle="Rastreabilidade militar de todas as ações do sistema">
      <div className="flex h-full flex-col space-y-6">
        
        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass rounded-xl p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por usuário, ação, recurso..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold"/> Sistema Monitorado
            </div>
          </div>
        </div>

        {/* Timeline de Logs */}
        <div className="glass rounded-xl overflow-hidden flex-1 p-6">
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {logsFiltrados.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-black/60 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-gold">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm transition-all hover:bg-white/10">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground"/> {log.usuario}
                    </div>
                    <time className="text-xs text-gold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(log.data).toLocaleString('pt-BR')}
                    </time>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-foreground">{log.acao}</span> em <span className="font-mono text-gold/80 bg-black/30 px-1 rounded">{log.recurso}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 mt-2 text-right">
                    IP: {log.ip}
                  </div>
                </div>
              </div>
            ))}

            {logsFiltrados.length === 0 && (
              <div className="text-center text-muted-foreground py-10">Nenhum log encontrado para a busca.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
