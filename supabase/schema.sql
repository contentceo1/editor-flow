-- EditorFlow — run this in your Supabase SQL editor (Database → SQL Editor → New query)

create table if not exists projects (
  id                 text primary key,
  token              text unique not null,
  client_name        text not null,
  client_email       text not null,
  project_title      text not null,
  stage              text not null default 'discovery',
  project_type       text not null default 'one_time',
  invoice_amount     numeric not null default 0,
  invoice_paid       boolean not null default false,
  assigned_editor_id text,
  delivery_date      text,
  notes              text not null default '',
  thumbnail          text,
  tasks              jsonb not null default '[]',
  daily_tasks        jsonb not null default '[]',
  revision_rounds    jsonb not null default '[]',
  retainer_periods   jsonb not null default '[]',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists team_members (
  id       text primary key,
  name     text not null,
  role     text not null,
  initials text not null,
  color    text not null
);

-- Disable RLS (internal tool — access is restricted by keeping the anon key private)
alter table projects disable row level security;
alter table team_members disable row level security;
