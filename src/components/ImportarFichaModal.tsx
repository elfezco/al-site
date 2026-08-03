import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Wand2, MessageSquare } from "lucide-react";
import Tesseract from "tesseract.js";
import { useStore } from "@/lib/store";
import * as pdfjsLib from "pdfjs-dist";

// Configuração do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export function ImportarFichaModal({ open, onOpenChange, onFichaLida }: { open: boolean, onOpenChange: (open: boolean) => void, onFichaLida: () => void }) {
  const { setOcrData, lojistas } = useStore();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lojistaId, setLojistaId] = useState("");
  const [banco, setBanco] = useState("Daycoval");
  const [whatsappText, setWhatsappText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type === "application/pdf") {
      processPDF(file);
    } else {
      // Preview Imagem
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      processOCR(file);
    }
  };

  const processPDF = async (file: File) => {
    setLoading(true);
    toast.info("Extraindo dados do PDF...", { duration: 3000 });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }
      console.log("Texto PDF:", fullText);
      await processText(fullText);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao ler o PDF.");
      setLoading(false);
    }
  };

  const processOCR = async (file: File) => {
    setLoading(true);
    toast.info("Analisando imagem com Inteligência Artificial (OCR)...", { duration: 3000 });
    try {
      const worker = await Tesseract.createWorker("por");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      console.log("Texto OCR:", text);
      await processText(text);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao processar a imagem no OCR.");
      setLoading(false);
    }
  };

  const processWhatsappText = async () => {
    if (!whatsappText.trim()) return;
    setLoading(true);
    await processText(whatsappText);
  };

  const processText = async (text: string) => {
    try {
      // Regex Flexível (Aceita Ficha Daycoval e Ficha WhatsApp)
      const cpfMatch = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/) || text.match(/CPF:\*?\s*([\d.-]+)/i);
      const valorMatch = text.match(/Vlr[.\s]*Operação[\s]*([\d.,]+)/i) || text.match(/Valor Financiado:\*?\s*R\$[\s]*([\d.,]+)/i);
      const parcelaMatch = text.match(/Vlr[.\s]*Parc[.\s]*([\d.,]+)/i);
      
      let nomeMatch = text.match(/Nome:\*?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+)(?:\n|\*|RG|Data)/i);
      if (!nomeMatch) {
        nomeMatch = text.match(/Cliente\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
      }
      
      const placaMatch = text.match(/Placa:\s*([A-Z0-9]{7})/i);
      const modeloMatch = text.match(/Bem Financiado:\s*(.*?)\s+Ano/i);

      let cpf = cpfMatch ? (cpfMatch[1] || cpfMatch[0]!).trim() : "";
      let valorFinanciado = valorMatch ? Number(valorMatch[1]!.replace(/\./g, "").replace(",", ".")) : 0;
      let valorParcela = parcelaMatch ? Number(parcelaMatch[1]!.replace(/\./g, "").replace(",", ".")) : (valorFinanciado / 48 || 0);
      let nome = nomeMatch ? nomeMatch[1]!.replace(/[*]/g, "").trim() : "";
      let placa = placaMatch ? placaMatch[1]!.toUpperCase() : `OCR${Math.floor(Math.random() * 9000) + 1000}`;
      let modelo = modeloMatch ? modeloMatch[1]!.trim() : "VEÍCULO A DEFINIR";

      if (!cpf || !nome) {
        toast.error("Não foi possível identificar o Cliente (Nome e CPF). Verifique o formato.");
        setLoading(false);
        return;
      }

      toast.success(`Ficha pré-preenchida para ${nome}! Verifique os dados.`);

      // Store Extracted OCR Data globally for NovoContratoModal
      setOcrData({
        cpf,
        nome,
        valorFinanciado,
        valorParcela,
        placa,
        modelo,
        lojistaId,
        banco
      });

      setWhatsappText("");
      setImagePreview(null);
      onOpenChange(false);
      onFichaLida(); 

    } catch (e) {
      console.error(e);
      toast.error("Erro interno ao processar texto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-gold" />
            Scanner Inteligente de Fichas (OCR / PDF / Texto)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            A IA extrairá CPF, Nome, Veículo e Valores. O sistema criará Cliente, Veículo e a Ficha na esteira 100% automatizado.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <label className="block">
              <span className="text-xs text-muted-foreground">Vincular Lojista *</span>
              <select
                value={lojistaId}
                onChange={e => setLojistaId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
              >
                <option value="">Selecione...</option>
                {lojistas.map(l => <option key={l.id} value={l.id}>{l.razao_social}</option>)}
              </select>
            </label>

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
          </div>

          <Tabs defaultValue="arquivo" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/40 border border-white/10">
              <TabsTrigger value="arquivo" className="data-[state=active]:bg-gold data-[state=active]:text-black"><Upload className="w-4 h-4 mr-2"/> PDF / Imagem</TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-gold data-[state=active]:text-black"><MessageSquare className="w-4 h-4 mr-2"/> Texto do WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="arquivo">
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileChange}
              />
              <button
                onClick={() => {
                  if(!lojistaId) { toast.error("Selecione o Lojista antes de escanear."); return; }
                  fileInputRef.current?.click();
                }}
                disabled={loading}
                className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold/30 bg-gold/5 p-10 text-gold hover:bg-gold/10 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="font-medium text-center">Processando arquivo...</span>
                  </>
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded opacity-80" />
                ) : (
                  <>
                    <Upload className="h-8 w-8" />
                    <span className="font-medium text-center">Anexar Print ou PDF<br/><span className="text-xs text-gold/70 font-normal">(ATPV-e, CNH-e, Print do Banco)</span></span>
                  </>
                )}
              </button>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <textarea 
                value={whatsappText}
                onChange={e => setWhatsappText(e.target.value)}
                placeholder="Cole aqui o texto da Ficha de Financiamento que veio do WhatsApp..."
                className="w-full h-40 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-foreground outline-none focus:border-gold/50 resize-none font-mono"
              />
              <button
                onClick={() => {
                  if(!lojistaId) { toast.error("Selecione o Lojista antes de processar."); return; }
                  processWhatsappText();
                }}
                disabled={loading || !whatsappText.trim()}
                className="w-full rounded-lg bg-[linear-gradient(135deg,#FADB5F,#B8860B)] px-4 py-3 font-semibold text-[#0B0C10] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : "Processar Texto Magicamente"}
              </button>
            </TabsContent>
          </Tabs>

          <div className="pt-2 flex justify-center">
             <button 
               onClick={() => {
                 onOpenChange(false);
                 onFichaLida();
               }}
               className="text-sm text-gold hover:underline"
             >
               Ou clique aqui para preencher a Ficha Manualmente
             </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
