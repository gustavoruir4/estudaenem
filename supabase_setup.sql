-- Execute este SQL no Supabase > SQL Editor

-- Tabela de respostas dos usuários
CREATE TABLE IF NOT EXISTS respostas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id INT NOT NULL,
  area        TEXT NOT NULL,
  assunto     TEXT NOT NULL,
  prova       TEXT NOT NULL,
  ano         INT NOT NULL,
  correta     BOOLEAN NOT NULL,
  resposta_dada TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_respostas_user_id ON respostas(user_id);
CREATE INDEX IF NOT EXISTS idx_respostas_created_at ON respostas(created_at DESC);

-- Row Level Security: cada usuário só vê/edita suas próprias respostas
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas respostas"
  ON respostas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere apenas suas respostas"
  ON respostas FOR INSERT
  WITH CHECK (auth.uid() = user_id);
