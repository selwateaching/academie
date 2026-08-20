-- ============================================================
-- BTP Manager – Étape 10 : Stock de matériaux + Achats/Commandes
-- À exécuter après les scripts précédents (001 à 007).
-- N'affecte aucune donnée existante.
-- ============================================================

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  reference text,
  designation text not null,
  categorie text,
  unite text not null default 'u',
  supplier_id uuid references suppliers(id),
  prix_achat numeric default 0,
  quantite_stock numeric not null default 0,
  stock_min numeric not null default 0,
  emplacement text,
  project_id uuid references projects(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists materials_company_idx on materials(company_id);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  type text not null check (type in ('entree','sortie','transfert','inventaire','correction')),
  quantite numeric not null,
  project_id uuid references projects(id),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_company_idx on stock_movements(company_id);
create index if not exists stock_movements_material_idx on stock_movements(material_id);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  project_id uuid references projects(id),
  numero text not null,
  statut text not null default 'demande'
    check (statut in ('demande','commandee','livree','receptionnee','annulee')),
  date_commande date default current_date,
  date_livraison_prevue date,
  notes text,
  total_ht numeric not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists purchase_orders_company_idx on purchase_orders(company_id);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  material_id uuid references materials(id),
  description text not null,
  quantite numeric not null default 1,
  prix_unitaire numeric not null default 0,
  ordre integer not null default 0
);
create index if not exists purchase_order_items_po_idx on purchase_order_items(purchase_order_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table materials enable row level security;
alter table stock_movements enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;

drop policy if exists materials_select on materials;
create policy materials_select on materials for select using (company_id = public.current_company_id());
drop policy if exists materials_insert on materials;
create policy materials_insert on materials for insert with check (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif','chef_chantier')
);
drop policy if exists materials_update on materials;
create policy materials_update on materials for update using (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif','chef_chantier')
);
drop policy if exists materials_delete on materials;
create policy materials_delete on materials for delete using (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur')
);

drop policy if exists stock_movements_select on stock_movements;
create policy stock_movements_select on stock_movements for select using (company_id = public.current_company_id());
drop policy if exists stock_movements_insert on stock_movements;
create policy stock_movements_insert on stock_movements for insert with check (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif','chef_chantier')
);
drop policy if exists stock_movements_delete on stock_movements;
create policy stock_movements_delete on stock_movements for delete using (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur')
);

drop policy if exists purchase_orders_select on purchase_orders;
create policy purchase_orders_select on purchase_orders for select using (company_id = public.current_company_id());
drop policy if exists purchase_orders_insert on purchase_orders;
create policy purchase_orders_insert on purchase_orders for insert with check (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif')
);
drop policy if exists purchase_orders_update on purchase_orders;
create policy purchase_orders_update on purchase_orders for update using (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif')
);
drop policy if exists purchase_orders_delete on purchase_orders;
create policy purchase_orders_delete on purchase_orders for delete using (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur')
);

drop policy if exists purchase_order_items_all on purchase_order_items;
create policy purchase_order_items_all on purchase_order_items for all using (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif')
) with check (
  company_id = public.current_company_id() and public.current_role() in ('admin','conducteur','administratif')
);
drop policy if exists purchase_order_items_select on purchase_order_items;
create policy purchase_order_items_select on purchase_order_items for select using (company_id = public.current_company_id());

-- ------------------------------------------------------------
-- Numérotation des commandes
-- ------------------------------------------------------------
alter table companies add column if not exists next_po_number integer not null default 1;

create or replace function public.next_po_number(p_company_id uuid)
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
  update companies set next_po_number = coalesce(next_po_number, 1) + 1
  where id = p_company_id
  returning next_po_number - 1 into v_num;
  return 'CMD-' || v_year || '-' || lpad(v_num::text, 4, '0');
end;
$$;

-- ------------------------------------------------------------
-- Audit
-- ------------------------------------------------------------
drop trigger if exists materials_audit on materials;
create trigger materials_audit before insert or update or delete on materials
  for each row execute function public.log_audit();
drop trigger if exists purchase_orders_audit on purchase_orders;
create trigger purchase_orders_audit before insert or update or delete on purchase_orders
  for each row execute function public.log_audit();
