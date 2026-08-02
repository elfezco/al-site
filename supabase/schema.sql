-- supabase/schema.sql
-- AL Finanças & Negócios — Schema Completo v2

-- ============================================================
-- Tabela de Lojistas (sem Chave PIX — pagamento é feito pelo banco)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lojistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  contato_whatsapp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Tabela de Clientes (expandida com dados pessoais completos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  rg TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  data_nascimento DATE,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Tabela de Veículos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  modelo TEXT NOT NULL,
  ano INTEGER,
  cor TEXT,
  chassi TEXT,
  renavam TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Tabela de Contratos (com FK para veículo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  lojista_id UUID REFERENCES public.lojistas(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  banco TEXT NOT NULL CHECK (banco IN ('Daycoval', 'BV Financeira')),
  veiculo JSONB, -- legado, mantido para compatibilidade
  valor_financiado NUMERIC NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  data_contrato DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Tabela de Parcelas FPD (3 primeiras parcelas de cada contrato)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parcelas_fpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela IN (1, 2, 3)),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
  valor_boleto NUMERIC,
  nosso_numero TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contrato_id, numero_parcela)
);

-- ============================================================
-- Cofre de Documentos (uploads vinculados a contratos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CNH', 'Comprovante Residência', 'Contrato Assinado', 'Boleto', 'Outro')),
  url TEXT NOT NULL,
  tamanho_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_fpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Acesso total para usuários autenticados (Intranet B2B2C)
CREATE POLICY "auth_full_lojistas" ON public.lojistas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_veiculos" ON public.veiculos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_contratos" ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_parcelas" ON public.parcelas_fpd FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_documentos" ON public.documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON public.clientes (cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes (nome);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos (placa);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON public.parcelas_fpd (status);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON public.parcelas_fpd (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contratos_lojista ON public.contratos (lojista_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_contrato ON public.documentos (contrato_id);
