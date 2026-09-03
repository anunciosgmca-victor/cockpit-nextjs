-- ============================================================
-- COCKPIT DE GESTÃO DE MARKETING — schema Supabase/Postgres
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ALAVANCAS -----------------------------------------------------
-- "workspace" separa os dados de cada instância do app (ex: '/' vs
-- '/grupoordos') dentro do mesmo banco/projeto Supabase.
create table if not exists levers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workspace text not null default 'default',
  created_at timestamptz not null default now()
);
create index if not exists levers_workspace_idx on levers(workspace);

-- PAUTAS ----------------------------------------------------------
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  lever_id uuid not null references levers(id) on delete cascade,
  name text not null,
  strategy text default '',
  objective text default '',
  workspace text not null default 'default',
  created_at timestamptz not null default now()
);
create index if not exists topics_workspace_idx on topics(workspace);

-- INDICADORES -------------------------------------------------------
create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  unit text default '',
  goal numeric default 0,
  current numeric default 0,
  previous numeric,
  source text default '',
  created_at timestamptz not null default now()
);

-- PARTICIPANTES (por pauta) -----------------------------------------
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  role text default '',
  email text default '',
  created_at timestamptz not null default now()
);

-- REUNIÕES ----------------------------------------------------------
create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  status text not null default 'aberta', -- aberta | fechada
  closed_at timestamptz,
  workspace text not null default 'default',
  created_at timestamptz not null default now()
);
create index if not exists meetings_workspace_idx on meetings(workspace);

-- DEFINIÇÕES / NOTAS DE PAUTA (histórico) ----------------------------
create table if not exists topic_notes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  meeting_id uuid references meetings(id) on delete set null,
  date date not null default current_date,
  decision text default '',
  created_at timestamptz not null default now()
);

-- ENCAMINHAMENTOS -----------------------------------------------------
create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  note_id uuid references topic_notes(id) on delete set null,
  meeting_id uuid references meetings(id) on delete set null,
  description text not null,
  responsible text default '',
  deadline date,
  status text not null default 'Não iniciado', -- Não iniciado | Em andamento | Concluído | Atrasado
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS — o app não tem login, então usa a chave anon do Supabase.
-- Liberado para leitura/escrita pública. Adequado apenas para uso
-- interno com a URL não divulgada; não exponha publicamente.
-- ============================================================
alter table levers enable row level security;
alter table topics enable row level security;
alter table kpis enable row level security;
alter table participants enable row level security;
alter table meetings enable row level security;
alter table topic_notes enable row level security;
alter table action_items enable row level security;

create policy "public full access" on levers for all using (true) with check (true);
create policy "public full access" on topics for all using (true) with check (true);
create policy "public full access" on kpis for all using (true) with check (true);
create policy "public full access" on participants for all using (true) with check (true);
create policy "public full access" on meetings for all using (true) with check (true);
create policy "public full access" on topic_notes for all using (true) with check (true);
create policy "public full access" on action_items for all using (true) with check (true);
