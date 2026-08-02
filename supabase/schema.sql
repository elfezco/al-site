-- supabase/schema.sql

-- Tabela de Lojistas
CREATE TABLE public.lojistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  contato_whatsapp TEXT NOT NULL,
  chave_pix TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contratos
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  lojista_id UUID REFERENCES public.lojistas(id) ON DELETE CASCADE,
  banco TEXT NOT NULL CHECK (banco IN ('Daycoval', 'BV Financeira')),
  veiculo JSONB NOT NULL, -- { "placa": "ABC1234", "modelo": "Civic" }
  valor_financiado NUMERIC NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  data_contrato DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Parcelas FPD
CREATE TABLE public.parcelas_fpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela IN (1, 2, 3)),
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contrato_id, numero_parcela)
);

-- Policies (RLS)
ALTER TABLE public.lojistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_fpd ENABLE ROW LEVEL SECURITY;

-- Permitir acesso total apenas para usuários autenticados (Regra geral para o Dashboard B2B2C)
CREATE POLICY "Allow authenticated full access lojistas" ON public.lojistas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access clientes" ON public.clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access contratos" ON public.contratos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access parcelas" ON public.parcelas_fpd FOR ALL TO authenticated USING (true);
