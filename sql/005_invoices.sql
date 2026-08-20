-- ============================================================
-- BTP Manager – Étape 6 : Factures + paiements
-- À exécuter après 001, 002, 003 et 004.
-- N'affecte aucune donnée existante.
-- ============================================================

alter table companies add column if not exists next_invoice_number integer not null default 1;

create or replace function public.next_invoice_number(p_company_id uuid, p_prefix text default 'FAC')
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

  update companies set next_invoice_number = coalesce(next_invoice_number, 1) + 1
  where id = p_company_id
  returning next_invoice_number - 1 into v_num;

  return p_prefix || '-' || v_year || '-' || lpad(v_num::text, 4, '0');
end;
$$;

-- ------------------------------------------------------------
-- FACTURES
-- ------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id),
  project_id uuid references projects(id),
  quote_id uuid references quotes(id),
  type text not null default 'classique'
    check (type in ('classique','acompte','situation','finale','avoir')),
  numero text not null,
  statut text not null default 'brouillon'
    check (statut in ('brouillon','envoyee','partiellement_payee','payee','annulee')),
  date_emission date not null default current_date,
  date_echeance date,
  conditions_paiement text,
  notes text,
  total_ht numeric not null default 0,
  total_tva numeric not null default 0,
  total_ttc numeric not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_company_idx on invoices(company_id);
create unique index if not exists invoices_company_numero_idx on invoices(company_id, numero);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  type text not null default 'prestation' check (type in ('prestation','materiau','main_oeuvre')),
  description text not null,
  quantite numeric not null default 1,
  unite text not null default 'u',
  prix_unitaire numeric not null default 0,
  taux_tva numeric not null default 20,
  remise_pct numeric not null default 0,
  ordre integer not null default 0
);
create index if not exists invoice_items_invoice_idx on invoice_items(invoice_id);

-- ------------------------------------------------------------
-- PAIEMENTS
-- ------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  montant numeric not null,
  date_paiement date not null default current_date,
  moyen_paiement text not null default 'virement'
    check (moyen_paiement in ('virement','cheque','especes','carte','prelevement','autre')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists payments_invoice_idx on payments(invoice_id);
create index if not exists payments_company_idx on payments(company_id);

-- ------------------------------------------------------------
-- RLS — le rôle "comptable" a accès en écriture ici (facturation,
-- paiements), contrairement aux autres modules commerciaux.
-- ------------------------------------------------------------
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;

drop policy if exists invoices_select on invoices;
create policy invoices_select on invoices
  for select using (company_id = public.current_company_id());

drop policy if exists invoices_insert on invoices;
create policy invoices_insert on invoices
  for insert with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif','comptable')
  );

drop policy if exists invoices_update on invoices;
create policy invoices_update on invoices
  for update using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif','comptable')
  );

drop policy if exists invoices_delete on invoices;
create policy invoices_delete on invoices
  for delete using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','comptable')
  );

drop policy if exists invoice_items_all on invoice_items;
create policy invoice_items_all on invoice_items
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif','comptable')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif','comptable')
  );

drop policy if exists invoice_items_select on invoice_items;
create policy invoice_items_select on invoice_items
  for select using (company_id = public.current_company_id());

drop policy if exists payments_select on payments;
create policy payments_select on payments
  for select using (company_id = public.current_company_id());

drop policy if exists payments_write on payments;
create policy payments_write on payments
  for all using (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif','comptable')
  )
  with check (
    company_id = public.current_company_id()
    and public.current_role() in ('admin','conducteur','administratif','comptable')
  );

-- ------------------------------------------------------------
-- Audit
-- ------------------------------------------------------------
drop trigger if exists invoices_audit on invoices;
create trigger invoices_audit
  before insert or update or delete on invoices
  for each row execute function public.log_audit();

drop trigger if exists payments_audit on payments;
create trigger payments_audit
  before insert or update or delete on payments
  for each row execute function public.log_audit();
