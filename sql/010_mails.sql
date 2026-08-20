-- ============================================================
-- BTP Manager – Étape 12 : Courrier (entrant / sortant)
-- À exécuter après les scripts précédents (001 à 009).
-- N'affecte aucune donnée existante.
-- ============================================================

create table if not exists mails (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  direction text not null check (direction in ('entrant','sortant')),
  date date not null default current_date,
  contact text,
  email_contact text,
  objet text not null,
  categorie text default 'autre',
  priorite text not null default 'normale' check (priorite in ('basse','normale','haute','urgente')),
  client_id uuid references clients(id),
  project_id uuid references projects(id),
  document_id uuid references documents(id),
  responsable_id uuid references profiles(id),
  statut text not null default 'a_traiter' check (statut in ('a_traiter','en_cours','traite','archive')),
  date_reponse date,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mails_company_idx on mails(company_id);

alter table mails enable row level security;

drop policy if exists mails_select on mails;
create policy mails_select on mails for select using (company_id = public.current_company_id());

drop policy if exists mails_insert on mails;
create policy mails_insert on mails for insert with check (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','conducteur','administratif')
);

drop policy if exists mails_update on mails;
create policy mails_update on mails for update using (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','conducteur','administratif')
);

drop policy if exists mails_delete on mails;
create policy mails_delete on mails for delete using (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','conducteur')
);

drop trigger if exists mails_audit on mails;
create trigger mails_audit before insert or update or delete on mails
  for each row execute function public.log_audit();
