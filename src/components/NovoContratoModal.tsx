import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Loader2, Car, Banknote } from "lucide-react";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";

// Simulador da API FIPE / Placas
const simularConsultaPlaca = async (placa: string) => {
  const p = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return new Promise((resolve) => {
    setTimeout(() => {
      if (p === "LRS9B45") {
        resolve({
          placa: p,
          marca: "VOLKSWAGEN",
          modelo: "SAVEIRO CROSS 1.6 T.FLEX 16V CE",
          anoModelo: 2021,
          anoFabricacao: 2020,
          chassi: "9BWSB45U" + Math.floor(Math.random() * 1000000),
          renavam: "0123" + Math.floor(Math.random() * 100000),
          valorFipe: 78500.00,
        });
      } else {
        resolve({
          placa: p,
          marca: "VOLKSWAGEN",
          modelo: "GOL TRENDLINE 1.0 T.FLEX 12V 5P",
          anoModelo: 2018,
          anoFabricacao: 2017,
          chassi: "9BWAB45U" + Math.floor(Math.random() * 1000000),
          renavam: "0123" + Math.floor(Math.random() * 100000),
          valorFipe: 38500.00,
        });
      }
    }, 1500);
  });
};

export function NovoContratoModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { clientes, lojistas, addCliente, addVeiculo, criarContrato, ocrData, setOcrData } = useStore();
  const [step, setStep] = useState(1);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // OCR Temp State
  const [ocrTelefone, setOcrTelefone] = useState("");
  
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
      if (ocrData) {
        setStep(2);
        setPlacaInput(ocrData.placa || "");
        setVeiculoFipe({
          placa: ocrData.placa,
          marca: "Veículo",
          modelo: ocrData.modelo || "Importado via OCR",
          anoModelo: new Date().getFullYear(),
          anoFabricacao: new Date().getFullYear(),
          chassi: "OCR" + Math.floor(Math.random() * 100000),
          renavam: "012" + Math.floor(Math.random() * 100000),
          valorFipe: ocrData.valorFinanciado || 40000,
        });
        setValorFinanciado(ocrData.valorFinanciado ? String(ocrData.valorFinanciado) : "");
        setValorParcela(ocrData.valorParcela ? String(ocrData.valorParcela) : "");
        if (ocrData.lojistaId) setLojistaId(ocrData.lojistaId);
        if (ocrData.banco) setBanco(ocrData.banco);
        
        // Verifica se cliente já existe
        const c = clientes.find(c => c.cpf === ocrData.cpf);
        if (c) setClienteId(c.id);
        else setClienteId("NOVO_VIA_OCR");
        
        return; // Don't load draft if using OCR
      }

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
        } catch(e){}
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
        setOcrTelefone("");
        setCheckDut(false);
        setCheckContrato(false);
        setCheckBiometria(false);
      }
    } else {
      if (!open && ocrData) {
        setOcrData(null);
      }
    }
  }, [open, ocrData, clientes]);

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
    if (clienteId === "NOVO_VIA_OCR" && !ocrTelefone) {
      toast.error("Preencha o Telefone do novo cliente importado");
      return;
    }
    
    try {
      let finalClienteId = clienteId;
      
      // 0. Cadastrar Cliente via OCR se necessário
      if (clienteId === "NOVO_VIA_OCR" && ocrData) {
        finalClienteId = "CLI-" + Math.random().toString(36).substr(2, 9);
        await addCliente({
          id: finalClienteId,
          nome: ocrData.nome,
          cpf: ocrData.cpf,
          telefone: ocrTelefone.replace(/\D/g, '')
        } as any);
      }

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
        cliente_id: finalClienteId,
        lojista_id: lojistaId,
        banco: banco as any,
        veiculo_id: veiculoId,
        veiculo: { placa: veiculoFipe.placa, modelo: veiculoFipe.modelo },
        valor_financiado: Number(valorFinanciado),
        valor_parcela: Number(valorParcela),
        comissao_promotora: comissaoPromotora ? Number(comissaoPromotora) : 0,
        valor_troco_na_troca: trocoNaTroca ? Number(trocoNaTroca) : 0,
        checklist_dut: checkDut,
        checklist_contrato: checkContrato,
        checklist_biometria: checkBiometria,
        status_formalizacao: (checkDut && checkContrato && checkBiometria) ? 'Formalizado' : 'Pendente',
      });

      localStorage.removeItem('draft_contrato');
      if (ocrData) setOcrData(null);
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
                  placeholder="Placa: ABC-1234"
                  value={placaInput}
                  onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60 font-mono text-lg tracking-widest text-center"
                />
              </div>
            </label>
            
            <div className="pt-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Seleção na Tabela FIPE</span>
              <select 
                className="w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60 mb-2"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  setVeiculoFipe({
                    placa: placaInput.replace(/[^A-Z0-9]/g, "") || "ABC0000",
                    marca: val.split("|")[0],
                    modelo: val.split("|")[1],
                    anoModelo: parseInt(val.split("|")[2]),
                    anoFabricacao: parseInt(val.split("|")[2]) - 1,
                    chassi: "9BW" + Math.floor(Math.random() * 1000000),
                    renavam: "0123" + Math.floor(Math.random() * 100000),
                    valorFipe: parseFloat(val.split("|")[3])
                  });
                  setStep(2);
                  if (!valorFinanciado) setValorFinanciado(val.split("|")[3]);
                  toast.success("Veículo FIPE selecionado!");
                }}
              >
                <option value="">Selecione o Veículo FIPE...</option>
                <option value="VOLKSWAGEN|GOL TRENDLINE 1.0 T.FLEX 12V 5P|2018|38500">VW Gol Trendline 1.0 2018 (R$ 38.500)</option>
                <option value="VOLKSWAGEN|SAVEIRO CROSS 1.6 T.FLEX 16V CE|2021|78500">VW Saveiro Cross 1.6 2021 (R$ 78.500)</option>
                <option value="CHEVROLET|ONIX HATCH LT 1.0 8V FLEX 5P|2020|55000">GM Onix Hatch LT 1.0 2020 (R$ 55.000)</option>
                <option value="FIAT|ARGO DRIVE 1.0 6V FLEX 5P|2022|62000">Fiat Argo Drive 1.0 2022 (R$ 62.000)</option>
                <option value="HONDA|CIVIC SEDAN EXL 2.0 FLEX 16V AUT|2019|95000">Honda Civic EXL 2.0 2019 (R$ 95.000)</option>
                <option value="TOYOTA|COROLLA XEI 2.0 FLEX 16V AUT|2021|120000">Toyota Corolla XEI 2.0 2021 (R$ 120.000)</option>
                <option value="HYUNDAI|HB20 COMFORT 1.0 FLEX 12V 5P|2023|75000">Hyundai HB20 Comfort 1.0 2023 (R$ 75.000)</option>
                <option value="RENAULT|KWID ZEN 1.0 FLEX 12V 5P|2022|48000">Renault Kwid Zen 1.0 2022 (R$ 48.000)</option>
                <option value="FORD|KA SEDAN SE 1.5 FLEX 16V 4P|2018|45000">Ford Ka Sedan SE 1.5 2018 (R$ 45.000)</option>
                <option value="NISSAN|KICKS SL 1.6 FLEX 16V AUT|2020|88000">Nissan Kicks SL 1.6 2020 (R$ 88.000)</option>
              </select>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              A seleção preencherá os dados do veículo e a Tabela FIPE atualizada. Placa-FIPE integrações exigem plano Sinesp/ApiBrasil.
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
                {clienteId === "NOVO_VIA_OCR" ? (
                  <div className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                    <p className="text-sm font-medium text-emerald-400">Cliente Novo (Via OCR)</p>
                    <p className="text-xs text-white/70">Nome: {ocrData?.nome}</p>
                    <p className="text-xs text-white/70">CPF: {ocrData?.cpf}</p>
                    
                    <div className="pt-2">
                      <span className="text-[10px] text-destructive font-bold uppercase tracking-wider">Telefone (Obrigatório) *</span>
                      <input
                        type="tel"
                        required
                        placeholder="(00) 00000-0000"
                        value={ocrTelefone}
                        onChange={(e) => setOcrTelefone(e.target.value)}
                        className="mt-1 w-full rounded-md border border-destructive/50 bg-black/50 px-3 py-2 text-sm outline-none focus:border-destructive"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={clienteId}
                    onChange={e => setClienteId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
                    required
                  >
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.cpf})</option>)}
                  </select>
                )}
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
