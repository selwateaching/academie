-- ============================================================
-- BTP Manager – Étape 5 : Chantiers (version minimale) + Devis
-- À exécuter après 001, 002 et 003.
-- N'affecte aucune donnée existante (clients, prospects...).
-- ============================================================

-- ------------------------------------------------------------
-- CHANTIERS (version de base : sera enrichie à l'Étape 7 par
-- de simples "alter table ... add column", sans jamais supprimer
-- de données)
-- ------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid references clients(id),
  nom text not null,
  adresse text,
  statut text not null default 'preparation'
    check (statut in ('preparation','demarrage','en_cours','en_retard','suspendu','termine','reception','cloture')),
  date_debut date,
  date_fin_prevue date,
  budget numeric,
  responsable_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_company_idx on projects(company_id);

-- ------------------------------------------------------------
-- Numérotation automatique des devis, par entreprise.
-- ------------------------------------------------------------
alter table companies add column if not exists next_quote_number integer not null default 1;

create or replace function public.next_quote_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num int;
  v_year text := to_char(now(), 'YYYY');
begin
  if p_company_id <> public.current_company_id() then
    raise exception 'Entreprise non autorisée.';
  end if;

  update companies set next_quote_number = coalesce(next_quote_number, 1) + 1
  where id = p_company_id
  returning next_quote_number - 1 into v_num;

  return 'DEV-' || v_year || '-' || lpad(v_num::text, 4, '0');
end;
$$;

-- ------------------------------------------------------------
-- DEVIS
-- ------------------------------------------------------------
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id),
  project_id uuid references projects(id),
  numero text not null,
  statut text not null default 'brouillon'
    check (statut in ('brouillon','envoye','consulte','accepte','refuse','expire','annule')),
  date_emission date not null default current_date,
  validite_jours integer not null default 30,
  conditions_paiement text,
  acompte_pct numeric default 0,
  notes text,
  total_ht numeric not null default 0,
  total_tva numeric not null default 0,
  total_ttc numeric not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_company_idx on quotes(company_id);
create unique index if not exists quotes_company_numero_idx on quotes(company_id, numero);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  quote_id uuid not null references quotes(id) on delete cascade,
  type text not null default 'prestation' check (type in ('prestation','materiau','main_oeuvre')),
  description text not null,
  quantite numeric not null default 1,
  unite text not null default 'u',
  prix_unitaire numeric not null default 0,
  taux_tva numeric not null default 20,
  remise_pct numeric not null default 0,
  ordre integer not null default 0
);
create index if not exists quote_items_quote_idx on quote_items(quote_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table projects enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;

drop policy if exists projects_select on projects;
create policy projects_select on projects
  for select using (company_id = public.current_company_id());

drop policy if exists projects_write on projects;
create policy projects_write on projects
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists projects_delete on projects;
create policy projects_delete on projects
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

drop policy if exists quotes_select on quotes;
create policy quotes_select on quotes
  for select using (company_id = public.current_company_id());

drop policy if exists quotes_insert on quotes;
create policy quotes_insert on quotes
  for insert with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists quotes_update on quotes;
create policy quotes_update on quotes
  for update using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists quotes_delete on quotes;
create policy quotes_delete on quotes
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur')
  );

drop policy if exists quote_items_all on quote_items;
create policy quote_items_all on quote_items
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif')
  );

drop policy if exists quote_items_select on quote_items;
create policy quote_items_select on quote_items
  for select using (company_id = public.current_company_id());

-- ------------------------------------------------------------
-- Audit
-- ------------------------------------------------------------
drop trigger if exists projects_audit on projects;
create trigger projects_audit
  before insert or update or delete on projects
  for each row execute function public.log_audit();

drop trigger if exists quotes_audit on quotes;
create trigger quotes_audit
  before insert or update or delete on quotes
  for each row execute function public.log_audit();
