import { toast } from "sonner";
import { MessageCircle, Copy, CheckCircle2, Phone, Car, Store, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RiscoBadge } from "@/components/RiscoBadge";
import { useStore } from "@/lib/store";
import { brlExact, dataBR, soDigitos } from "@/lib/format";
import type { ContratoView } from "@/lib/types";

export function buildMensagem(view: ContratoView): string {
  const p = view.parcelaAtual;
  const venc = p ? dataBR(p.data_vencimento) : "—";
  return (
    `Olá ${view.cliente.nome}, referente ao financiamento do ${view.contrato.veiculo.modelo} ` +
    `(${view.contrato.veiculo.placa}) pela loja ${view.lojista.razao_social}, a parcela ${p?.numero_parcela ?? 1}/3 ` +
    `do banco ${view.contrato.banco} vence no dia ${venc}, no valor de ${brlExact(view.contrato.valor_parcela)}. ` +
    `Podemos confirmar o pagamento? — AL Finanças & Negócios.`
  );
}

export function CobrancaModal({
  view,
  onClose,
}: {
  view: ContratoView | null;
  onClose: () => void;
}) {
  const { marcarParcelaPaga } = useStore();
  if (!view) return null;

  const mensagem = buildMensagem(view);
  const link = `https://wa.me/${soDigitos(view.cliente.telefone)}?text=${encodeURIComponent(mensagem)}`;

  return (
    <Dialog open={view !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass max-w-lg text-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            Hub de Cobrança
            <RiscoBadge risco={view.risco} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-lg font-semibold">{view.cliente.nome}</p>
            <p className="text-xs text-muted-foreground">
              CPF {view.cliente.cpf} · Contrato {view.contrato.id}
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <Row icon={<Car className="h-4 w-4 text-gold" />} label="Veículo">
              {view.contrato.veiculo.modelo} · {view.contrato.veiculo.placa}
            </Row>
            <Row icon={<Store className="h-4 w-4 text-gold" />} label="Lojista">
              {view.lojista.razao_social}
            </Row>
            <Row icon={<Landmark className="h-4 w-4 text-gold" />} label="Banco">
              {view.contrato.banco} · parcela {brlExact(view.contrato.valor_parcela)}
            </Row>
            <Row icon={<Phone className="h-4 w-4 text-gold" />} label="Telefone">
              {view.cliente.telefone}
            </Row>
          </div>

          {view.parcelaAtual ? (
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">
              Parcela {view.parcelaAtual.numero_parcela}/3 — vencimento{" "}
              <span className="text-foreground">{dataBR(view.parcelaAtual.data_vencimento)}</span> (
              {view.diasParaVencimento !== null && view.diasParaVencimento < 0
                ? `${String(Math.abs(view.diasParaVencimento))} dias em atraso`
                : `vence em ${String(view.diasParaVencimento ?? 0)} dias`}
              )
            </div>
          ) : (
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-gold">
              Contrato blindado: 3 primeiras parcelas quitadas, sem risco de FPD.
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-muted-foreground">
            {mensagem}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              onClick={() => toast.success("Abrindo WhatsApp do cliente…")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" /> Cobrar no WhatsApp
            </a>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(mensagem);
                toast.success("Mensagem copiada para a área de transferência");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm text-foreground transition-colors hover:border-gold/40 hover:text-gold"
            >
              <Copy className="h-4 w-4" /> Copiar
            </button>
            {view.parcelaAtual && (
              <button
                onClick={() => {
                  if (view.parcelaAtual) marcarParcelaPaga(view.parcelaAtual.id);
                  toast.success("Parcela baixada como paga. Risco de FPD reduzido.");
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/40 px-3 py-2.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="h-4 w-4" /> Baixar pagamento
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="flex-1 text-sm">{children}</span>
    </div>
  );
}
