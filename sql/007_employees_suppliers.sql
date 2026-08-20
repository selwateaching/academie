-- ============================================================
-- BTP Manager – Étape 9 : Équipes (salariés) + Sous-traitants + Fournisseurs
-- À exécuter après les scripts précédents (001 à 006).
-- N'affecte aucune donnée existante — les nouvelles colonnes sur
-- "profiles" sont ajoutées avec "add column if not exists", donc
-- tous les comptes déjà créés continuent de fonctionner normalement.
-- ============================================================

alter table profiles add column if not exists poste text;
alter table profiles add column if not exists qualification text;
alter table profiles add column if not exists taux_horaire numeric;
alter table profiles add column if not exists date_embauche date;
alter table profiles add column if not exists habilitations text;
alter table profiles add column if not exists visite_medicale_date date;

create table if not exists employee_hours (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  project_id uuid references projects(id),
  date date not null default current_date,
  heures_normales numeric not null default 0,
  heures_supplementaires numeric not null default 0,
  heures_deplacement numeric not null default 0,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists employee_hours_company_idx on employee_hours(company_id);
create index if not exists employee_hours_profile_idx on employee_hours(profile_id);

create table if not exists subcontractors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  entreprise text not null,
  contact_nom text,
  telephone text,
  email text,
  siret text,
  assurance_decennale text,
  assurance_decennale_expiration date,
  rc_professionnelle text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subcontractors_company_idx on subcontractors(company_id);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  entreprise text not null,
  contact_nom text,
  telephone text,
  email text,
  adresse text,
  conditions_paiement text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists suppliers_company_idx on suppliers(company_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table employee_hours enable row level security;
alter table subcontractors enable row level security;
alter table suppliers enable row level security;

drop policy if exists employee_hours_select on employee_hours;
create policy employee_hours_select on employee_hours
  for select using (company_id = public.current_company_id());

drop policy if exists employee_hours_insert on employee_hours;
create policy employee_hours_insert on employee_hours
  for insert with check (company_id = public.current_company_id());

drop policy if exists employee_hours_update on employee_hours;
create policy employee_hours_update on employee_hours
  for update using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','chef_chantier')
  );

drop policy if exists employee_hours_delete on employee_hours;
create policy employee_hours_delete on employee_hours
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

drop policy if exists subcontractors_select on subcontractors;
create policy subcontractors_select on subcontractors
  for select using (company_id = public.current_company_id());

drop policy if exists subcontractors_insert on subcontractors;
create policy subcontractors_insert on subcontractors
  for insert with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists subcontractors_update on subcontractors;
create policy subcontractors_update on subcontractors
  for update using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists subcontractors_delete on subcontractors;
create policy subcontractors_delete on subcontractors
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

drop policy if exists suppliers_select on suppliers;
create policy suppliers_select on suppliers
  for select using (company_id = public.current_company_id());

drop policy if exists suppliers_insert on suppliers;
create policy suppliers_insert on suppliers
  for insert with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists suppliers_update on suppliers;
create policy suppliers_update on suppliers
  for update using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists suppliers_delete on suppliers;
create policy suppliers_delete on suppliers
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

-- ------------------------------------------------------------
-- Audit
-- ------------------------------------------------------------
drop trigger if exists subcontractors_audit on subcontractors;
create trigger subcontractors_audit
  before insert or update or delete on subcontractors
  for each row execute function public.log_audit();

drop trigger if exists suppliers_audit on suppliers;
create trigger suppliers_audit
  before insert or update or delete on suppliers
  for each row execute function public.log_audit();
