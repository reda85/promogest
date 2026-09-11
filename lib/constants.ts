// lib/constants.ts

export const STATUTS_UNITE = {
  DISPONIBLE: { label: "Disponible",     color: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  OPTION:     { label: "Option",         color: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  RESERVE:    { label: "Réservé",        color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  COMPROMIS:  { label: "Compromis",      color: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  NOTAIRE:    { label: "Chez Notaire",   color: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
  VENDU:      { label: "Vendu",          color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  ANNULE:     { label: "Annulé",         color: "#ef4444", bg: "#fef2f2", text: "#dc2626" },
  DESISTE:    { label: "Désisté",        color: "#6b7280", bg: "#f9fafb", text: "#374151" },
} as const;

export const STATUTS_NOTAIRE = {
  EN_PREPARATION:       { label: "En préparation",    color: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  ENVOYE:               { label: "Envoyé",            color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  EN_ATTENTE_SIGNATURE: { label: "Attente signature", color: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  SIGNE:                { label: "Signé",             color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
} as const;

export const TYPES_TACHE = {
  APPEL:    { label: "Appel",        color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  RDV:      { label: "Rendez-vous",  color: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  RELANCE:  { label: "Relance",      color: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  EMAIL:    { label: "E-mail",       color: "#06b6d4", bg: "#ecfeff", text: "#0e7490" },
  VISITE:   { label: "Visite",       color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  DOCUMENT: { label: "Document",     color: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
  AUTRE:    { label: "Autre",        color: "#6b7280", bg: "#f9fafb", text: "#374151" },
} as const;

export const PRIORITES_TACHE = {
  BASSE:   { label: "Basse",   color: "#6b7280", bg: "#f3f4f6" },
  NORMALE: { label: "Normale", color: "#3b82f6", bg: "#eff6ff" },
  HAUTE:   { label: "Haute",   color: "#ef4444", bg: "#fef2f2" },
} as const;

export const TYPES_PAIEMENT = {
  AVANCE:      { label: "Avance",       color: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  MENSUALITE:  { label: "Mensualité",   color: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  VERSEMENT:   { label: "Versement",    color: "#c8956c", bg: "#fdf6f0", text: "#a67c52" },
  SOLDE_FINAL: { label: "Solde final",  color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  AUTRE:       { label: "Autre",        color: "#6b7280", bg: "#f9fafb", text: "#374151" },
} as const;

export const TYPES_BIEN = ["F2", "F3", "F4", "Duplex", "Studio", "Local Commercial", "Parking", "Cave"];
export const VILLES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir", "Kénitra", "Mohammedia", "Meknès", "Oujda"];
export const ORIENTATIONS = ["Nord", "Sud", "Est", "Ouest", "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest"];
export const FACADES = ["Principale", "Latérale", "Arrière", "Double façade"];
export const SOURCES_CLIENT = ["Walk-in", "Facebook Ads", "Instagram", "Référence client", "Site web", "Salon immobilier", "Avito", "Appel entrant", "Partenaire"];
export const SITUATIONS_FAMILIALES = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"];
export const MODES_PAIEMENT = ["Comptant", "Crédit bancaire", "Mixte (Comptant + Crédit)", "Paiement échelonné"];
export const BANQUES = ["Attijariwafa Bank", "BMCE Bank of Africa", "Banque Populaire", "BMCI", "Société Générale Maroc", "CIH Bank", "Crédit du Maroc", "CFG Bank"];
export const MODES_VERSEMENT = ["Chèque", "Virement", "Espèces", "Effet"];

export const CHECKLIST_DOCUMENTS = [
  { label: "Copie CIN client",                         obligatoire: true },
  { label: "Copie CIN conjoint(e)",                    obligatoire: false },
  { label: "Acte de mariage",                          obligatoire: false },
  { label: "Compromis de vente signé",                 obligatoire: true },
  { label: "Bon de réservation",                       obligatoire: true },
  { label: "Reçu(s) d'avance",                         obligatoire: true },
  { label: "Plan de l'unité",                          obligatoire: true },
  { label: "Certificat de propriété / Titre foncier",  obligatoire: true },
  { label: "Permis d'habiter",                         obligatoire: true },
  { label: "Attestation bancaire / Accord crédit",     obligatoire: false },
  { label: "Bulletins de paie (3 derniers mois)",      obligatoire: false },
  { label: "Attestation de travail",                   obligatoire: false },
  { label: "Procuration (si applicable)",              obligatoire: false },
  { label: "Cahier des charges",                       obligatoire: true },
];

export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  DISPONIBLE: ["OPTION"],
  OPTION:     ["RESERVE", "ANNULE"],
  RESERVE:    ["COMPROMIS", "ANNULE", "DESISTE"],
  COMPROMIS:  ["NOTAIRE", "ANNULE", "DESISTE"],
  NOTAIRE:    ["VENDU", "ANNULE"],
  ANNULE:     ["DISPONIBLE"],
  DESISTE:    ["DISPONIBLE"],
  VENDU:      [],
};
