import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Loader2, Car, Banknote } from "lucide-react";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";

// Simulador da API FIPE / Placas
const simularConsultaPlaca = async (placa: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        placa: placa.toUpperCase(),
        marca: "VOLKSWAGEN",
        modelo: "GOL TRENDLINE 1.0 T.FLEX 12V 5P",
        anoModelo: 2018,
        anoFabricacao: 2017,
        chassi: "9BWAB45U" + Math.floor(Math.random() * 1000000),
        renavam: "0123" + Math.floor(Math.random() * 100000),
        valorFipe: 38500.00, // Simulando valor da FIPE
      });
    }, 1500); // 1.5s delay
  });
};

export function NovoContratoModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { clientes, lojistas, addVeiculo, criarContrato } = useStore();
  const [step, setStep] = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // Forms
  const [placaInput, setPlacaInput] = useState("");
  const [veiculoFipe, setVeiculoFipe] = useState<any>(null);
  
  const [clienteId, setClienteId] = useState("");
  const [lojistaId, setLojistaId] = useState("");
  const [banco, setBanco] = useState("Daycoval");
  const [valorFinanciado, setValorFinanciado] = useState("");
  const [valorParcela, setValorParcela] = useState("");
  const [comissaoPromotora, setComissaoPromotora] = useState("");
  const [trocoNaTroca, setTrocoNaTroca] = useState("");
  
  const [checkDut, setCheckDut] = useState(false);
  const [checkContrato, setCheckContrato] = useState(false);
  const [checkBiometria, setCheckBiometria] = useState(false);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem('draft_contrato');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.clienteId) setClienteId(draft.clienteId);
          if (draft.lojistaId) setLojistaId(draft.lojistaId);
          if (draft.valorFinanciado) setValorFinanciado(draft.valorFinanciado);
          if (draft.valorParcela) setValorParcela(draft.valorParcela);
          if (draft.comissaoPromotora) setComissaoPromotora(draft.comissaoPromotora);
          if (draft.trocoNaTroca) setTrocoNaTroca(draft.trocoNaTroca);
          if (draft.banco) setBanco(draft.banco);
          if (draft.placaInput) {
            setPlacaInput(draft.placaInput);
            if (draft.placaInput === "OCR-0000") {
              setStep(2); // Pula a busca da placa no OCR
              setVeiculoFipe({
                placa: "OCR-0000",
                marca: "Veículo",
                modelo: "Importado via OCR",
                anoModelo: new Date().getFullYear(),
                anoFabricacao: new Date().getFullYear(),
                chassi: "OCR" + Math.floor(Math.random() * 100000),
                renavam: "012" + Math.floor(Math.random() * 100000),
                valorFipe: Number(draft.valorFinanciado) || 40000,
              });
            }
          }
          if (draft.nomeImportado && draft.cpfImportado) {
            toast.success(`Cliente ${draft.nomeImportado} importado via OCR! Crie o cadastro ou selecione-o.`);
          }
      } else {
        setStep(1);
        setPlacaInput("");
        setVeiculoFipe(null);
        setClienteId("");
        setLojistaId("");
        setValorFinanciado("");
        setValorParcela("");
        setComissaoPromotora("");
        setTrocoNaTroca("");
        setCheckDut(false);
        setCheckContrato(false);
        setCheckBiometria(false);
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && (clienteId || lojistaId || valorFinanciado || placaInput)) {
      localStorage.setItem('draft_contrato', JSON.stringify({
        clienteId, lojistaId, valorFinanciado, valorParcela, comissaoPromotora, trocoNaTroca, banco, placaInput
      }));
    }
  }, [clienteId, lojistaId, valorFinanciado, valorParcela, comissaoPromotora, trocoNaTroca, banco, placaInput, open]);

  const handleBuscarPlaca = async () => {
    if (placaInput.length < 7) {
      toast.error("Digite uma placa válida");
      return;
    }
    setLoadingSearch(true);
    try {
      const result = await simularConsultaPlaca(placaInput);
      setVeiculoFipe(result);
      setStep(2);
      toast.success("Dados do veículo importados (FIPE)!");
    } catch (e) {
      toast.error("Placa não encontrada na base de dados.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !lojistaId || !valorFinanciado || !valorParcela || !veiculoFipe) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      // 1. Cadastrar Veículo
      const veiculoId = await addVeiculo({
        placa: veiculoFipe.placa,
        modelo: veiculoFipe.modelo,
        ano: veiculoFipe.anoModelo,
        chassi: veiculoFipe.chassi,
        renavam: veiculoFipe.renavam,
      });

      if (!veiculoId) throw new Error("Falha ao cadastrar veículo");

      // 2. Criar Contrato
      await criarContrato({
        cliente_id: clienteId,
        lojista_id: lojistaId,
        banco: banco as any,
        veiculo_id: veiculoId,
        veiculo: { placa: veiculoFipe.placa, modelo: veiculoFipe.modelo },
        valor_financiado: Number(valorFinanciado),
        valor_parcela: Number(valorParcela),
        comissao_promotora: comissaoPromotora ? Number(comissaoPromotora) : 0,
        valor_troco_na_troca: trocoNaTroca ? Number(trocoNaTroca) : undefined,
        checklist_dut: checkDut,
        checklist_contrato: checkContrato,
        checklist_biometria: checkBiometria,
        status_formalizacao: (checkDut && checkContrato && checkBiometria) ? 'Formalizado' : 'Pendente',
      });

      localStorage.removeItem('draft_contrato');
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao finalizar a operação");
    }
  };

  // Cálculo de LTV
  const valorF = Number(valorFinanciado) || 0;
  const ltv = veiculoFipe ? (valorF / veiculoFipe.valorFipe) * 100 : 0;
  
  let badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  let badgeText = "Excelente (Baixo Risco)";
  if (ltv >= 100) {
    badgeColor = "bg-destructive/10 text-destructive border-destructive/20";
    badgeText = "Risco Crítico (LTV > 100%)";
  } else if (ltv >= 80) {
    badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    badgeText = "Atenção (LTV Elevado)";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display">Novo Contrato (Financiamento)</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <label className="block">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Motor de Consulta Veicular (FIPE)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ABC-1234 ou ABC1D23"
                  value={placaInput}
                  onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60 font-mono text-lg tracking-widest text-center"
                />
                <button
                  onClick={handleBuscarPlaca}
                  disabled={loadingSearch}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar Dados
                </button>
              </div>
            </label>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              A busca preencherá automaticamente os dados do veículo e a Tabela FIPE atualizada.
            </div>
          </div>
        )}

        {step === 2 && veiculoFipe && (
          <form onSubmit={handleSave} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
            
            {/* Resumo do Veículo MOCKADO/FIPE */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5">
                <Car className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-sm">{veiculoFipe.marca} {veiculoFipe.modelo}</p>
                <p className="text-[11px] text-muted-foreground">Placa: {veiculoFipe.placa} | Ano: {veiculoFipe.anoFabricacao}/{veiculoFipe.anoModelo}</p>
                <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5" /> FIPE Atual: {brl(veiculoFipe.valorFipe)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <label className="block">
                <span className="text-xs text-muted-foreground">Cliente</span>
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
                  required
                >
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.cpf})</option>)}
                </select>
                {/* Dica OCR */}
                {(() => {
                  try {
                    const d = JSON.parse(localStorage.getItem('draft_contrato') || '{}');
                    if (d.nomeImportado && !clienteId) {
                      return <p className="mt-1 text-[10px] text-emerald-400">OCR Sugere: {d.nomeImportado} ({d.cpfImportado})</p>;
                    }
                  } catch(e){}
                  return null;
                })()}
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Lojista Origem</span>
                <select
                  value={lojistaId}
                  onChange={e => setLojistaId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
                  required
                >
                  <option value="">Selecione...</option>
                  {lojistas.map(l => <option key={l.id} value={l.id}>{l.razao_social}</option>)}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-muted-foreground">Banco Financiador</span>
                <select
                  value={banco}
                  onChange={e => setBanco(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
                >
                  <option value="Daycoval">Daycoval</option>
                  <option value="BV Financeira">BV Financeira</option>
                </select>
              </label>
              
              <label className="block">
                <span className="text-xs text-muted-foreground">Valor Parcela (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorParcela}
                  onChange={e => setValorParcela(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
                />
              </label>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Valor Financiado Total (R$) *</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={valorFinanciado}
                    onChange={e => setValorFinanciado(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-xl font-bold text-gold outline-none transition-colors focus:border-gold/60"
                  />
                </label>
                
                <label className="block">
                  <span className="text-xs text-muted-foreground">Comissão Estimada AL (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={comissaoPromotora}
                    onChange={e => setComissaoPromotora(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xl font-bold text-emerald-400 outline-none transition-colors focus:border-emerald-500/50"
                  />
                </label>
              </div>

              <div className="mt-4 mb-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Troco na Troca (Opcional - R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={trocoNaTroca}
                    onChange={e => setTrocoNaTroca(e.target.value)}
                    placeholder="Ex: 5000.00"
                    className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
                  />
                </label>
              </div>
              
              {/* LTV Badge */}
              <div className="mt-4 flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                <span className="text-xs text-muted-foreground font-semibold">LTV (Loan-to-Value) Calculado:</span>
                <div className={`px-2 py-1 rounded border text-[11px] font-bold ${badgeColor}`}>
                  {ltv.toFixed(1)}% — {badgeText}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <span className="text-xs text-muted-foreground font-semibold mb-3 block uppercase tracking-wide">Checklist de Formalização</span>
              <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-white/5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checkDut} onChange={e => setCheckDut(e.target.checked)} className="rounded border-white/20 bg-black/50 text-gold focus:ring-gold/30 h-4 w-4" />
                  <span className="text-sm text-white">DUT Emitido e Assinado</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checkContrato} onChange={e => setCheckContrato(e.target.checked)} className="rounded border-white/20 bg-black/50 text-gold focus:ring-gold/30 h-4 w-4" />
                  <span className="text-sm text-white">Contrato Físico/Digital Assinado</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checkBiometria} onChange={e => setCheckBiometria(e.target.checked)} className="rounded border-white/20 bg-black/50 text-gold focus:ring-gold/30 h-4 w-4" />
                  <span className="text-sm text-white">Biometria Facial (OK)</span>
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Fichas sem checklist completo entrarão no "Kanban de Devoluções / Pendências".
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-4 rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-3 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90"
            >
              Criar Contrato & Gerar Esteira
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
