-- ============================================================
-- BTP Manager – Étape 2 : fonctions et déclencheurs
-- À exécuter après 001_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- Renvoie l'entreprise de l'utilisateur actuellement connecté.
-- "security definer" = s'exécute avec les droits du propriétaire,
-- ce qui évite les boucles infinies dans les policies RLS.
-- ------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- Création d'une entreprise + de son premier utilisateur (patron).
-- Appelée depuis la page d'inscription, une seule fois par entreprise.
-- Empêche un utilisateur qui a déjà un profil d'en créer un second.
-- ------------------------------------------------------------
create or replace function public.create_company_and_owner(
  p_raison_sociale text,
  p_nom text,
  p_prenom text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Un profil existe déjà pour cet utilisateur.';
  end if;

  insert into companies (raison_sociale)
  values (p_raison_sociale)
  returning id into v_company_id;

  insert into profiles (id, company_id, role, nom, prenom)
  values (auth.uid(), v_company_id, 'admin', p_nom, p_prenom);

  return v_company_id;
end;
$$;

-- ------------------------------------------------------------
-- Quand un utilisateur invité crée son compte (même email qu'une
-- invitation non utilisée), on lui attribue automatiquement
-- l'entreprise et le rôle prévus par l'admin qui l'a invité.
-- ------------------------------------------------------------
create or replace function public.handle_new_user_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invit invitations%rowtype;
begin
  select * into v_invit
  from invitations
  where lower(email) = lower(new.email) and used = false
  order by created_at desc
  limit 1;

  if found then
    insert into profiles (id, company_id, role)
    values (new.id, v_invit.company_id, v_invit.role);

    update invitations set used = true where id = v_invit.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_invitation();

-- ------------------------------------------------------------
-- Historique automatique (audit_logs) sur les tables sensibles.
-- ------------------------------------------------------------
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into audit_logs (company_id, table_name, record_id, action, new_data, user_id)
    values (new.company_id, tg_table_name, new.id, 'insert', to_jsonb(new), auth.uid());
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into audit_logs (company_id, table_name, record_id, action, old_data, new_data, user_id)
    values (new.company_id, tg_table_name, new.id, 'update', to_jsonb(old), to_jsonb(new), auth.uid());
    new.updated_at = now();
    return new;
  elsif (tg_op = 'DELETE') then
    insert into audit_logs (company_id, table_name, record_id, action, old_data, user_id)
    values (old.company_id, tg_table_name, old.id, 'delete', to_jsonb(old), auth.uid());
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists clients_audit on clients;
create trigger clients_audit
  before insert or update or delete on clients
  for each row execute function public.log_audit();

drop trigger if exists prospects_audit on prospects;
create trigger prospects_audit
  before insert or update or delete on prospects
  for each row execute function public.log_audit();
