# 🚀 Guia Completo de Deploy — VoyagerAI

## Visão Geral da Arquitetura

```
Usuário → Vercel (Frontend React) → Supabase (Auth + DB) + Anthropic API (IA)
```

---

## PASSO 1 — Configurar o Supabase

### 1.1 Criar conta e projeto
1. Acesse **supabase.com** e crie uma conta gratuita
2. Clique em **"New Project"**
3. Escolha um nome (ex: `voyagerai`) e uma senha forte para o banco
4. Aguarde ~2 minutos para o projeto ser criado

### 1.2 Habilitar autenticação por email
1. No painel do Supabase, acesse **Authentication → Providers**
2. Certifique-se que **Email** está habilitado
3. Em **Authentication → Email Templates**, personalize os emails com a identidade VoyagerAI

### 1.3 Habilitar login com Google (opcional)
1. Acesse **Authentication → Providers → Google**
2. Siga as instruções para criar credenciais no Google Cloud Console
3. Cole o `Client ID` e `Client Secret`

### 1.4 Criar tabela de planos gerados
Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Tabela de planos de viagem gerados
CREATE TABLE travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destino TEXT NOT NULL,
  origem TEXT NOT NULL,
  data_ida DATE,
  data_volta DATE,
  plano_content TEXT,
  plano_tipo TEXT DEFAULT 'basico',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política de segurança: usuário só vê seus próprios planos
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus planos"
  ON travel_plans FOR ALL
  USING (auth.uid() = user_id);
```

### 1.5 Copiar credenciais
1. Acesse **Project Settings → API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

---

## PASSO 2 — Configurar o Projeto Local

### 2.1 Criar projeto Vite + React
```bash
npm create vite@latest voyagerai -- --template react
cd voyagerai
npm install
```

### 2.2 Instalar dependências
```bash
npm install @supabase/supabase-js
```

### 2.3 Adicionar os arquivos
Copie os arquivos do VoyagerAI para a pasta `src/`:
```
src/
├── main.jsx          ← ponto de entrada (padrão do Vite)
├── App.jsx           ← app.jsx que você recebeu
├── auth.jsx          ← auth.jsx que você recebeu
└── travel-ai-saas.jsx ← saas principal
```

### 2.4 Criar arquivo de variáveis de ambiente
Crie o arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://XXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...sua_anon_key
```

> ⚠️ **Nunca commite o arquivo `.env` no GitHub!**
> Certifique-se que `.env` está no `.gitignore`

### 2.5 Testar localmente
```bash
npm run dev
```
Acesse `http://localhost:5173` e teste login/cadastro.

---

## PASSO 3 — Deploy na Vercel

### 3.1 Subir código no GitHub
```bash
git init
git add .
git commit -m "feat: voyagerai mvp com auth"
git branch -M main
git remote add origin https://github.com/SEU_USER/voyagerai.git
git push -u origin main
```

### 3.2 Conectar na Vercel
1. Acesse **vercel.com** e crie uma conta (pode usar o login do GitHub)
2. Clique em **"Add New Project"**
3. Importe o repositório `voyagerai` do GitHub
4. Framework: **Vite** (detectado automaticamente)
5. **Não clique em Deploy ainda!**

### 3.3 Configurar variáveis de ambiente na Vercel
Antes de fazer deploy, adicione as variáveis:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://XXXX.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

> As variáveis `VITE_` são expostas no frontend — isso é seguro para as chaves públicas do Supabase.

### 3.4 Deploy!
Clique em **Deploy**. Em ~60 segundos seu site estará no ar em:
```
https://voyagerai.vercel.app
```

### 3.5 Configurar domínio personalizado (opcional)
1. Compre um domínio em **registro.br** ou **namecheap.com**
2. Na Vercel: **Settings → Domains → Add**
3. Aponte o DNS do domínio para a Vercel (ela fornece as instruções)

---

## PASSO 4 — Configurar URL de redirecionamento do Supabase

Após ter a URL da Vercel:
1. No Supabase: **Authentication → URL Configuration**
2. Adicione em **Redirect URLs**:
   ```
   https://voyagerai.vercel.app/**
   https://SEU_DOMINIO.com/**
   ```

---

## PASSO 5 — Custos e Escalabilidade

### Plano gratuito (para começar):
| Serviço | Limite gratuito | Custo além |
|---------|----------------|------------|
| Vercel | 100GB bandwidth/mês | ~$20/mês Pro |
| Supabase | 500MB DB, 50k usuários | ~$25/mês Pro |
| Anthropic API | Pago por uso | ~$0.003 por plano gerado |

### Custo estimado por venda:
- Plano Essencial (R$39): custo de IA ~R$0,02 → **margem 99%**
- Plano Estratégico (R$79): custo de IA ~R$0,05 → **margem 99%**

---

## PASSO 6 — Próximos passos recomendados

- [ ] Integrar **Stripe** para pagamentos reais
- [ ] Salvar planos gerados no banco (tabela `travel_plans`)
- [ ] Adicionar painel de histórico de planos
- [ ] Email de boas-vindas personalizado (via Resend.com)
- [ ] Analytics com **Vercel Analytics** (gratuito)
- [ ] SEO: meta tags e sitemap

---

## Estrutura final de arquivos

```
voyagerai/
├── .env                    ← variáveis locais (não commitar!)
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx             ← gerencia auth + dashboard
    ├── auth.jsx            ← login/cadastro/recuperação
    └── travel-ai-saas.jsx  ← formulário + IA + pagamento
```

---

## Suporte

Dúvidas? Abra uma issue no repositório ou consulte:
- 📚 **docs.supabase.com**
- 📚 **vercel.com/docs**
- 📚 **docs.anthropic.com**
