-- ============================================================
-- Migração: adiciona suporte a múltiplas instâncias (workspaces)
-- ao mesmo projeto Supabase — ex: '/' (principal) e '/grupoordos'.
-- Rode este arquivo UMA VEZ no SQL Editor do seu projeto Supabase
-- já existente. É seguro rodar mais de uma vez (idempotente).
--
-- Todos os dados que já existem hoje ficam automaticamente
-- marcados como workspace = 'default' (a instância principal) —
-- nada do que você já tem se move ou se perde.
-- ============================================================

alter table levers   add column if not exists workspace text not null default 'default';
alter table topics   add column if not exists workspace text not null default 'default';
alter table meetings add column if not exists workspace text not null default 'default';

create index if not exists levers_workspace_idx on levers(workspace);
create index if not exists topics_workspace_idx on topics(workspace);
create index if not exists meetings_workspace_idx on meetings(workspace);
