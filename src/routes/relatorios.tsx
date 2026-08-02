import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet, Download, Filter, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { useStore } from "@/lib/store";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { brl, dataBR } from "@/lib/format";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [{ title: "Relatórios — AL Finanças & Negócios" }],
  }),
  component: RelatoriosPage,
});

function getQuinzenaName(dataStr: string) {
  const data = new Date(dataStr);
  const dia = data.getUTCDate();
  const mes = data.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
  const ano = data.getUTCFullYear();
  
  if (dia <= 15) return `1ª Quinzena de ${mes}/${ano}`;
  return `2ª Quinzena de ${mes}/${ano}`;
}

function RelatoriosPage() {
  const { views, lojistas } = useStore();
  const loading = useSimulatedLoad();
  
  const [bancoFilter, setBancoFilter] = useState<string>("Todos");
  const [lojistaFilter, setLojistaFilter] = useState<string>("Todos");
  const [quinzenaFilter, setQuinzenaFilter] = useState<string>("Todas");

  // Extract all unique quinzenas from contracts
  const quinzenas = useMemo(() => {
    const q = new Set<string>();
    views.forEach(v => {
      q.add(getQuinzenaName(v.contrato.data_contrato));
    });
    return Array.from(q).sort((a, b) => a.localeCompare(b));
  }, [views]);

  const dadosFiltrados = useMemo(() => {
    return views.filter((v) => {
      const passBanco = bancoFilter === "Todos" || v.contrato.banco === bancoFilter;
      const passLojista = lojistaFilter === "Todos" || v.lojista.id === lojistaFilter;
      const passQuinzena = quinzenaFilter === "Todas" || getQuinzenaName(v.contrato.data_contrato) === quinzenaFilter;
      return passBanco && passLojista && passQuinzena;
    });
  }, [views, bancoFilter, lojistaFilter, quinzenaFilter]);

  const subtotalVolume = dadosFiltrados.reduce((acc, v) => acc + Number(v.contrato.valor_financiado), 0);
  const ticketMedio = dadosFiltrados.length > 0 ? subtotalVolume / dadosFiltrados.length : 0;
  
  const topLojista = useMemo(() => {
    if (dadosFiltrados.length === 0) return "N/D";
    const counts: Record<string, number> = {};
    dadosFiltrados.forEach(v => {
      counts[v.lojista.razao_social] = (counts[v.lojista.razao_social] || 0) + Number(v.contrato.valor_financiado);
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
  }, [dadosFiltrados]);

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Cor Azul Escuro (ex: #1b273a)
      const primaryColor: [number, number, number] = [27, 39, 58];
      
      // Header Box
      doc.setFillColor(...primaryColor);
      doc.roundedRect(14, 15, pageWidth - 28, 25, 3, 3, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Relatório Quinzenal de Vendas", pageWidth / 2, 26, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let subtitle = `AL Finanças - Filial 920 | ${quinzenaFilter !== "Todas" ? quinzenaFilter : "Todas as Quinzenas"}`;
      if (lojistaFilter !== "Todos") {
        const lojName = lojistas.find(l => l.id === lojistaFilter)?.razao_social;
        subtitle += ` | Lojista: ${lojName}`;
      }
      doc.text(subtitle, pageWidth / 2, 34, { align: "center" });
      
      // KPI Cards
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(255, 255, 255);
      
      const cardWidth = (pageWidth - 28 - 9) / 4;
      const cardY = 48;
      const cardH = 22;
      
      const drawCard = (index: number, label: string, value: string, isBig: boolean = false) => {
        const x = 14 + (cardWidth + 3) * index;
        doc.roundedRect(x, cardY, cardWidth, cardH, 2, 2, "FD");
        
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        const splitLabel = doc.splitTextToSize(label, cardWidth - 2);
        doc.text(splitLabel, x + cardWidth/2, cardY + 7, { align: "center" });
        
        doc.setFontSize(isBig ? 12 : 11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        
        const splitValue = doc.splitTextToSize(value, cardWidth - 2);
        doc.text(splitValue, x + cardWidth/2, cardY + (splitLabel.length * 3) + 7, { align: "center" });
      };
      
      drawCard(0, "TOTAL DE\nOPERAÇÕES", String(dadosFiltrados.length), true);
      drawCard(1, "VOLUME TOTAL", brl(subtotalVolume));
      drawCard(2, "TICKET MÉDIO", brl(ticketMedio));
      drawCard(3, "VENDEDOR\nDESTAQUE", topLojista);

      // Section Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text("Detalhamento dos Contratos", 14, 85);
      
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(14, 88, pageWidth - 14, 88);

      const tableData = dadosFiltrados.map((v) => [
        dataBR(v.contrato.data_contrato),
        v.cliente.nome,
        v.contrato.banco === "Daycoval" ? "CDC LEVES PF" : "LEVES PF DIGITAL",
        v.contrato.veiculo?.modelo || "N/D",
        brl(Number(v.contrato.valor_financiado)),
      ]);

      autoTable(doc, {
        startY: 92,
        head: [["Data", "Cliente", "Produto / Modalidade", "Veículo Financiado", "Valor da Operação"]],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          textColor: primaryColor,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          textColor: [60, 60, 60],
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          // Draw gray background for "Produto / Modalidade" column body
          if (data.section === 'body' && data.column.index === 2) {
            doc.setFillColor(235, 235, 235);
            doc.roundedRect(data.cell.x + 2, data.cell.y + 1, data.cell.width - 4, data.cell.height - 2, 1, 1, "F");
            doc.setTextColor(80, 80, 80);
            doc.text(data.cell.text, data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2 + 1, { align: "center", baseline: "middle" });
          }
        },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            // clear text so didDrawCell draws it
            data.cell.text = [];
          }
        }
      });

      doc.save(`Relatorio_AL_Financas_${new Date().getTime()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const exportExcel = () => {
    try {
      const exportData = dadosFiltrados.map((v) => ({
        "Quinzena": getQuinzenaName(v.contrato.data_contrato),
        "Data do Contrato": dataBR(v.contrato.data_contrato),
        "Lojista (Origem)": v.lojista.razao_social,
        "Nome do Cliente": v.cliente.nome,
        "CPF": v.cliente.cpf,
        "Banco": v.contrato.banco,
        "Valor Financiado (R$)": Number(v.contrato.valor_financiado),
        "Valor Parcela (R$)": Number(v.contrato.valor_parcela),
        "Situação de Risco": v.risco.toUpperCase(),
        "Veículo Modelo": v.contrato.veiculo?.modelo || "—",
        "Veículo Placa": v.contrato.veiculo?.placa || "—",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
      
      XLSX.writeFile(workbook, `Relatorio_AL_Financas_${new Date().getTime()}.xlsx`);
      toast.success("Planilha Excel gerada com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar Excel.");
    }
  };

  return (
    <AppShell title="Relatórios e Exportação" subtitle="Extração de dados para PDF e planilhas (Excel/CSV)">
      
      <div className="grid gap-6 md:grid-cols-4">
        {/* Filtros */}
        <div className="card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] md:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gold" />
            <h2 className="font-display font-semibold">Filtros Avançados</h2>
          </header>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-muted-foreground">Período (Quinzena)</span>
              <select
                value={quinzenaFilter}
                onChange={(e) => setQuinzenaFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
              >
                <option value="Todas">Todas as datas</option>
                {quinzenas.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-muted-foreground">Lojista Parceiro</span>
              <select
                value={lojistaFilter}
                onChange={(e) => setLojistaFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
              >
                <option value="Todos">Todos os lojistas</option>
                {lojistas.map(l => <option key={l.id} value={l.id}>{l.razao_social}</option>)}
              </select>
            </label>

            <label className="block col-span-2">
              <span className="text-xs text-muted-foreground">Banco Parceiro</span>
              <select
                value={bancoFilter}
                onChange={(e) => setBancoFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm outline-none transition-colors focus:border-gold/60"
              >
                <option value="Todos">Todos os bancos</option>
                <option value="Daycoval">Daycoval</option>
                <option value="BV Financeira">BV Financeira</option>
              </select>
            </label>
          </div>
        </div>

        {/* Ações de Exportação */}
        <div className="card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] md:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-gold" />
            <h2 className="font-display font-semibold">Opções de Download</h2>
          </header>
          
          <div className="grid gap-4 sm:grid-cols-2 h-32">
            <button
              onClick={exportPDF}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
            >
              <FileDown className="h-6 w-6 text-red-400 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Relatório em PDF</p>
                <p className="text-[10px] text-muted-foreground">Ideal para repasse quinzenal</p>
              </div>
            </button>

            <button
              onClick={exportExcel}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet className="h-6 w-6 text-emerald-400 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Planilha Excel</p>
                <p className="text-[10px] text-muted-foreground">Dados brutos (.xlsx)</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8">
          <LoadingBlock label="Calculando dados do relatório…" />
        </div>
      ) : (
        <div className="mt-8 card-surface overflow-hidden rounded-xl shadow-[var(--shadow-elegant)]">
          <header className="border-b border-white/5 px-5 py-4 flex justify-between items-center bg-[#111218]">
            <h3 className="font-display text-sm font-semibold">
              Pré-visualização ({dadosFiltrados.length} registros)
            </h3>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Volume Subtotal</span>
              <span className="font-display font-bold text-gold text-lg">{brl(subtotalVolume)}</span>
            </div>
          </header>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="sticky top-0 bg-[#15171e] shadow-sm z-10">
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Lojista</th>
                  <th className="px-5 py-3">Banco</th>
                  <th className="px-5 py-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((v) => (
                  <tr key={v.contrato.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 text-muted-foreground">{dataBR(v.contrato.data_contrato)}</td>
                    <td className="px-5 py-3 font-medium">
                      {v.cliente.nome}
                      <span className="block text-[11px] text-muted-foreground">{v.contrato.veiculo?.modelo || "Sem veículo"}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{v.lojista.razao_social}</td>
                    <td className="px-5 py-3 text-muted-foreground">{v.contrato.banco}</td>
                    <td className="px-5 py-3 text-right text-gold font-medium">{brl(Number(v.contrato.valor_financiado))}</td>
                  </tr>
                ))}
                {dadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhum contrato corresponde aos filtros atuais.
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
