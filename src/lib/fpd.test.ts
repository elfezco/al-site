import { describe, it, expect } from "vitest";

// Função extraída do store para testes unitários da regra de negócio
export function calcularVencimentosFPD(dataContrato: Date): string[] {
  return [30, 60, 90].map((dias) => {
    const data = new Date(dataContrato);
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  });
}

describe("Regras de Negócio FPD (First Payment Default)", () => {
  it("Deve gerar 3 parcelas com espaçamento exato de 30, 60 e 90 dias", () => {
    // Simulando aprovação de contrato hoje (01/01/2026)
    const dataContrato = new Date("2026-01-01T12:00:00Z");
    const vencimentos = calcularVencimentosFPD(dataContrato);

    expect(vencimentos).toHaveLength(3);
    expect(vencimentos[0]).toBe("2026-01-31"); // 31 de janeiro (+30)
    expect(vencimentos[1]).toBe("2026-03-02"); // 2 de março (+60 considerando ano normal)
    expect(vencimentos[2]).toBe("2026-04-01"); // 1 de abril (+90)
  });

  it("Deve lidar corretamente com anos bissextos (Fev 2024)", () => {
    const dataContrato = new Date("2024-02-01T12:00:00Z");
    const vencimentos = calcularVencimentosFPD(dataContrato);

    expect(vencimentos[0]).toBe("2024-03-02"); // +30 dias de 1 Fev é 2 Março num ano bissexto
  });
});
