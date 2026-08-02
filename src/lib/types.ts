export type Banco = "Daycoval" | "BV Financeira";

export type ParcelaStatus = "Pendente" | "Pago" | "Atrasado";

export interface Lojista {
  id: string;
  razao_social: string;
  contato_whatsapp: string;
  chave_pix: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
}

export interface Contrato {
  id: string;
  cliente_id: string;
  lojista_id: string;
  banco: Banco;
  veiculo: { placa: string; modelo: string };
  valor_financiado: number;
  valor_parcela: number;
  data_contrato: string;
}

export interface ParcelaFPD {
  id: string;
  contrato_id: string;
  numero_parcela: 1 | 2 | 3;
  data_vencimento: string;
  status: ParcelaStatus;
}

export type RiscoNivel = "seguro" | "atencao" | "critico" | "blindado";

export interface ContratoView {
  contrato: Contrato;
  cliente: Cliente;
  lojista: Lojista;
  parcelas: ParcelaFPD[];
  parcelaAtual: ParcelaFPD | null;
  diasParaVencimento: number | null;
  risco: RiscoNivel;
  etapa: 1 | 2 | 3 | 4;
}
