# AprovAI — Documentação Completa do Projeto

**Última atualização:** 11/07/2026
**Desenvolvido por:** Gustavo + Claude (Anthropic)
**Status:** Em desenvolvimento ativo — produto pago em operação

---

## 1. Visão Geral

Plataforma web **100% paga** de revisão para o ENEM e vestibulares, com questões de provas reais, correção automática e explicação por IA, simulados cronometrados e revisão de erros.

> **Renomeação em andamento:** o nome definitivo escolhido foi **AprovAI**. Todo o código (frontend, Edge Functions, configs, textos) já foi atualizado de EstudaENEM/estudaenem para AprovAI/aprovai. **Falta migrar os identificadores externos reais** — o domínio na Vercel e o repositório no GitHub ainda se chamam `estudaenem` na prática; as URLs no código já foram escritas assumindo `aprovai-sage.vercel.app` e `github.com/gustavoruir4/aprovai`, então isso só funciona de fato depois que o domínio/repo forem renomeados nessas plataformas. Ver seção 7.

**Modelo de negócio atual:** pagamento único de **R$39,90**, acesso completo até o ENEM. O usuário paga **antes** de criar a conta (ver seção 4).

### URLs de Produção

**Ainda ativas de fato hoje** (domínio/repo não foram renomeados nas plataformas ainda):
| Serviço | URL |
|---|---|
| Site (Vercel) | https://estudaenem-sage.vercel.app |
| Repositório (GitHub) | https://github.com/gustavoruir4/estudaenem |
| Banco de dados (Supabase) | https://avtolxrbmvcqcvvfdcvv.supabase.co |
| Dashboard Supabase | https://supabase.com/dashboard/project/avtolxrbmvcqcvvfdcvv |
| Dashboard Vercel | https://vercel.com/gustavoruir4s-projects/estudaenem |

**Assumidas pelo código após a renomeação** (`returnUrl`/`completionUrl` nas Edge Functions, links de email) — só vão funcionar depois que o domínio/repo forem de fato renomeados:
| Serviço | URL |
|---|---|
| Site (Vercel) | https://aprovai-sage.vercel.app |
| Repositório (GitHub) | https://github.com/gustavoruir4/aprovai |

O banco de dados Supabase não muda de identificador — `avtolxrbmvcqcvvfdcvv` continua sendo o project-ref real independentemente do nome do produto.

---

## 2. Stack Técnica

| Camada | Tecnologia | Observações |
|---|---|---|
| Frontend | React 18 + Vite | SPA, build com `vite build` |
| Roteamento | React Router v6 | Rotas públicas + protegidas (ver seção 3) |
| Estilização | CSS Modules | Um `.module.css` por página/componente, dark mode roxo como padrão + toggle claro/escuro |
| Ícones | Tabler Icons (CDN, `tabler-icons.min.css`) | Carregado via `<link>` no `index.html` |
| Fonte | Inter (Google Fonts) | Carregada via `<link>` no `index.html` |
| Fórmulas matemáticas | KaTeX (CDN, `auto-render`) | Renderiza `$...$` / `$$...$$` nas explicações de IA |
| Backend / dados | Supabase (PostgreSQL + Auth + Edge Functions + RLS) | Projeto `avtolxrbmvcqcvvfdcvv` |
| IA (explicações) | Anthropic Claude API, via Supabase Edge Function `explicacao` | Chamada pelo frontend, resultado cacheado no banco |
| Pagamento | AbacatePay — **API v1** (`/v1/billing/create`), método PIX | Ver seção 4 |
| Email transacional | Resend (`api.resend.com/emails`) | Remetente atual `onboarding@resend.dev` (domínio de teste — ver pendências) |
| Hospedagem | Vercel | Deploy automático a cada push em `main`; SPA fallback via `vercel.json` |

---

## 3. Estrutura do Projeto

### Rotas (`src/App.jsx`)

| Rota | Página | Acesso |
|---|---|---|
| `/` | `Landing.jsx` | Pública |
| `/login` | `Login.jsx` | Pública (login e criação de conta direta, sem pagamento — ver nota na seção 4) |
| `/pagamento` | `Pagamento.jsx` | Pública |
| `/pagamento/erro` | `PagamentoErro.jsx` | Pública |
| `/ativar` | `Ativar.jsx` | Pública (espera `?email=` na query string) |
| `/app` → redireciona para `/app/questoes` | `Layout.jsx` (shell) | **Protegida** (login + pagamento confirmado) |
| `/app/questoes` | `Questoes.jsx` | Protegida |
| `/app/simulado` | `Simulado.jsx` | Protegida |
| `/app/revisao` | `Revisao.jsx` | Protegida |
| `/app/perfil` | `Perfil.jsx` | Protegida |
| `/app/historico` | `Historico.jsx` | Protegida |
| `/app/admin` | `Admin.jsx` | Protegida + restrita a `gustavoruir4@gmail.com` |

Todas as rotas `/app/*` passam pelo componente `PrivateRoute` (dentro de `App.jsx`), que:
1. Bloqueia se não houver usuário logado (`useAuth`) → redireciona para `/login`.
2. Roda o hook `usePagamentoGuard` (ver seção 4) → redireciona para `/pagamento` se o acesso não estiver pago.

### Componentes e libs principais

```
src/
├── main.jsx                      # ThemeProvider > BrowserRouter > App
├── App.jsx                       # Rotas (tabela acima)
├── index.css                     # Tokens de tema (roxo dark/light), reset, KaTeX
├── lib/
│   ├── supabase.js               # Client do Supabase (anon key)
│   ├── AuthContext.jsx           # signUp/signIn/signOut, estado global de user/loading
│   ├── ThemeContext.jsx          # Tema dark/light, persistido em localStorage
│   ├── usePagamentoGuard.js      # Hook: verifica acesso pago por email, autoconserta user_id
│   └── questions.js              # Banco de questões estático (ver seção 5)
├── components/
│   └── Layout.jsx / .module.css  # Shell do app logado: nav, tabs, toggle de tema, logout
└── pages/
    ├── Landing.jsx / .module.css
    ├── Login.jsx / .module.css
    ├── Pagamento.jsx / .module.css
    ├── PagamentoErro.jsx / .module.css
    ├── Ativar.jsx / .module.css
    ├── Questoes.jsx / .module.css
    ├── Simulado.jsx / .module.css
    ├── Revisao.jsx / .module.css
    ├── Perfil.jsx / .module.css
    ├── Historico.jsx / .module.css
    └── Admin.jsx / .module.css
```

### Edge Functions do Supabase

Deploy remoto atual (`supabase functions list`):

| Função | Fonte no repo? | `verify_jwt` | Descrição |
|---|---|---|---|
| `explicacao` | ❌ **não** — só existe no projeto remoto, sem código versionado neste repositório | `true` | Chamada pelo frontend (`Questoes.jsx`, `Revisao.jsx`) para gerar a explicação de IA de uma questão; resultado é salvo em `explicacoes` para cache |
| `pagamento` | ✅ `supabase/functions/pagamento/index.ts` | `false` | Recebe `{ email, nome, cpf, telefone }`, cria a cobrança PIX na AbacatePay, salva `acessos` com `status='pendente'`, retorna `{ url }` |
| `webhook-pagamento` | ✅ `supabase/functions/webhook-pagamento/index.ts` | `false` | Recebe o webhook `checkout.completed` da AbacatePay, valida o secret, marca `acessos.status='pago'` e envia o email de ativação via Resend |

> **Pendência:** o código-fonte da função `explicacao` não está neste repositório — só existe no Supabase remoto. Se precisar editá-la, baixe primeiro com `supabase functions download explicacao`.

### Tabelas do Supabase (schema atual, verificado no banco)

**`acessos`** — controla quem pagou e o vínculo com a conta:
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE  -- nullable (pode não existir conta ainda)
email       text UNIQUE                                        -- chave de conciliação pagamento → conta
status      text DEFAULT 'pendente'                            -- 'pendente' | 'pago'
payment_id  text
valor       numeric DEFAULT 39.90
created_at  timestamptz DEFAULT now()
paid_at     timestamptz
```
RLS: usuário só enxerga sua própria linha (`user_id = auth.uid()` OU `email = auth.jwt() ->> 'email'`); só é permitido vincular `user_id` a uma linha que já esteja `status='pago'` e ainda sem `user_id` (sem essa restrição, qualquer client poderia forjar `status='pago'` sem pagar — só a `service_role`, usada nas Edge Functions, grava/atualiza livremente).

**`respostas`** — histórico de tentativas de questões (usado por Questões, Simulado, Revisão, Perfil, Histórico):
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
question_id   int NOT NULL
area          text NOT NULL
assunto       text NOT NULL
prova         text NOT NULL
ano           int NOT NULL
correta       boolean NOT NULL
resposta_dada text NOT NULL
created_at    timestamptz DEFAULT now()
```
RLS: cada usuário só lê/insere as próprias respostas (`auth.uid() = user_id`).

**`explicacoes`** — cache das explicações de IA (evita gerar/pagar a mesma explicação duas vezes):
```sql
question_id int PRIMARY KEY
explicacao  text NOT NULL
created_at  timestamptz DEFAULT now()
```

---

## 4. Fluxo de Pagamento Atual

O usuário **paga antes de criar conta**:

```
Landing (/)
   │  botão "Começar agora" / "Garantir meu acesso"
   ▼
/pagamento
   │  formulário: email, nome completo, CPF, WhatsApp
   │  valida CPF no frontend (dígitos verificadores) antes de enviar
   │  POST /functions/v1/pagamento { email, nome, cpf, telefone }
   ▼
Edge Function "pagamento"
   │  limpa CPF/telefone (só dígitos), cria cobrança PIX na AbacatePay
   │  (v1/billing/create — exige customer.name, cellphone, email, taxId)
   │  upsert acessos { email, status: 'pendente', payment_id }
   │  retorna { url } → frontend redireciona pra lá
   ▼
Checkout da AbacatePay
   ├─ pagamento concluído  → completionUrl: /ativar?email=...
   └─ cancelado / erro     → returnUrl: /pagamento/erro
   ▼
Webhook "webhook-pagamento" (chamado pela AbacatePay, servidor a servidor)
   │  valida ?webhookSecret= na URL contra ABACATEPAY_WEBHOOK_SECRET (senão 401)
   │  evento checkout.completed → upsert acessos { email, status: 'pago', paid_at }
   │  envia email via Resend com link de ativação (não bloqueia a confirmação se falhar)
   ▼
/ativar?email=...
   │  usuário define senha (+ confirmação)
   │  supabase.auth.signUp({ email, password })
   │  UPDATE acessos SET user_id = <novo user.id>
   │    WHERE email = email AND status = 'pago' AND user_id IS NULL
   ▼
/app/questoes (login automático — confirmação de email está desativada no projeto)
```

**Guard de acesso** (`src/lib/usePagamentoGuard.js`, usado dentro do `PrivateRoute`):
- A cada login/sessão, consulta `acessos` filtrando por `email` do usuário logado.
- Se não existe linha, ou `status !== 'pago'` → redireciona para `/pagamento`.
- Se existe e está `pago` mas `user_id` ainda é `null` (ex.: conta criada fora do fluxo `/ativar`) → autoconserta, gravando o `user_id`.

**Nota importante:** `Login.jsx` ainda tem uma aba "Criar conta" que cria login **sem** exigir pagamento prévio. Isso não quebra a segurança (o guard acima barra o acesso de quem não pagou, redirecionando para `/pagamento` no primeiro login), mas é um caminho alternativo de cadastro que hoje convive com o fluxo `/pagamento → /ativar`.

**Pontos de atenção conhecidos:**
- A AbacatePay retornou `"API key version mismatch"` em testes anteriores ao usar `v1/billing/create` — resolvido preenchendo corretamente `customer.cellphone` e `customer.taxId`, mas vale reconfirmar periodicamente que a chave `ABACATEPAY_KEY` continua compatível com o endpoint v1, já que a documentação pública da AbacatePay hoje só cobre a API v2.
- O email de confirmação usa `from: 'AprovAI <onboarding@resend.dev>'`, o domínio de teste compartilhado do Resend — **só entrega para o email dono da conta Resend**, não para clientes reais, até um domínio próprio ser verificado (ver seção 7).

---

## 5. Features Implementadas

- **Banco de questões:** 555 questões reais do ENEM (2016–2019, dias 1 e 2), estáticas em `src/lib/questions.js` — Matemática (132), Ciências da Natureza (143), Ciências Humanas (146), Linguagens (134). Filtros de área e prova disponíveis na UI (`FUVEST`/`UNICAMP`/`UNESP` já existem como opção de filtro, mas ainda **sem nenhuma questão real cadastrada** dessas provas).
- **Explicações por IA com cache:** ao responder, o frontend chama a Edge Function `explicacao`; o resultado é salvo em `explicacoes` (por `question_id`) e reaproveitado nas próximas vezes — sem custo repetido de API. Renderiza fórmulas matemáticas via KaTeX.
- **Modo Simulado** (`/app/simulado`): escolha de área, prova, número de questões e tempo total; timer regressivo, navegador de questões (grade numerada), finalização manual ou automática ao zerar o tempo, tela de resultado com aproveitamento por área.
- **Revisão de Erros** (`/app/revisao`): lista as questões cuja última tentativa do usuário foi errada e permite refazê-las uma a uma, com a mesma explicação de IA do modo Questões.
- **Desempenho** (`/app/perfil`): estatísticas gerais (respondidas, acertos, erros, % de acerto) e detalhamento por área e por assunto.
- **Histórico** (`/app/historico`): últimas 50 respostas do usuário, com resultado (acerto/erro) e metadados da questão.
- **Dark mode roxo + toggle claro/escuro:** tema padrão dark, alternável via botão no `Layout`, persistido em `localStorage` (`ThemeContext.jsx`).
- **Painel Admin** (`/app/admin`): restrito por email (`gustavoruir4@gmail.com`) no frontend — visão geral de usuários/respostas, stats por usuário, limpeza de histórico (próprio ou de terceiros) e limpeza do cache de explicações.
- **Landing page** (`/`): hero, seção de recursos, áreas cobertas, "como funciona" e card de preço com CTA para `/pagamento`. **Não há demo interativa ao vivo implementada** — a landing é só conteúdo de marketing/estático hoje (se isso for um requisito, entra como pendência).

---

## 6. Planos de Preço

### O que está implementado hoje
Um único produto, cobrado uma vez: **R$39,90 — AprovAI Acesso Completo** (questões, simulado, revisão de erros, desempenho/histórico). Não existe segunda oferta nem upsell no código atual — `Pagamento.jsx` e a Edge Function `pagamento` só conhecem esse valor único (`price: 3990` centavos).

### Estrutura planejada (ainda não implementada)
| Plano | Preço | Inclui |
|---|---|---|
| **AprovAI** | R$39,90 único | Questões + simulado + revisão de erros + guia de redação |
| **AprovAI+** | R$69,90 único | Tudo do AprovAI + correção de redação por IA + avaliação de discursivas de vestibular |

Implementar essa divisão exige: dois produtos/preços na AbacatePay, uma coluna de "plano" em `acessos` (hoje só existe pago/não-pago, sem diferenciar nível), e as próprias features de redação/discursiva (ver seção 7).

---

## 7. Pendentes / Próximos Passos

- [x] Definir nome final do produto — **AprovAI**, já aplicado em todo o código
- [ ] Renomear de fato o projeto na Vercel e o repositório no GitHub para `aprovai` (o código já assume `aprovai-sage.vercel.app` e `github.com/gustavoruir4/aprovai` — ver seção 1)
- [ ] Registrar domínio próprio (hoje só existe o subdomínio da Vercel)
- [ ] Verificar domínio próprio no Resend, trocando `onboarding@resend.dev` por um remetente real — sem isso, clientes reais não recebem o email de ativação
- [ ] Adicionar questões: ENEM 2020–2025, FUVEST, UNICAMP, UFU (os filtros de FUVEST/UNICAMP/UNESP já existem na UI, mas sem conteúdo real ainda)
- [ ] Suporte a questões com imagem/gráfico (hoje essas questões são excluídas do banco) via Supabase Storage
- [ ] Correção de redação por IA (feature do plano AprovAI+)
- [ ] Avaliação de discursivas de vestibular por IA (feature do plano AprovAI+)
- [ ] Reprocessar/melhorar explicações com um modelo mais forte conforme o banco de questões crescer
- [ ] Versionar a Edge Function `explicacao` neste repositório (hoje só existe no Supabase remoto)
- [ ] Decidir se o cadastro direto via `Login.jsx` (sem passar por `/pagamento`) deve continuar existindo, já que o produto é 100% pago

---

## 8. Variáveis de Ambiente

### Frontend (`.env` na raiz — usadas em build/runtime pelo Vite, prefixo `VITE_`)
| Variável | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase (client-side) |
| `VITE_ANTHROPIC_API_KEY` | *(legado — a chamada de IA hoje passa pela Edge Function `explicacao`, não deveria mais ser necessária no frontend; revisar se ainda é usada em algum lugar)* |
| `VITE_ABACATEPAY_KEY` | *(legado no `.env` local — a chamada real à AbacatePay acontece na Edge Function, que usa o secret `ABACATEPAY_KEY` do lado do Supabase, não essa variável `VITE_`)* |

### Backend — Secrets das Edge Functions (Supabase, `supabase secrets set`)
| Secret | Uso |
|---|---|
| `SUPABASE_URL` | Usado dentro das próprias functions para instanciar o client admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Client admin (bypassa RLS) — grava em `acessos`, gera links de auth |
| `ANTHROPIC_API_KEY` | Chamada à IA dentro da função `explicacao` |
| `ABACATEPAY_KEY` | Autenticação com a API da AbacatePay (`pagamento`) |
| `ABACATEPAY_WEBHOOK_SECRET` | Validado contra `?webhookSecret=` na URL do webhook |
| `RESEND_API_KEY` | Envio do email de confirmação pós-pagamento |

> As demais entradas que aparecem em `supabase secrets list` (`SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`) são injetadas automaticamente pela própria plataforma Supabase, não precisam ser configuradas manualmente.

---

## 9. Como Fazer Deploy de Edge Functions

```bash
# Uma vez por máquina: linkar a CLI local ao projeto remoto
supabase link --project-ref avtolxrbmvcqcvvfdcvv

# Deploy de uma função específica após editar o código em supabase/functions/<nome>/
supabase functions deploy nome-da-funcao

# Ex.:
supabase functions deploy pagamento
supabase functions deploy webhook-pagamento
```

Para conferir o que está de fato publicado no projeto remoto (inclusive funções sem código local, como `explicacao`):
```bash
supabase functions list
```

Para checar/atualizar secrets:
```bash
supabase secrets list
supabase secrets set NOME_DA_VARIAVEL=valor
```

Alterações de schema/RLS no banco são aplicadas com:
```bash
supabase db query --linked -f caminho/para/arquivo.sql
```
(usado, por exemplo, em `supabase/migrations/20260709000000_pagamento_antes_cadastro.sql`, que tornou `acessos.user_id` opcional e ajustou as políticas de RLS para o fluxo atual de pagamento antes do cadastro.)

---

## 10. Como Retomar o Desenvolvimento

### Contexto para nova conversa:
> "Tenho um projeto chamado AprovAI (recém-renomeado de EstudaENEM — domínio/repo ainda não migrados, ver seção 1) em produção. É 100% pago (R$39,90, pagar antes de criar conta). Stack: React + Vite, Supabase (projeto avtolxrbmvcqcvvfdcvv), Vercel, AbacatePay v1 para pagamento, Resend para email. GitHub: gustavoruir4/aprovai (ou gustavoruir4/estudaenem, se a renomeação ainda não tiver sido feita). 555 questões ENEM 2016–2019. Quero [descrever o que quer fazer]."

### Para rodar localmente:
```bash
git clone https://github.com/gustavoruir4/aprovai.git
cd aprovai
npm install
# Criar .env na raiz com as variáveis da seção 8
npm run dev
# Acessa http://localhost:5173
```

### Para adicionar questões:
Editar `src/lib/questions.js`, novos IDs a partir de 733 (próximo livre). Commit → Vercel republica automaticamente.
