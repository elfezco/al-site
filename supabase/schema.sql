-- supabase/schema.sql
-- AL Finanças & Negócios — Schema Completo v2

-- ============================================================
-- Tabela de Lojistas (sem Chave PIX — pagamento é feito pelo banco)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lojistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  contato_whatsapp TEXT NOT NULL,
  socio_nome TEXT,
  socio_telefone TEXT,
  endereco TEXT,
  fichas_enviadas INTEGER DEFAULT 0,
  tenant_id TEXT DEFAULT 'ALFIN',
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
  tenant_id TEXT DEFAULT 'ALFIN',
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
  tenant_id TEXT DEFAULT 'ALFIN',
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
  comissao_promotora NUMERIC, -- Faturamento da AL Finanças
  checklist_dut BOOLEAN DEFAULT false,
  checklist_contrato BOOLEAN DEFAULT false,
  checklist_biometria BOOLEAN DEFAULT false,
  valor_troco_na_troca NUMERIC,
  status_formalizacao TEXT DEFAULT 'Pendente' CHECK (status_formalizacao IN ('Pendente', 'Devolvido', 'Formalizado')),
  link_segunda_via TEXT,
  status_comissao TEXT DEFAULT 'Estimada' CHECK (status_comissao IN ('Estimada', 'Recebida')),
  data_contrato DATE NOT NULL,
  tenant_id TEXT DEFAULT 'ALFIN',
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
  tenant_id TEXT DEFAULT 'ALFIN',
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
  tenant_id TEXT DEFAULT 'ALFIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Novas Tabelas Módulos 5-9
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lojistas_vendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lojista_id UUID REFERENCES public.lojistas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  tenant_id TEXT DEFAULT 'ALFIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.visitas_comerciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lojista_id UUID REFERENCES public.lojistas(id) ON DELETE CASCADE,
  consultor_nome TEXT NOT NULL,
  data_visita DATE NOT NULL,
  observacoes TEXT,
  brindes_entregues TEXT,
  tenant_id TEXT DEFAULT 'ALFIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logs_sessao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT DEFAULT 'ALFIN'
);

CREATE TABLE IF NOT EXISTS public.lembretes_cobranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  data_agendada TIMESTAMP WITH TIME ZONE NOT NULL,
  descricao TEXT NOT NULL,
  concluido BOOLEAN DEFAULT false,
  tenant_id TEXT DEFAULT 'ALFIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL,
  registro_id UUID NOT NULL,
  acao TEXT NOT NULL,
  usuario_id TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  tenant_id TEXT DEFAULT 'ALFIN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Row Level Security & Alterações (Migrações)
-- ============================================================
-- Ensure new columns exist on all tables (if they were created previously)
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS socio_nome TEXT;
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS socio_telefone TEXT;
ALTER TABLE public.lojistas ADD COLUMN IF NOT EXISTS fichas_enviadas INTEGER DEFAULT 0;

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS endereco TEXT;

ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';

ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS comissao_promotora NUMERIC;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS checklist_dut BOOLEAN DEFAULT false;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS checklist_contrato BOOLEAN DEFAULT false;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS checklist_biometria BOOLEAN DEFAULT false;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS valor_troco_na_troca NUMERIC;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS status_formalizacao TEXT DEFAULT 'Pendente';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS link_segunda_via TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS status_comissao TEXT DEFAULT 'Estimada';

ALTER TABLE public.parcelas_fpd ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.lojistas_vendedores ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.visitas_comerciais ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.logs_sessao ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.lembretes_cobranca ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'ALFIN';

ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_fpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lojistas_vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sessao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Acesso total para usuários autenticados (Intranet B2B2C)
DROP POLICY IF EXISTS "auth_full_lojistas" ON public.lojistas;
CREATE POLICY "auth_full_lojistas" ON public.lojistas FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_clientes" ON public.clientes;
CREATE POLICY "auth_full_clientes" ON public.clientes FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_veiculos" ON public.veiculos;
CREATE POLICY "auth_full_veiculos" ON public.veiculos FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_contratos" ON public.contratos;
CREATE POLICY "auth_full_contratos" ON public.contratos FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_parcelas" ON public.parcelas_fpd;
CREATE POLICY "auth_full_parcelas" ON public.parcelas_fpd FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_documentos" ON public.documentos;
CREATE POLICY "auth_full_documentos" ON public.documentos FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_lojistas_vendedores" ON public.lojistas_vendedores;
CREATE POLICY "auth_full_lojistas_vendedores" ON public.lojistas_vendedores FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_visitas_comerciais" ON public.visitas_comerciais;
CREATE POLICY "auth_full_visitas_comerciais" ON public.visitas_comerciais FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_logs_sessao" ON public.logs_sessao;
CREATE POLICY "auth_full_logs_sessao" ON public.logs_sessao FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_lembretes_cobranca" ON public.lembretes_cobranca;
CREATE POLICY "auth_full_lembretes_cobranca" ON public.lembretes_cobranca FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

DROP POLICY IF EXISTS "auth_full_audit_logs" ON public.audit_logs;
CREATE POLICY "auth_full_audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN') WITH CHECK (tenant_id = current_setting('app.tenant_id', true) OR tenant_id = 'ALFIN');

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
