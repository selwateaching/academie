-- ============================================================
-- BTP Manager – Étape 2 : Row Level Security
-- À exécuter après 001_schema.sql et 002_functions.sql
-- Principe : un utilisateur ne voit/modifie QUE les données de
-- sa propre entreprise (company_id = current_company_id()).
-- ============================================================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table invitations enable row level security;
alter table clients enable row level security;
alter table client_contacts enable row level security;
alter table prospects enable row level security;
alter table audit_logs enable row level security;

-- ------------------------------------------------------------
-- COMPANIES
-- ------------------------------------------------------------
drop policy if exists companies_select on companies;
create policy companies_select on companies
  for select using (id = public.current_company_id());

drop policy if exists companies_insert on companies;
create policy companies_insert on companies
  for insert with check (auth.uid() is not null);
  -- la création réelle passe par create_company_and_owner();
  -- cette policy sert uniquement de garde-fou technique.

drop policy if exists companies_update on companies;
create policy companies_update on companies
  for update using (id = public.current_company_id() and public.current_role() = 'admin');

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select using (company_id = public.current_company_id() or id = auth.uid());

drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles
  for update using (id = auth.uid());

drop policy if exists profiles_update_admin on profiles;
create policy profiles_update_admin on profiles
  for update using (company_id = public.current_company_id() and public.current_role() = 'admin');

-- ------------------------------------------------------------
-- INVITATIONS (visibles/gérables par admin et conducteur uniquement)
-- ------------------------------------------------------------
drop policy if exists invitations_all on invitations;
create policy invitations_all on invitations
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

-- ------------------------------------------------------------
-- CLIENTS
-- ------------------------------------------------------------
drop policy if exists clients_select on clients;
create policy clients_select on clients
  for select using (company_id = public.current_company_id());

drop policy if exists clients_insert on clients;
create policy clients_insert on clients
  for insert with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists clients_update on clients;
create policy clients_update on clients
  for update using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists clients_delete on clients;
create policy clients_delete on clients
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

-- ------------------------------------------------------------
-- CLIENT_CONTACTS (mêmes droits que la fiche client)
-- ------------------------------------------------------------
drop policy if exists client_contacts_all on client_contacts;
create policy client_contacts_all on client_contacts
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists client_contacts_select on client_contacts;
create policy client_contacts_select on client_contacts
  for select using (company_id = public.current_company_id());

-- ------------------------------------------------------------
-- PROSPECTS
-- ------------------------------------------------------------
drop policy if exists prospects_select on prospects;
create policy prospects_select on prospects
  for select using (company_id = public.current_company_id());

drop policy if exists prospects_write on prospects;
create policy prospects_write on prospects
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

-- ------------------------------------------------------------
-- AUDIT_LOGS (lecture seule, admin/comptable)
-- ------------------------------------------------------------
drop policy if exists audit_logs_select on audit_logs;
create policy audit_logs_select on audit_logs
  for select using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','comptable')
  );
