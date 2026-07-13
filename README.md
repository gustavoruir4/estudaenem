# AprovAI 🎓

Plataforma de questões para revisão do ENEM com correção automática e explicação por IA.

---

## Passo a passo completo para publicar o site

### 1. Criar conta no GitHub
1. Acesse https://github.com e crie uma conta gratuita
2. Clique em **New repository**
3. Nome: `aprovai` — deixe público, clique em **Create repository**
4. Siga as instruções da tela para fazer upload dos arquivos (ou use GitHub Desktop: https://desktop.github.com)

---

### 2. Configurar o Supabase (banco de dados + login)
1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New project** — escolha um nome e uma senha forte
3. Aguarde o projeto inicializar (~1 min)
4. No menu lateral, clique em **SQL Editor**
5. Cole todo o conteúdo do arquivo `supabase_setup.sql` e clique em **Run**
6. Vá em **Project Settings > API**
7. Copie:
   - **Project URL** → é o `VITE_SUPABASE_URL`
   - **anon / public key** → é o `VITE_SUPABASE_ANON_KEY`

---

### 3. Obter a chave da API Anthropic (IA de explicações)
1. Acesse https://console.anthropic.com e crie uma conta
2. Vá em **API Keys** e clique em **Create Key**
3. Copie a chave → é o `VITE_ANTHROPIC_API_KEY`
> ⚠️ A chave da Anthropic NÃO deve ficar exposta no código frontend em produção.
> Para uso pessoal/teste, você pode configurar no Vercel como variável de ambiente.
> Para produção real, crie uma Edge Function no Supabase que faz a chamada à API.

---

### 4. Publicar no Vercel (hospedagem grátis)
1. Acesse https://vercel.com e crie uma conta com seu GitHub
2. Clique em **Add New > Project**
3. Selecione o repositório `aprovai`
4. Em **Environment Variables**, adicione as três variáveis:
   ```
   VITE_SUPABASE_URL      = https://seuproject.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJh...
   VITE_ANTHROPIC_API_KEY = sk-ant-...
   ```
5. Clique em **Deploy** — pronto! O site vai ficar em `aprovai.vercel.app`

---

## Rodar localmente (para testar antes de publicar)

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env e preencha com suas chaves reais

# 3. Rodar
npm run dev
# Acesse http://localhost:5173
```

---

## Estrutura do projeto

```
aprovai/
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Conexão com o banco
│   │   ├── AuthContext.jsx   # Gerenciamento de login
│   │   └── questions.js      # Banco de 30 questões
│   ├── components/
│   │   └── Layout.jsx        # Navbar e estrutura
│   ├── pages/
│   │   ├── Login.jsx         # Tela de login/cadastro
│   │   ├── Questoes.jsx      # Página principal de questões
│   │   ├── Perfil.jsx        # Dashboard de desempenho
│   │   └── Historico.jsx     # Histórico de respostas
│   ├── App.jsx               # Rotas
│   └── main.jsx              # Entry point
├── supabase_setup.sql        # SQL para criar o banco
└── .env.example              # Modelo das variáveis de ambiente
```

---

## Funcionalidades

- ✅ Cadastro e login de usuários (Supabase Auth)
- ✅ 30 questões reais de ENEM/FUVEST
- ✅ Filtros por área e por prova
- ✅ Correção automática com feedback visual
- ✅ Explicação gerada por IA quando o aluno erra
- ✅ Dashboard com taxa de acerto por área e por assunto
- ✅ Histórico completo de respostas
- ✅ Dados salvos por usuário no banco de dados
- ✅ Responsivo para celular
