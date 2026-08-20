-- ============================================================
-- BTP Manager – Étape 8 : Tâches + Agenda (rendez-vous)
-- À exécuter après les scripts précédents (001 à 005).
-- N'affecte aucune donnée existante.
-- ============================================================

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  titre text not null,
  description text,
  statut text not null default 'a_faire' check (statut in ('a_faire','en_cours','termine','bloque')),
  priorite text not null default 'normale' check (priorite in ('basse','normale','haute','urgente')),
  echeance date,
  client_id uuid references clients(id),
  project_id uuid references projects(id),
  assigned_to uuid references profiles(id),
  quote_id uuid references quotes(id),
  invoice_id uuid references invoices(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_company_idx on tasks(company_id);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  titre text not null,
  type text not null default 'autre'
    check (type in ('client','visite_chantier','reunion','livraison','intervention','fournisseur','autre')),
  date_debut timestamptz not null,
  date_fin timestamptz,
  lieu text,
  client_id uuid references clients(id),
  project_id uuid references projects(id),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_company_idx on appointments(company_id);
create index if not exists appointments_date_idx on appointments(date_debut);

-- ------------------------------------------------------------
-- RLS — tous les rôles actifs de l'entreprise peuvent gérer leurs
-- tâches/rendez-vous (contrairement aux modules commerciaux, plus
-- restrictifs) ; seuls admin/conducteur peuvent supprimer.
-- ------------------------------------------------------------
alter table tasks enable row level security;
alter table appointments enable row level security;

drop policy if exists tasks_select on tasks;
create policy tasks_select on tasks
  for select using (company_id = public.current_company_id());

drop policy if exists tasks_insert on tasks;
create policy tasks_insert on tasks
  for insert with check (company_id = public.current_company_id());

drop policy if exists tasks_update on tasks;
create policy tasks_update on tasks
  for update using (company_id = public.current_company_id());

drop policy if exists tasks_delete on tasks;
create policy tasks_delete on tasks
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

drop policy if exists appointments_select on appointments;
create policy appointments_select on appointments
  for select using (company_id = public.current_company_id());

drop policy if exists appointments_insert on appointments;
create policy appointments_insert on appointments
  for insert with check (company_id = public.current_company_id());

drop policy if exists appointments_update on appointments;
create policy appointments_update on appointments
  for update using (company_id = public.current_company_id());

drop policy if exists appointments_delete on appointments;
create policy appointments_delete on appointments
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

-- ------------------------------------------------------------
-- Audit
-- ------------------------------------------------------------
drop trigger if exists tasks_audit on tasks;
create trigger tasks_audit
  before insert or update or delete on tasks
  for each row execute function public.log_audit();

drop trigger if exists appointments_audit on appointments;
create trigger appointments_audit
  before insert or update or delete on appointments
  for each row execute function public.log_audit();
