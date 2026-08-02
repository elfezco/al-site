export type Banco = "Daycoval" | "BV Financeira";

export type ParcelaStatus = "Pendente" | "Pago" | "Atrasado";

export type TipoDocumento = "CNH" | "Comprovante Residência" | "Contrato Assinado" | "Boleto" | "Outro";

export interface Lojista {
  id: string;
  razao_social: string;
  contato_whatsapp: string;
  socio_nome?: string;
  socio_telefone?: string;
  endereco?: string;
  fichas_enviadas?: number;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  endereco?: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano?: number;
  cor?: string;
  chassi?: string;
  renavam?: string;
}

export interface Contrato {
  id: string;
  cliente_id: string;
  lojista_id: string;
  veiculo_id?: string;
  banco: Banco;
  veiculo?: { placa: string; modelo: string }; // legado JSONB
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
  valor_boleto?: number;
  nosso_numero?: string;
}

export interface Documento {
  id: string;
  contrato_id: string;
  nome: string;
  tipo: TipoDocumento;
  url: string;
  tamanho_bytes?: number;
  created_at?: string;
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
