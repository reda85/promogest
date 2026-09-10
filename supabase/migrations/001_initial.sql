-- PromoGest Initial Schema

create extension if not exists "uuid-ossp";

-- ENUMS
create type statut_unite as enum ('DISPONIBLE','OPTION','RESERVE','COMPROMIS','NOTAIRE','VENDU','ANNULE','DESISTE');
create type statut_notaire as enum ('EN_PREPARATION','ENVOYE','EN_ATTENTE_SIGNATURE','SIGNE');
create type role_user as enum ('admin','commercial','viewer');

-- ORGANISATIONS
create table organisations (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  ville text,
  created_at timestamptz default now()
);

-- USER PROFILES
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organisations(id) on delete cascade,
  prenom text,
  nom text,
  role role_user default 'commercial',
  created_at timestamptz default now()
);

-- PROJETS
create table projets (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organisations(id) on delete cascade not null,
  nom text not null,
  ville text not null,
  quartier text not null,
  adresse text,
  consistance text,
  superficie_terrain text,
  titre_foncier text,
  maitre_ouvrage text,
  architecte text,
  bet text,
  date_permis_construire date,
  date_livraison_prevue date,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GROUPES D'HABITATION
create table ghs (
  id uuid primary key default uuid_generate_v4(),
  projet_id uuid references projets(id) on delete cascade not null,
  nom text not null,
  description text,
  created_at timestamptz default now()
);

-- IMMEUBLES
create table immeubles (
  id uuid primary key default uuid_generate_v4(),
  gh_id uuid references ghs(id) on delete cascade not null,
  projet_id uuid references projets(id) on delete cascade not null,
  nom text not null,
  nb_etages int default 0,
  created_at timestamptz default now()
);

-- UNITES
create table unites (
  id uuid primary key default uuid_generate_v4(),
  immeuble_id uuid references immeubles(id) on delete cascade not null,
  gh_id uuid references ghs(id) not null,
  projet_id uuid references projets(id) not null,
  reference text not null,
  numero text not null,
  type text not null,
  etage text not null,
  surface numeric(8,2) not null,
  prix numeric(12,2) not null,
  orientation text,
  facade text,
  nb_pieces int,
  terrasse_surface numeric(6,2),
  statut statut_unite default 'DISPONIBLE' not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(immeuble_id, numero)
);

-- CLIENTS
create table clients (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organisations(id) on delete cascade not null,
  prenom text not null,
  nom text not null,
  cin text not null,
  telephone text not null,
  telephone_2 text,
  email text,
  ville text,
  adresse text,
  date_naissance date,
  situation_familiale text,
  profession text,
  employeur text,
  revenu_mensuel numeric(10,2),
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RESERVATIONS
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  unite_id uuid references unites(id) not null,
  client_id uuid references clients(id) not null,
  statut statut_unite default 'OPTION' not null,
  date_reservation date not null,
  montant_avance numeric(12,2),
  mode_paiement text,
  banque text,
  mode_versement_avance text,
  numero_cheque text,
  montant_mensualite numeric(10,2),
  nb_mensualites int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HISTORIQUE UNITES
create table historique_unites (
  id uuid primary key default uuid_generate_v4(),
  unite_id uuid references unites(id) on delete cascade not null,
  type text not null,
  details text,
  agent text,
  client_nom text,
  reservation_id uuid references reservations(id),
  created_at timestamptz default now()
);

-- NOTAIRES
create table notaires (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organisations(id) on delete cascade not null,
  nom text not null,
  ville text,
  telephone text,
  email text,
  created_at timestamptz default now()
);

-- DOSSIERS NOTAIRE
create table dossiers_notaire (
  id uuid primary key default uuid_generate_v4(),
  unite_id uuid references unites(id) not null,
  reservation_id uuid references reservations(id) not null,
  client_id uuid references clients(id) not null,
  notaire_id uuid references notaires(id) not null,
  statut statut_notaire default 'EN_PREPARATION' not null,
  date_envoi date,
  date_signature_prevue date,
  date_signature_effective date,
  frais_notaire numeric(10,2),
  droits_enregistrement numeric(10,2),
  conservation_fonciere numeric(10,2),
  mode_paiement text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DOCUMENTS DOSSIER
create table documents_dossier (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid references dossiers_notaire(id) on delete cascade not null,
  label text not null,
  obligatoire boolean default false,
  fourni boolean default false,
  date_fourni date,
  notes text,
  fichier_url text,
  created_at timestamptz default now()
);

-- UPDATED_AT TRIGGER
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projets_updated_at before update on projets for each row execute function update_updated_at();
create trigger trg_unites_updated_at before update on unites for each row execute function update_updated_at();
create trigger trg_clients_updated_at before update on clients for each row execute function update_updated_at();
create trigger trg_reservations_updated_at before update on reservations for each row execute function update_updated_at();
create trigger trg_dossiers_updated_at before update on dossiers_notaire for each row execute function update_updated_at();

-- AUTO-LOG STATUT CHANGE
create or replace function log_unite_statut_change()
returns trigger as $$
begin
  if old.statut is distinct from new.statut then
    insert into historique_unites(unite_id, type, details)
    values(new.id, new.statut, 'Statut: ' || old.statut || ' -> ' || new.statut);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_unite_statut_log after update on unites for each row execute function log_unite_statut_change();

-- RLS
alter table organisations enable row level security;
alter table projets enable row level security;
alter table ghs enable row level security;
alter table immeubles enable row level security;
alter table unites enable row level security;
alter table clients enable row level security;
alter table reservations enable row level security;
alter table historique_unites enable row level security;
alter table notaires enable row level security;
alter table dossiers_notaire enable row level security;
alter table documents_dossier enable row level security;
alter table user_profiles enable row level security;

create or replace function my_org_id() returns uuid as $$
  select org_id from user_profiles where id = auth.uid()
$$ language sql stable security definer;

create policy "org_projets" on projets using (org_id = my_org_id());
create policy "org_clients" on clients using (org_id = my_org_id());
create policy "org_notaires" on notaires using (org_id = my_org_id());
create policy "org_profiles" on user_profiles using (org_id = my_org_id() or id = auth.uid());
create policy "org_ghs" on ghs using (projet_id in (select id from projets where org_id = my_org_id()));
create policy "org_immeubles" on immeubles using (projet_id in (select id from projets where org_id = my_org_id()));
create policy "org_unites" on unites using (projet_id in (select id from projets where org_id = my_org_id()));
create policy "org_reservations" on reservations using (client_id in (select id from clients where org_id = my_org_id()));
create policy "org_historique" on historique_unites using (unite_id in (select id from unites where projet_id in (select id from projets where org_id = my_org_id())));
create policy "org_dossiers" on dossiers_notaire using (client_id in (select id from clients where org_id = my_org_id()));
create policy "org_documents" on documents_dossier using (dossier_id in (select id from dossiers_notaire where client_id in (select id from clients where org_id = my_org_id())));

-- INDEXES
create index idx_projets_org on projets(org_id);
create index idx_ghs_projet on ghs(projet_id);
create index idx_immeubles_gh on immeubles(gh_id);
create index idx_unites_immeuble on unites(immeuble_id);
create index idx_unites_statut on unites(statut);
create index idx_clients_org on clients(org_id);
create index idx_reservations_client on reservations(client_id);
create index idx_reservations_unite on reservations(unite_id);
create index idx_dossiers_client on dossiers_notaire(client_id);
