-- Ejecuta esto en Supabase > SQL Editor

create table predictions (
  name text primary key,
  data jsonb not null,
  paid boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table drafts (
  name text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

create table official (
  id int primary key default 1,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Acceso público (anon key puede leer y escribir)
alter table predictions enable row level security;
alter table drafts enable row level security;
alter table official enable row level security;

create policy "public read predictions"  on predictions for select using (true);
create policy "public write predictions" on predictions for insert with check (true);
create policy "public update predictions" on predictions for update using (true);

create policy "public read drafts"  on drafts for select using (true);
create policy "public write drafts" on drafts for insert with check (true);
create policy "public update drafts" on drafts for update using (true);

create policy "public read official"  on official for select using (true);
create policy "public write official" on official for insert with check (true);
create policy "public update official" on official for update using (true);

-- Tiempo real
alter publication supabase_realtime add table predictions;
alter publication supabase_realtime add table official;
