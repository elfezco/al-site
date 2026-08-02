# AL Finanças & Negócios - Intranet B2B2C

Bem-vindo ao repositório oficial da Intranet de Gestão de Risco FPD da AL Finanças & Negócios. Este sistema foi desenhado para ser uma ferramenta de alta performance, substituindo planilhas legadas por um Kanban interativo e listagens paginadas *Server-Side*.

## 🚀 Tecnologias

- **Frontend**: React 19, Vite, Tailwind CSS, TanStack Router
- **Backend / DB**: Supabase (PostgreSQL + Auth)
- **QA**: Vitest para validação de Regras de Negócio Críticas
- **Infraestrutura**: CI/CD configurado para Vercel via GitHub Actions

## 📋 Pré-requisitos

1. **Node.js** (v18 ou superior).
2. **Supabase Project**: Você precisará criar um projeto na [Supabase](https://supabase.com).

## ⚙️ Configuração Local (Onboarding)

### 1. Clonar o Repositório e Instalar Dependências

```bash
git clone https://github.com/elfezco/al-site.git
cd al-site
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie uma cópia do arquivo de exemplo para o seu ambiente local:

```bash
cp .env.example .env
```

Preencha as variáveis com as credenciais do seu projeto Supabase:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Configurar Banco de Dados

1. Acesse o **SQL Editor** no painel da sua Supabase.
2. Copie o conteúdo do arquivo `supabase/schema.sql`.
3. Cole e execute no SQL Editor. Isso criará as tabelas e habilitará o RLS de segurança (junto com os Índices de Performance).

### 4. Executar o Projeto

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`. 

## 🛡️ Segurança e LGPD

O sistema foi blindado para mascarar CPFs e Telefones de Clientes por padrão. A revelação de dados sensíveis exige que a *role* do usuário seja validada internamente pelo sistema. 

O Supabase gerencia a segurança perimetral (Rate Limiting e Defesa de Injeção de SQL), não sendo necessário gerenciar middlewares Node.js para isso.

## 🧪 Testes Automatizados (QA)

Nós não aceitamos estorno de comissão. As lógicas matemáticas do FPD são validadas estritamente via Testes Unitários.

```bash
# Rodar todos os testes unitários de regra de negócio
npm run test
```

## 🚀 Deploy

O projeto conta com:
- `vercel.json` pronto para ser importado na plataforma **Vercel** sem erros de Rota SPA (404).
- `.github/workflows/deploy.yml` configurado para rodar Lint e Testes automaticamente a cada `git push` para a branch `main`.

Apenas instale o App da Vercel no GitHub e conecte a branch `main`.
