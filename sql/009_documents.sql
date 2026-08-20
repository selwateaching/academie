-- ============================================================
-- BTP Manager – Étape 11 : Documents (GED) via Supabase Storage
-- À exécuter après les scripts précédents (001 à 008).
-- N'affecte aucune donnée existante.
-- ============================================================

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  categorie text not null default 'autre'
    check (categorie in (
      'contrat','devis','facture','assurance','attestation','plan','photo',
      'bon_commande','bon_livraison','document_salarie','document_chantier',
      'document_fournisseur','autre'
    )),
  nom text not null,
  storage_path text not null,
  taille bigint,
  type_mime text,
  client_id uuid references clients(id),
  project_id uuid references projects(id),
  subcontractor_id uuid references subcontractors(id),
  supplier_id uuid references suppliers(id),
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists documents_company_idx on documents(company_id);

alter table documents enable row level security;

drop policy if exists documents_select on documents;
create policy documents_select on documents for select using (company_id = public.current_company_id());

drop policy if exists documents_insert on documents;
create policy documents_insert on documents for insert with check (company_id = public.current_company_id());

drop policy if exists documents_delete on documents;
create policy documents_delete on documents for delete using (
  company_id = public.current_company_id()
  and public.current_role() in ('admin','conducteur','administratif')
);

-- ------------------------------------------------------------
-- Bucket de stockage privé "documents".
-- Les fichiers sont rangés sous le chemin <company_id>/<categorie>/<fichier>,
-- ce qui permet aux policies ci-dessous d'isoler chaque entreprise.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists documents_storage_select on storage.objects;
create policy documents_storage_select on storage.objects
  for select to authenticated using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );

drop policy if exists documents_storage_insert on storage.objects;
create policy documents_storage_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );

drop policy if exists documents_storage_delete on storage.objects;
create policy documents_storage_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and public.current_role() in ('admin','conducteur','administratif')
  );
