import { type DashboardKPIs, type Projet, type Client, type Reservation, type DossierNotaire, type Unite, type Immeuble, type GH, type Notaire, type HistoriqueUnite } from "./types";

export const mockOrg = { id: "org-1", nom: "Groupe Immobilier Atlas", ville: "Casablanca", created_at: "2024-01-01T00:00:00Z" };

export const mockProjets: Projet[] = [
  {
    id: "proj-1", org_id: "org-1", nom: "Résidence Al Andalous", ville: "Casablanca", quartier: "Ain Sebaâ",
    adresse: "Boulevard Mohammed VI", consistance: "R+7, 2SS", superficie_terrain: "4500 m²",
    titre_foncier: "TF 12345/C", maitre_ouvrage: "Groupe Atlas", architecte: "M. Benali",
    date_livraison_prevue: "2025-12-31", created_at: "2024-01-15T00:00:00Z",
    nb_ghs: 2, nb_immeubles: 4, nb_unites: 120, nb_vendues: 45, ca_realise: 67500000,
    statuts_count: { DISPONIBLE: 42, OPTION: 8, RESERVE: 15, COMPROMIS: 10, NOTAIRE: 5, VENDU: 45, ANNULE: 3, DESISTE: 2 },
  },
  {
    id: "proj-2", org_id: "org-1", nom: "Villa Palmiers", ville: "Marrakech", quartier: "Guéliz",
    adresse: "Route de l'Ourika", consistance: "R+3, 1SS", superficie_terrain: "3200 m²",
    titre_foncier: "TF 67890/M", architecte: "Mme. Alaoui",
    date_livraison_prevue: "2026-06-30", created_at: "2024-03-01T00:00:00Z",
    nb_ghs: 1, nb_immeubles: 2, nb_unites: 60, nb_vendues: 18, ca_realise: 36000000,
    statuts_count: { DISPONIBLE: 30, OPTION: 4, RESERVE: 5, COMPROMIS: 3, NOTAIRE: 2, VENDU: 18, ANNULE: 1, DESISTE: 0 },
  },
  {
    id: "proj-3", org_id: "org-1", nom: "Tour Atlantique", ville: "Tanger", quartier: "Marina",
    adresse: "Front de Mer", consistance: "R+12, 3SS", superficie_terrain: "2800 m²",
    titre_foncier: "TF 11223/T",
    date_livraison_prevue: "2027-03-31", created_at: "2024-06-01T00:00:00Z",
    nb_ghs: 1, nb_immeubles: 1, nb_unites: 144, nb_vendues: 12, ca_realise: 28800000,
    statuts_count: { DISPONIBLE: 110, OPTION: 6, RESERVE: 8, COMPROMIS: 4, NOTAIRE: 4, VENDU: 12, ANNULE: 0, DESISTE: 0 },
  },
];

export const mockGHs: GH[] = [
  { id: "gh-1", projet_id: "proj-1", nom: "GH Alpha", description: "Bâtiments A et B", created_at: "2024-01-15T00:00:00Z", nb_immeubles: 2, nb_unites: 64 },
  { id: "gh-2", projet_id: "proj-1", nom: "GH Beta", description: "Bâtiments C et D", created_at: "2024-01-15T00:00:00Z", nb_immeubles: 2, nb_unites: 56 },
  { id: "gh-3", projet_id: "proj-2", nom: "GH Principal", created_at: "2024-03-01T00:00:00Z", nb_immeubles: 2, nb_unites: 60 },
  { id: "gh-4", projet_id: "proj-3", nom: "GH Tour", created_at: "2024-06-01T00:00:00Z", nb_immeubles: 1, nb_unites: 144 },
];

const etages = ["RDC", "1er", "2ème", "3ème", "4ème", "5ème", "6ème", "7ème"];
const statuts = ["DISPONIBLE", "OPTION", "RESERVE", "COMPROMIS", "NOTAIRE", "VENDU", "ANNULE", "DESISTE"] as const;
const types = ["F2", "F3", "F4", "Duplex", "Studio"];

function makeUnites(immeubleId: string, ghId: string, projetId: string, nbEtages: number, prefix: string): Unite[] {
  const unites: Unite[] = [];
  for (let e = 0; e <= nbEtages; e++) {
    const etage = etages[e] || `${e}ème`;
    for (let u = 1; u <= 4; u++) {
      const num = `${e}0${u}`;
      const statut = statuts[Math.floor(Math.random() * 5)] as typeof statuts[number]; // weight toward DISPONIBLE
      unites.push({
        id: `unite-${prefix}-${e}-${u}`,
        immeuble_id: immeubleId,
        gh_id: ghId,
        projet_id: projetId,
        reference: `${prefix}-${e}${u}`,
        numero: num,
        type: types[Math.floor(Math.random() * types.length)],
        etage,
        surface: 60 + Math.floor(Math.random() * 80),
        prix: 600000 + Math.floor(Math.random() * 1400000),
        orientation: ["Nord", "Sud", "Est", "Ouest"][Math.floor(Math.random() * 4)],
        facade: ["Principale", "Latérale"][Math.floor(Math.random() * 2)],
        nb_pieces: 2 + Math.floor(Math.random() * 3),
        terrasse_surface: Math.random() > 0.6 ? 10 + Math.floor(Math.random() * 30) : 0,
        statut: ["DISPONIBLE", "DISPONIBLE", "DISPONIBLE", "OPTION", "RESERVE", "COMPROMIS", "NOTAIRE", "VENDU"][Math.floor(Math.random() * 8)] as typeof statuts[number],
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      });
    }
  }
  return unites;
}

export const mockImmeubles: Immeuble[] = [
  { id: "imm-1", gh_id: "gh-1", projet_id: "proj-1", nom: "Immeuble A", nb_etages: 7, created_at: "2024-01-15T00:00:00Z", unites: makeUnites("imm-1", "gh-1", "proj-1", 7, "AA") },
  { id: "imm-2", gh_id: "gh-1", projet_id: "proj-1", nom: "Immeuble B", nb_etages: 7, created_at: "2024-01-15T00:00:00Z", unites: makeUnites("imm-2", "gh-1", "proj-1", 7, "AB") },
  { id: "imm-3", gh_id: "gh-2", projet_id: "proj-1", nom: "Immeuble C", nb_etages: 6, created_at: "2024-01-15T00:00:00Z", unites: makeUnites("imm-3", "gh-2", "proj-1", 6, "BC") },
  { id: "imm-4", gh_id: "gh-2", projet_id: "proj-1", nom: "Immeuble D", nb_etages: 6, created_at: "2024-01-15T00:00:00Z", unites: makeUnites("imm-4", "gh-2", "proj-1", 6, "BD") },
  { id: "imm-5", gh_id: "gh-3", projet_id: "proj-2", nom: "Villa A", nb_etages: 3, created_at: "2024-03-01T00:00:00Z", unites: makeUnites("imm-5", "gh-3", "proj-2", 3, "VA") },
  { id: "imm-6", gh_id: "gh-3", projet_id: "proj-2", nom: "Villa B", nb_etages: 3, created_at: "2024-03-01T00:00:00Z", unites: makeUnites("imm-6", "gh-3", "proj-2", 3, "VB") },
  { id: "imm-7", gh_id: "gh-4", projet_id: "proj-3", nom: "Tour Principale", nb_etages: 12, created_at: "2024-06-01T00:00:00Z", unites: makeUnites("imm-7", "gh-4", "proj-3", 12, "TP") },
];

export const mockClients: Client[] = [
  { id: "cli-1", org_id: "org-1", prenom: "Karim", nom: "Benali", cin: "AB123456", telephone: "0612345678", email: "karim.benali@gmail.com", ville: "Casablanca", source: "Facebook Ads", situation_familiale: "Marié(e)", profession: "Ingénieur", revenu_mensuel: 25000, created_at: "2024-02-01T00:00:00Z" },
  { id: "cli-2", org_id: "org-1", prenom: "Fatima", nom: "Zahra Alaoui", cin: "CD789012", telephone: "0661234567", email: "fz.alaoui@outlook.com", ville: "Rabat", source: "Walk-in", situation_familiale: "Célibataire", profession: "Médecin", revenu_mensuel: 45000, created_at: "2024-02-15T00:00:00Z" },
  { id: "cli-3", org_id: "org-1", prenom: "Mohammed", nom: "Tazi", cin: "EF345678", telephone: "0671122334", ville: "Marrakech", source: "Salon immobilier", situation_familiale: "Marié(e)", profession: "Commerçant", created_at: "2024-03-01T00:00:00Z" },
  { id: "cli-4", org_id: "org-1", prenom: "Nadia", nom: "Chraibi", cin: "GH901234", telephone: "0622334455", email: "nadia.chraibi@yahoo.fr", ville: "Casablanca", source: "Instagram", situation_familiale: "Marié(e)", profession: "Directrice", revenu_mensuel: 35000, created_at: "2024-03-10T00:00:00Z" },
  { id: "cli-5", org_id: "org-1", prenom: "Youssef", nom: "Mansouri", cin: "IJ567890", telephone: "0699887766", ville: "Fès", source: "Référence client", situation_familiale: "Célibataire", profession: "Architecte", revenu_mensuel: 28000, created_at: "2024-04-01T00:00:00Z" },
  { id: "cli-6", org_id: "org-1", prenom: "Samira", nom: "El Fassi", cin: "KL234567", telephone: "0634567890", email: "s.elfassi@gmail.com", ville: "Casablanca", source: "Site web", situation_familiale: "Divorcé(e)", created_at: "2024-04-15T00:00:00Z" },
];

export const mockNotaires: Notaire[] = [
  { id: "not-1", org_id: "org-1", nom: "Me. Bennani Abdelkader", ville: "Casablanca", telephone: "0522123456", email: "a.bennani@notaire.ma", created_at: "2024-01-01T00:00:00Z" },
  { id: "not-2", org_id: "org-1", nom: "Me. Tazi Hassan", ville: "Casablanca", telephone: "0522234567", email: "h.tazi@notaire.ma", created_at: "2024-01-01T00:00:00Z" },
  { id: "not-3", org_id: "org-1", nom: "Me. Alami Khadija", ville: "Rabat", telephone: "0537345678", email: "k.alami@notaire.ma", created_at: "2024-01-01T00:00:00Z" },
];

export const mockReservations: Reservation[] = [
  { id: "res-1", unite_id: "unite-AA-1-1", client_id: "cli-1", statut: "RESERVE", date_reservation: "2024-03-15", montant_avance: 150000, mode_paiement: "Crédit bancaire", banque: "Attijariwafa Bank", mode_versement_avance: "Chèque", numero_cheque: "1234567", created_at: "2024-03-15T10:00:00Z", updated_at: "2024-03-15T10:00:00Z", client: mockClients[0] },
  { id: "res-2", unite_id: "unite-AB-2-1", client_id: "cli-2", statut: "COMPROMIS", date_reservation: "2024-02-20", montant_avance: 250000, mode_paiement: "Comptant", mode_versement_avance: "Virement", created_at: "2024-02-20T09:00:00Z", updated_at: "2024-04-01T14:00:00Z", client: mockClients[1] },
  { id: "res-3", unite_id: "unite-BC-3-2", client_id: "cli-3", statut: "NOTAIRE", date_reservation: "2024-01-10", montant_avance: 180000, mode_paiement: "Mixte (Comptant + Crédit)", banque: "CIH Bank", mode_versement_avance: "Virement", created_at: "2024-01-10T11:00:00Z", updated_at: "2024-04-10T16:00:00Z", client: mockClients[2] },
  { id: "res-4", unite_id: "unite-VA-1-3", client_id: "cli-4", statut: "VENDU", date_reservation: "2023-11-05", montant_avance: 300000, mode_paiement: "Comptant", mode_versement_avance: "Virement", created_at: "2023-11-05T08:00:00Z", updated_at: "2024-03-20T15:00:00Z", client: mockClients[3] },
  { id: "res-5", unite_id: "unite-TP-1-2", client_id: "cli-5", statut: "OPTION", date_reservation: "2024-05-01", montant_avance: 50000, mode_paiement: "Paiement échelonné", montant_mensualite: 15000, nb_mensualites: 24, created_at: "2024-05-01T10:00:00Z", updated_at: "2024-05-01T10:00:00Z", client: mockClients[4] },
];

export const mockDossiers: DossierNotaire[] = [
  {
    id: "dos-1", unite_id: "unite-BC-3-2", reservation_id: "res-3", client_id: "cli-3",
    notaire_id: "not-1", statut: "EN_ATTENTE_SIGNATURE",
    date_envoi: "2024-04-15", date_signature_prevue: "2024-05-15",
    frais_notaire: 18000, droits_enregistrement: 72000, conservation_fonciere: 27000,
    mode_paiement: "Virement", created_at: "2024-04-15T09:00:00Z", updated_at: "2024-04-15T09:00:00Z",
    client: mockClients[2], notaire: mockNotaires[0],
    documents: [
      { id: "doc-1", dossier_id: "dos-1", label: "Copie CIN client", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-2", dossier_id: "dos-1", label: "Compromis de vente signé", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-3", dossier_id: "dos-1", label: "Bon de réservation", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-4", dossier_id: "dos-1", label: "Reçu(s) d'avance", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-5", dossier_id: "dos-1", label: "Plan de l'unité", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-6", dossier_id: "dos-1", label: "Certificat de propriété / Titre foncier", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-7", dossier_id: "dos-1", label: "Permis d'habiter", obligatoire: true, fourni: false, created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-8", dossier_id: "dos-1", label: "Cahier des charges", obligatoire: true, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-9", dossier_id: "dos-1", label: "Copie CIN conjoint(e)", obligatoire: false, fourni: true, date_fourni: "2024-04-15", created_at: "2024-04-15T09:00:00Z" },
      { id: "doc-10", dossier_id: "dos-1", label: "Attestation bancaire / Accord crédit", obligatoire: false, fourni: false, created_at: "2024-04-15T09:00:00Z" },
    ],
  },
  {
    id: "dos-2", unite_id: "unite-VA-1-3", reservation_id: "res-4", client_id: "cli-4",
    notaire_id: "not-2", statut: "SIGNE",
    date_envoi: "2024-02-01", date_signature_prevue: "2024-03-01", date_signature_effective: "2024-03-18",
    frais_notaire: 30000, droits_enregistrement: 120000, conservation_fonciere: 45000,
    mode_paiement: "Virement", created_at: "2024-02-01T09:00:00Z", updated_at: "2024-03-18T14:00:00Z",
    client: mockClients[3], notaire: mockNotaires[1],
    documents: [],
  },
];

export const mockHistorique: HistoriqueUnite[] = [
  { id: "h-1", unite_id: "unite-AA-1-1", type: "CREATION", details: "Unité créée dans le système", created_at: "2024-01-15T09:00:00Z" },
  { id: "h-2", unite_id: "unite-AA-1-1", type: "OPTION", details: "Statut: DISPONIBLE → OPTION", agent: "Ahmed K.", client_nom: "Karim Benali", reservation_id: "res-1", created_at: "2024-03-10T11:00:00Z" },
  { id: "h-3", unite_id: "unite-AA-1-1", type: "RESERVATION", details: "Statut: OPTION → RESERVE — Avance: 150 000 MAD (Chèque)", agent: "Ahmed K.", client_nom: "Karim Benali", reservation_id: "res-1", created_at: "2024-03-15T10:00:00Z" },
];

export const mockDashboardKPIs: DashboardKPIs = {
  unites_vendues: 75,
  total_unites: 324,
  reservations_en_cours: 47,
  ca_realise: 132300000,
  ca_pipeline: 89100000,
  repartition_statuts: {
    DISPONIBLE: 182,
    OPTION: 18,
    RESERVE: 28,
    COMPROMIS: 17,
    NOTAIRE: 11,
    VENDU: 75,
    ANNULE: 4,
    DESISTE: 2,
  },
};
