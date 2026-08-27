-- ============================================================
-- COCKPIT DE GESTÃO DE MARKETING — schema Supabase/Postgres
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ALAVANCAS -----------------------------------------------------
create table if not exists levers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- PAUTAS ----------------------------------------------------------
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  lever_id uuid not null references levers(id) on delete cascade,
  name text not null,
  strategy text default '',
  objective text default '',
  created_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);

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
-- RLS — qualquer usuário autenticado (sua equipe) lê e escreve tudo.
-- Simples e adequado para um cockpit de uso interno de um único time.
-- ============================================================
alter table levers enable row level security;
alter table topics enable row level security;
alter table kpis enable row level security;
alter table participants enable row level security;
alter table meetings enable row level security;
alter table topic_notes enable row level security;
alter table action_items enable row level security;

create policy "authenticated full access" on levers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on topics for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on kpis for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on participants for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on meetings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on topic_notes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on action_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
