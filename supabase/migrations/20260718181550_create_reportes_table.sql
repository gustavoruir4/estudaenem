-- Tabela para reportes de problemas em questões, enviados pelo usuário
-- direto no card da questão ("Reportar questão").

create table if not exists reportes (
  id bigint generated always as identity primary key,
  questao_id integer not null,
  mensagem text not null,
  created_at timestamptz not null default now()
);

alter table reportes enable row level security;

-- Qualquer usuário autenticado pode registrar um reporte.
-- Sem policy de SELECT/UPDATE/DELETE: a leitura é feita via dashboard
-- do Supabase (service role), não pelo app.
create policy "Usuario autenticado pode reportar"
  on reportes for insert
  to authenticated
  with check (true);
