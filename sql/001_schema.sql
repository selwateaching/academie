-- ============================================================
-- BTP Manager – Étape 2 : schéma de base (tables principales)
-- À copier-coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENTREPRISES (multi-tenant : une ligne = une entreprise cliente)
-- ------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  raison_sociale text not null,
  nom_commercial text,
  logo_url text,
  siret text,
  numero_tva text,
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  site_web text,
  iban text,
  bic text,
  taux_tva_defaut numeric not null default 20,
  assurance_decennale text,
  rc_professionnelle text,
  conditions_generales text,
  mentions_legales text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- UTILISATEURS (1 ligne par utilisateur Supabase Auth)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  role text not null default 'salarie'
    check (role in ('admin','conducteur','chef_chantier','administratif','comptable','salarie','sous_traitant')),
  nom text,
  prenom text,
  telephone text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invitations : le patron/admin invite quelqu'un par email + rôle.
-- Quand cette personne crée son compte avec le même email, un trigger
-- lui attribue automatiquement l'entreprise et le rôle prévus.
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  role text not null
    check (role in ('admin','conducteur','chef_chantier','administratif','comptable','salarie','sous_traitant')),
  invited_by uuid references profiles(id),
  used boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists invitations_company_email_idx
  on invitations (company_id, lower(email)) where used = false;

-- ------------------------------------------------------------
-- CLIENTS
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type text not null default 'particulier' check (type in ('particulier','entreprise')),
  nom text,
  prenom text,
  entreprise text,
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  siret text,
  numero_tva text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_company_idx on clients(company_id);

create table if not exists client_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  nom text,
  prenom text,
  fonction text,
  telephone text,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists client_contacts_client_idx on client_contacts(client_id);

-- ------------------------------------------------------------
-- PROSPECTS (pipeline commercial simple)
-- ------------------------------------------------------------
create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  nom text,
  prenom text,
  entreprise text,
  telephone text,
  email text,
  statut text not null default 'nouveau'
    check (statut in ('nouveau','contact_pris','rendez_vous','devis_envoye','relance','gagne','perdu')),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prospects_company_idx on prospects(company_id);

-- ------------------------------------------------------------
-- HISTORIQUE DES MODIFICATIONS IMPORTANTES
-- ------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert','update','delete')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_company_idx on audit_logs(company_id, table_name, record_id);
