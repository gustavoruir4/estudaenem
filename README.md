# AprovAI 🎓

Plataforma de questões para revisão do ENEM, FUVEST, UNICAMP e UFU, com correção automática, teste grátis e acesso vitalício por pagamento único.

---

## Funcionalidades

- ✅ Landing page com teste grátis (20 questões sem cadastro de cartão)
- ✅ Cadastro e login de usuários (Supabase Auth)
- ✅ Banco com **1.171 questões reais** (ENEM e FUVEST)
- ✅ Filtros por área, matéria, ano e prova
- ✅ Correção automática com feedback visual (acertou/errou, gabarito comentado)
- ✅ Progresso do quiz persistido em sessionStorage (não reinicia ao trocar de aba)
- ✅ Modo Simulado e modo Revisão
- ✅ Dashboard de desempenho (Perfil) e histórico completo de respostas
- ✅ Acesso vitalício via pagamento único (integração com AbacatePay)
- ✅ Botão "Reportar questão" em cada card, salvando na tabela `reportes`
- ✅ Painel administrativo básico (`/app/admin`)
- ✅ Responsivo para celular

---

## Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Supabase (Auth, Postgres, Edge Functions em Deno)
- **Pagamento:** AbacatePay, via Edge Functions `pagamento` e `webhook-pagamento`

---

## Rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente na raiz (.env)
VITE_SUPABASE_URL=https://seuproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# 3. Rodar
npm run dev
# Acesse http://localhost:5173
```

### Build de produção

```bash
npm run build
npm run preview
```

---

## Configurar o Supabase

1. Crie um projeto em https://supabase.com
2. No **SQL Editor**, rode o conteúdo de `supabase_setup.sql`
3. Aplique as migrations em `supabase/migrations/` (via `supabase db push --linked` com o Supabase CLI, ou colando o SQL de cada arquivo manualmente)
4. Em **Project Settings > API**, copie a **Project URL** e a **anon/public key** para o `.env`
5. Se for usar pagamento, publique as Edge Functions de `supabase/functions/` (`pagamento` e `webhook-pagamento`) e configure a variável `ABACATEPAY_KEY` nos secrets do projeto

---

## Estrutura do projeto

```
estudaenem/
├── src/
│   ├── lib/
│   │   ├── supabase.js               # Conexão com o banco
│   │   ├── AuthContext.jsx           # Gerenciamento de login
│   │   ├── ThemeContext.jsx          # Tema claro/escuro
│   │   ├── usePagamentoGuard.js      # Guard de rotas privadas (login + pagamento)
│   │   ├── materias.js               # Mapeamento de áreas/matérias
│   │   ├── questions.js              # Banco de questões (ENEM/FUVEST)
│   │   └── questoes-pendentes-imagem.js  # Questões que dependem de imagem (fora do pool ativo)
│   ├── components/
│   │   ├── Layout.jsx                # Navbar e estrutura do app logado
│   │   └── ReportarQuestaoModal.jsx  # Modal de reporte de questão
│   ├── pages/
│   │   ├── Landing.jsx               # Página inicial pública
│   │   ├── Login.jsx                 # Tela de login/cadastro
│   │   ├── TesteGratis.jsx           # Fluxo de teste grátis (20 questões)
│   │   ├── Pagamento.jsx             # Checkout de acesso vitalício
│   │   ├── PagamentoErro.jsx         # Tela de erro no pagamento
│   │   ├── Ativar.jsx                # Ativação de acesso após pagamento
│   │   ├── Questoes.jsx              # Página principal de questões
│   │   ├── Simulado.jsx              # Modo simulado
│   │   ├── Revisao.jsx               # Modo revisão
│   │   ├── Perfil.jsx                # Dashboard de desempenho
│   │   ├── Historico.jsx             # Histórico de respostas
│   │   └── Admin.jsx                 # Painel administrativo
│   ├── App.jsx                       # Rotas
│   └── main.jsx                      # Entry point
├── supabase/
│   ├── migrations/                   # Migrations SQL aplicadas ao banco
│   └── functions/                    # Edge Functions (pagamento, webhook-pagamento)
└── supabase_setup.sql                # SQL inicial de criação do banco
```
