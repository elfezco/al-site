import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet, Download, Filter } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LoadingBlock } from "@/components/GoldSpinner";
import { useStore } from "@/lib/store";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { brl, dataBR } from "@/lib/format";

// Imports for export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [{ title: "Relatórios — AL Finanças & Negócios" }],
  }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { views } = useStore();
  const loading = useSimulatedLoad();
  const [bancoFilter, setBancoFilter] = useState<string>("Todos");

  const dadosFiltrados = views.filter((v) => 
    bancoFilter === "Todos" ? true : v.contrato.banco === bancoFilter
  );

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Contratos - AL Finanças", 14, 15);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Filtro: Banco ${bancoFilter} | Total: ${dadosFiltrados.length} contratos`, 14, 22);

      const tableData = dadosFiltrados.map((v) => [
        v.cliente.nome,
        v.cliente.cpf,
        v.lojista.razao_social,
        v.contrato.banco,
        brl(Number(v.contrato.valor_financiado)),
        v.risco.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 30,
        head: [["Cliente", "CPF", "Lojista", "Banco", "Volume", "Risco"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [184, 134, 11] }, // Dark Gold
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
        "Nome do Cliente": v.cliente.nome,
        "CPF": v.cliente.cpf,
        "Lojista (Origem)": v.lojista.razao_social,
        "Banco": v.contrato.banco,
        "Data do Contrato": dataBR(v.contrato.data_contrato),
        "Valor Financiado (R$)": Number(v.contrato.valor_financiado),
        "Valor Parcela (R$)": Number(v.contrato.valor_parcela),
        "Situação de Risco": v.risco.toUpperCase(),
        "Veículo Modelo": v.contrato.veiculo?.modelo || "—",
        "Veículo Placa": v.contrato.veiculo?.placa || "—",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contratos");
      
      XLSX.writeFile(workbook, `Relatorio_AL_Financas_${new Date().getTime()}.xlsx`);
      toast.success("Planilha Excel gerada com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar Excel.");
    }
  };

  return (
    <AppShell title="Relatórios e Exportação" subtitle="Extração de dados para PDF e planilhas (Excel/CSV)">
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Filtros */}
        <div className="card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] md:col-span-1">
          <header className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gold" />
            <h2 className="font-display font-semibold">Filtros Avançados</h2>
          </header>
          
          <div className="space-y-4">
            <label className="block">
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
            
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs text-gold/80">
              Mais filtros de data, status e lojista podem ser adicionados conforme a necessidade da operação.
            </div>
          </div>
        </div>

        {/* Ações de Exportação */}
        <div className="card-surface rounded-xl p-5 shadow-[var(--shadow-elegant)] md:col-span-2">
          <header className="mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-gold" />
            <h2 className="font-display font-semibold">Opções de Download</h2>
          </header>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={exportPDF}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/20 p-6 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
            >
              <FileDown className="h-8 w-8 text-red-400 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <p className="font-semibold text-white">Relatório em PDF</p>
                <p className="text-xs text-muted-foreground">Formato ideal para impressão e envio</p>
              </div>
            </button>

            <button
              onClick={exportExcel}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/20 p-6 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet className="h-8 w-8 text-emerald-400 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <p className="font-semibold text-white">Planilha Excel (.xlsx)</p>
                <p className="text-xs text-muted-foreground">Dados brutos para análise financeira</p>
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
          <header className="border-b border-white/5 px-5 py-4">
            <h3 className="font-display text-sm font-semibold">Pré-visualização dos Dados ({dadosFiltrados.length} registros)</h3>
          </header>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="sticky top-0 bg-[#111218] shadow-sm">
                <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Banco</th>
                  <th className="px-5 py-3">Volume</th>
                  <th className="px-5 py-3">Risco</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((v) => (
                  <tr key={v.contrato.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">
                      {v.cliente.nome}
                      <span className="block text-[11px] text-muted-foreground">{v.lojista.razao_social}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{v.contrato.banco}</td>
                    <td className="px-5 py-3 text-gold">{brl(Number(v.contrato.valor_financiado))}</td>
                    <td className="px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      {v.risco}
                    </td>
                  </tr>
                ))}
                {dadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhum contrato corresponde aos filtros.
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
