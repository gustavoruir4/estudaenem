-- Reformula o fluxo de pagamento: o usuário paga antes de criar a conta.
-- A partir de agora, um registro em `acessos` pode existir só com `email`
-- (sem `user_id`) enquanto o pagamento é confirmado, e o vínculo com a
-- conta é feito depois, em /ativar.

-- 1) user_id passa a ser opcional (o registro de pagamento nasce só com email)
ALTER TABLE acessos ALTER COLUMN user_id DROP NOT NULL;

-- 2) email vira a chave de conciliação entre pagamento e conta,
--    necessária para o upsert(onConflict: 'email') nas Edge Functions
ALTER TABLE acessos ADD CONSTRAINT acessos_email_key UNIQUE (email);

-- 3) RLS: as policies antigas liberavam INSERT/UPDATE para qualquer client
--    (inclusive anon) sem nenhuma condição — na prática, qualquer pessoa
--    com a anon key conseguiria gravar status='pago' diretamente pela API,
--    sem pagar. As Edge Functions usam a service_role key, que ignora RLS,
--    então essas policies "públicas" nunca foram necessárias para o backend
--    funcionar — só abriam a brecha. Substituídas por regras que:
--    a) permitem o usuário ler seu próprio acesso (por user_id já vinculado
--       ou por email, via JWT, antes de vincular);
--    b) permitem vincular user_id a um registro já pago e ainda não
--       vinculado (uso do /ativar), sem permitir criar ou alterar status.
DROP POLICY IF EXISTS "Usuario ve proprio acesso" ON acessos;
DROP POLICY IF EXISTS "Service pode inserir" ON acessos;
DROP POLICY IF EXISTS "Service pode atualizar" ON acessos;

CREATE POLICY "Usuario ve proprio acesso"
  ON acessos FOR SELECT
  USING (auth.uid() = user_id OR email = (auth.jwt() ->> 'email'));

CREATE POLICY "Cliente vincula acesso pago por email"
  ON acessos FOR UPDATE
  USING (status = 'pago' AND user_id IS NULL)
  WITH CHECK (status = 'pago');
