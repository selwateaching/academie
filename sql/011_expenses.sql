-- ============================================================
-- BTP Manager – Étape 13 : Dépenses et trésorerie
-- À exécuter après les scripts précédents (001 à 010).
-- N'affecte aucune donnée existante.
-- ============================================================

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  categorie text not null default 'autre'
    check (categorie in ('achat_materiaux','salaires','sous_traitance','charges','fournitures','autre')),
  libelle text not null,
  montant numeric not null,
  date date not null default current_date,
  project_id uuid references projects(id),
  supplier_id uuid references suppliers(id),
  moyen_paiement text not null default 'virement'
    check (moyen_paiement in ('virement','cheque','especes','carte','prelevement','autre')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists expenses_company_idx on expenses(company_id);
create index if not exists expenses_date_idx on expenses(date);

alter table expenses enable row level security;

drop policy if exists expenses_select on expenses;
create policy expenses_select on expenses for select using (company_id = public.current_company_id());

drop policy if exists expenses_insert on expenses;
create policy expenses_insert on expenses for insert with check (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','conducteur','administratif','comptable')
);

drop policy if exists expenses_update on expenses;
create policy expenses_update on expenses for update using (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','conducteur','administratif','comptable')
);

drop policy if exists expenses_delete on expenses;
create policy expenses_delete on expenses for delete using (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','comptable')
);

drop trigger if exists expenses_audit on expenses;
create trigger expenses_audit before insert or update or delete on expenses
  for each row execute function public.log_audit();
