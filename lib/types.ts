export type StatutUnite = "DISPONIBLE" | "OPTION" | "RESERVE" | "COMPROMIS" | "NOTAIRE" | "VENDU" | "ANNULE" | "DESISTE";
export type StatutNotaire = "EN_PREPARATION" | "ENVOYE" | "EN_ATTENTE_SIGNATURE" | "SIGNE";
export type RoleUser = "admin" | "commercial" | "viewer";
export type TypeTache = "APPEL" | "RDV" | "RELANCE" | "EMAIL" | "VISITE" | "DOCUMENT" | "AUTRE";
export type PrioriteTache = "BASSE" | "NORMALE" | "HAUTE";
export type TypePaiement = "AVANCE" | "MENSUALITE" | "VERSEMENT" | "SOLDE_FINAL" | "AUTRE";

export interface Organisation {
  id: string;
  nom: string;
  ville?: string;
  created_at: string;
}

export interface Projet {
  id: string;
  org_id: string;
  nom: string;
  ville: string;
  quartier: string;
  adresse?: string;
  consistance?: string;
  superficie_terrain?: string;
  titre_foncier?: string;
  maitre_ouvrage?: string;
  architecte?: string;
  bet?: string;
  date_permis_construire?: string;
  date_livraison_prevue?: string;
  description?: string;
  created_at: string;
  // Computed
  nb_ghs?: number;
  nb_immeubles?: number;
  nb_unites?: number;
  nb_vendues?: number;
  ca_realise?: number;
  statuts_count?: Record<StatutUnite, number>;
}

export interface GH {
  id: string;
  projet_id: string;
  nom: string;
  description?: string;
  created_at: string;
  nb_immeubles?: number;
  nb_unites?: number;
}

export interface Immeuble {
  id: string;
  gh_id: string;
  projet_id: string;
  nom: string;
  nb_etages: number;
  created_at: string;
  unites?: Unite[];
}

export interface Unite {
  id: string;
  immeuble_id: string;
  gh_id: string;
  projet_id: string;
  reference: string;
  numero: string;
  type: string;
  etage: string;
  surface: number;
  prix: number;
  orientation?: string;
  facade?: string;
  nb_pieces?: number;
  terrasse_surface?: number;
  statut: StatutUnite;
  created_at: string;
  updated_at: string;
  // Joined
  client?: Client;
  reservation?: Reservation;
}

export interface Client {
  id: string;
  org_id: string;
  prenom: string;
  nom: string;
  cin: string;
  telephone: string;
  telephone_2?: string;
  email?: string;
  ville?: string;
  adresse?: string;
  date_naissance?: string;
  situation_familiale?: string;
  profession?: string;
  employeur?: string;
  revenu_mensuel?: number;
  source?: string;
  notes?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  unite_id: string;
  client_id: string;
  statut: StatutUnite;
  date_reservation: string;
  montant_avance?: number;
  mode_paiement?: string;
  banque?: string;
  mode_versement_avance?: string;
  numero_cheque?: string;
  montant_mensualite?: number;
  nb_mensualites?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  unite?: Unite;
  client?: Client;
}

export interface HistoriqueUnite {
  id: string;
  unite_id: string;
  type: string;
  details?: string;
  agent?: string;
  client_nom?: string;
  reservation_id?: string;
  created_at: string;
}

export interface Tache {
  id: string;
  org_id: string;
  titre: string;
  type: TypeTache;
  priorite: PrioriteTache;
  description?: string;
  echeance: string;
  terminee: boolean;
  date_realisation?: string;
  agent?: string;
  client_id?: string;
  reservation_id?: string;
  projet_id?: string;
  created_at: string;
  updated_at: string;
  // Joined
  client?: Client;
  reservation?: Reservation;
  projet?: Projet;
}

export interface Paiement {
  id: string;
  reservation_id: string;
  type: TypePaiement;
  montant: number;
  date_paiement: string;
  mode_paiement?: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface Notaire {
  id: string;
  org_id: string;
  nom: string;
  ville?: string;
  telephone?: string;
  email?: string;
  created_at: string;
}

export interface DossierNotaire {
  id: string;
  unite_id: string;
  reservation_id: string;
  client_id: string;
  notaire_id: string;
  statut: StatutNotaire;
  date_envoi?: string;
  date_signature_prevue?: string;
  date_signature_effective?: string;
  frais_notaire?: number;
  droits_enregistrement?: number;
  conservation_fonciere?: number;
  mode_paiement?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  unite?: Unite;
  client?: Client;
  notaire?: Notaire;
  reservation?: Reservation;
  documents?: DocumentDossier[];
}

export interface DocumentDossier {
  id: string;
  dossier_id: string;
  label: string;
  obligatoire: boolean;
  fourni: boolean;
  date_fourni?: string;
  notes?: string;
  fichier_url?: string;
  created_at: string;
}

// Dashboard types
export interface DashboardKPIs {
  unites_vendues: number;
  total_unites: number;
  reservations_en_cours: number;
  ca_realise: number;
  ca_pipeline: number;
  repartition_statuts: Record<StatutUnite, number>;
}
