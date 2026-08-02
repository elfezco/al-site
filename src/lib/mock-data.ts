import type { Cliente, Contrato, Lojista, ParcelaFPD, ParcelaStatus } from "./types";
import { isoOffset } from "./format";

export const lojistasSeed: Lojista[] = [
  { id: "L1", razao_social: "Auto Center Prime LTDA", contato_whatsapp: "5511988770011", chave_pix: "12.345.678/0001-90" },
  { id: "L2", razao_social: "Veículos São Jorge ME", contato_whatsapp: "5511977660022", chave_pix: "saojorge@pix.com.br" },
  { id: "L3", razao_social: "Multimarcas Andrade", contato_whatsapp: "5521966550033", chave_pix: "21966550033" },
  { id: "L4", razao_social: "Garagem Nobre Motors", contato_whatsapp: "5531955440044", chave_pix: "nobre@motors.com" },
  { id: "L5", razao_social: "RN Seminovos", contato_whatsapp: "5541944330055", chave_pix: "45.998.112/0001-33" },
];

export const clientesSeed: Cliente[] = [
  { id: "C1", nome: "João Batista Ferreira", cpf: "324.887.110-45", telefone: "5511991234567" },
  { id: "C2", nome: "Maria Aparecida Souza", cpf: "118.554.902-11", telefone: "5511992345678" },
  { id: "C3", nome: "Carlos Eduardo Lima", cpf: "907.221.334-08", telefone: "5521993456789" },
  { id: "C4", nome: "Fernanda Rocha Alves", cpf: "455.100.288-77", telefone: "5531994567890" },
  { id: "C5", nome: "Rafael Monteiro Dias", cpf: "622.019.845-30", telefone: "5541995678901" },
  { id: "C6", nome: "Patrícia Nogueira", cpf: "781.334.220-16", telefone: "5511996789012" },
  { id: "C7", nome: "Anderson Silva Prado", cpf: "233.876.451-99", telefone: "5511997890123" },
  { id: "C8", nome: "Juliana Campos Reis", cpf: "540.998.117-24", telefone: "5521998901234" },
  { id: "C9", nome: "Marcos Vinícius Teles", cpf: "665.443.229-51", telefone: "5531999012345" },
  { id: "C10", nome: "Simone Barbosa Melo", cpf: "812.775.330-62", telefone: "5541990123456" },
  { id: "C11", nome: "Diego Fontes Ribeiro", cpf: "199.882.774-05", telefone: "5511991112233" },
  { id: "C12", nome: "Luciana Prado Martins", cpf: "377.221.669-84", telefone: "5511992223344" },
];

interface Seed {
  cliente: string;
  lojista: string;
  banco: Contrato["banco"];
  placa: string;
  modelo: string;
  financiado: number;
  parcela: number;
  venc1: number;
  pagas: number;
}

const seeds: Seed[] = [
  { cliente: "C1", lojista: "L1", banco: "Daycoval", placa: "RTF-4B21", modelo: "Honda Civic EXL 2019", financiado: 78000, parcela: 2180, venc1: -6, pagas: 0 },
  { cliente: "C2", lojista: "L2", banco: "BV Financeira", placa: "QJK-7C09", modelo: "Fiat Argo Drive 2021", financiado: 52000, parcela: 1490, venc1: 2, pagas: 0 },
  { cliente: "C3", lojista: "L1", banco: "BV Financeira", placa: "PLM-1A88", modelo: "Toyota Corolla XEI 2020", financiado: 96000, parcela: 2640, venc1: 12, pagas: 0 },
  { cliente: "C4", lojista: "L3", banco: "Daycoval", placa: "SXD-9F33", modelo: "Jeep Renegade Sport 2018", financiado: 68500, parcela: 1980, venc1: -33, pagas: 1 },
  { cliente: "C5", lojista: "L4", banco: "Daycoval", placa: "RGT-5H72", modelo: "VW T-Cross Comfort 2022", financiado: 105000, parcela: 2890, venc1: 3, pagas: 1 },
  { cliente: "C6", lojista: "L2", banco: "BV Financeira", placa: "MNB-2K54", modelo: "Hyundai HB20 Vision 2021", financiado: 47000, parcela: 1320, venc1: 18, pagas: 1 },
  { cliente: "C7", lojista: "L5", banco: "BV Financeira", placa: "KTE-8P17", modelo: "Chevrolet Onix LTZ 2020", financiado: 58000, parcela: 1610, venc1: -70, pagas: 2 },
  { cliente: "C8", lojista: "L3", banco: "Daycoval", placa: "HDF-3R95", modelo: "Renault Duster Zen 2019", financiado: 61000, parcela: 1750, venc1: -58, pagas: 2 },
  { cliente: "C9", lojista: "L1", banco: "Daycoval", placa: "BVC-6T40", modelo: "Ford Ranger XLS 2017", financiado: 112000, parcela: 3150, venc1: 9, pagas: 2 },
  { cliente: "C10", lojista: "L4", banco: "BV Financeira", placa: "ZWQ-4M63", modelo: "Nissan Kicks SV 2021", financiado: 84000, parcela: 2310, venc1: -40, pagas: 3 },
  { cliente: "C11", lojista: "L5", banco: "Daycoval", placa: "YUI-7N28", modelo: "Peugeot 208 Griffe 2022", financiado: 72000, parcela: 2050, venc1: -35, pagas: 3 },
  { cliente: "C12", lojista: "L2", banco: "BV Financeira", placa: "GTR-1S86", modelo: "Honda HR-V EX 2020", financiado: 91000, parcela: 2470, venc1: -32, pagas: 3 },
];

export const contratosSeed: Contrato[] = seeds.map((s, i) => ({
  id: `CT-${String(1001 + i)}`,
  cliente_id: s.cliente,
  lojista_id: s.lojista,
  banco: s.banco,
  veiculo: { placa: s.placa, modelo: s.modelo },
  valor_financiado: s.financiado,
  valor_parcela: s.parcela,
  data_contrato: isoOffset(s.venc1 - 30),
}));

export const parcelasSeed: ParcelaFPD[] = seeds.flatMap((s, i) => {
  const contratoId = `CT-${String(1001 + i)}`;
  return ([1, 2, 3] as const).map((n) => {
    const venc = s.venc1 + (n - 1) * 30;
    const status: ParcelaStatus = n <= s.pagas ? "Pago" : venc < 0 ? "Atrasado" : "Pendente";
    return {
      id: `${contratoId}-P${n}`,
      contrato_id: contratoId,
      numero_parcela: n,
      data_vencimento: isoOffset(venc),
      status,
    };
  });
});
