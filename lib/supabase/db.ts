/**
 * lib/supabase/db.ts
 * Single source of truth for all Supabase queries + mutations.
 * Uses the browser client (works in "use client" components).
 */
import { createClient as createSupabaseClient } from "./client";
import type {
  Projet, GH, Immeuble, Unite, Client, Reservation,
  DossierNotaire, DocumentDossier, Notaire, HistoriqueUnite,
  StatutUnite, StatutNotaire,
  Tache, TypeTache, PrioriteTache,
  Paiement, TypePaiement,
} from "@/lib/types";

export function getDB() {
  return createSupabaseClient();
}

/** Get the org_id for the currently-authenticated user. */
export async function getOrgId(): Promise<string | null> {
  const db = getDB();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from("user_profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  return (data as { org_id: string } | null)?.org_id ?? null;
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

type RawUnite    = { id: string; statut: string; prix: number };
type RawImmeuble = { id: string; unites?: RawUnite[] };
type RawGH       = { id: string; immeubles?: RawImmeuble[] };

function enrichProjet(p: Record<string, unknown>): Projet {
  const ghs = (p.ghs as RawGH[]) ?? [];
  const allUnites = ghs.flatMap(g => (g.immeubles ?? []).flatMap(i => i.unites ?? []));
  const statuts_count: Record<string, number> = {};
  for (const u of allUnites) {
    statuts_count[u.statut] = (statuts_count[u.statut] || 0) + 1;
  }
  const { ghs: _ghs, ...rest } = p;
  void _ghs;
  return {
    ...rest,
    nb_ghs:       ghs.length,
    nb_immeubles: ghs.reduce((s, g) => s + (g.immeubles?.length || 0), 0),
    nb_unites:    allUnites.length,
    nb_vendues:   allUnites.filter(u => u.statut === "VENDU").length,
    ca_realise:   allUnites.filter(u => u.statut === "VENDU").reduce((s, u) => s + u.prix, 0),
    statuts_count: statuts_count as Record<StatutUnite, number>,
  } as Projet;
}

// ─── Projets ──────────────────────────────────────────────────────────────────

/** List of projects with computed counts (nb_ghs, nb_unites, ca_realise…). */
export async function fetchProjets(): Promise<Projet[]> {
  const { data, error } = await getDB()
    .from("projets")
    .select(`*, ghs:ghs(id, immeubles:immeubles(id, unites:unites(id, statut, prix)))`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(p => enrichProjet(p as Record<string, unknown>));
}

export type ProjetWithGHs = Projet & {
  ghs: (GH & { immeubles: (Immeuble & { unites: Unite[] })[] })[];
};

/** Single project + nested GHs → Immeubles → Unites (for the detail page). */
export async function fetchProjet(id: string): Promise<ProjetWithGHs | null> {
  const { data, error } = await getDB()
    .from("projets")
    .select(`*, ghs:ghs(*, immeubles:immeubles(*, unites:unites(*)))`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as ProjetWithGHs;
}

// ─── GHs ──────────────────────────────────────────────────────────────────────

export type GHWithImmeubles = GH & {
  projet: Projet | null;
  immeubles: (Immeuble & { unites: Unite[] })[];
};

export async function fetchGH(id: string): Promise<GHWithImmeubles | null> {
  const { data, error } = await getDB()
    .from("ghs")
    .select(`*, projet:projets(*), immeubles:immeubles(*, unites:unites(*))`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as GHWithImmeubles;
}

// ─── Immeubles ────────────────────────────────────────────────────────────────

export type ImmeubleWithUnites = Immeuble & {
  gh: (GH & { projet: Projet | null }) | null;
  unites: (Unite & {
    reservations: { id: string; client_id: string; statut: string; updated_at: string }[];
  })[];
};

export async function fetchImmeuble(id: string): Promise<ImmeubleWithUnites | null> {
  const { data, error } = await getDB()
    .from("immeubles")
    .select(`
      *,
      gh:ghs(*, projet:projets(*)),
      unites:unites(*, reservations:reservations(id, client_id, statut, updated_at))
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as ImmeubleWithUnites;
}

// ─── Unites ───────────────────────────────────────────────────────────────────

export type UniteDetail = Unite & {
  reservations: (Reservation & { client: Client | null })[];
  historique_unites: HistoriqueUnite[];
};

export async function fetchUnite(id: string): Promise<UniteDetail | null> {
  const { data, error } = await getDB()
    .from("unites")
    .select(`
      *,
      reservations:reservations(*, client:clients(*)),
      historique_unites:historique_unites(*)
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as UniteDetail;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export type ClientWithReservations = Client & {
  reservations: { id: string; statut: string; updated_at: string }[];
};

export async function fetchClients(): Promise<ClientWithReservations[]> {
  const { data, error } = await getDB()
    .from("clients")
    .select(`*, reservations:reservations(id, statut, updated_at)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClientWithReservations[];
}

export type ClientDetail = Client & {
  reservations: (Reservation & {
    unite: (Unite & { immeuble: (Immeuble & { projet: Projet | null }) | null }) | null;
  })[];
};

export async function fetchClient(id: string): Promise<ClientDetail | null> {
  const { data, error } = await getDB()
    .from("clients")
    .select(`
      *,
      reservations:reservations(
        *,
        unite:unites(*, immeuble:immeubles(*, projet:projets(*)))
      )
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as ClientDetail;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export type EnrichedReservation = Reservation & {
  client: Client | null;
  unite: (Unite & {
    immeuble: (Immeuble & {
      gh: (GH & { projet: Projet | null }) | null;
    }) | null;
  }) | null;
};

const RESERVATION_SELECT = `
  *,
  client:clients(*),
  unite:unites(*,
    immeuble:immeubles(*,
      gh:ghs(*,
        projet:projets(*)
      )
    )
  )
` as const;

export async function fetchReservations(): Promise<EnrichedReservation[]> {
  const { data, error } = await getDB()
    .from("reservations")
    .select(RESERVATION_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EnrichedReservation[];
}

export async function fetchReservation(id: string): Promise<EnrichedReservation | null> {
  const { data, error } = await getDB()
    .from("reservations")
    .select(RESERVATION_SELECT)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as EnrichedReservation;
}

// ─── Notaires ─────────────────────────────────────────────────────────────────

export async function fetchNotaires(): Promise<Notaire[]> {
  const { data, error } = await getDB()
    .from("notaires")
    .select("*")
    .order("nom");
  if (error) throw error;
  return (data ?? []) as unknown as Notaire[];
}

export async function createNotaire(payload: {
  nom: string;
  ville?: string;
  telephone?: string;
  email?: string;
}): Promise<Notaire> {
  const orgId = await getOrgId();
  if (!orgId) throw new Error("Utilisateur non authentifié.");
  const { data, error } = await getDB()
    .from("notaires")
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Notaire;
}

export async function updateNotaire(
  id: string,
  payload: { nom: string; ville?: string; telephone?: string; email?: string }
): Promise<Notaire> {
  const { data, error } = await getDB()
    .from("notaires")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Notaire;
}

// ─── Dossiers Notaire ─────────────────────────────────────────────────────────

export type EnrichedDossier = DossierNotaire & {
  client:   Client | null;
  notaire:  Notaire | null;
  unite: (Unite & {
    immeuble: (Immeuble & {
      gh: (GH & { projet: Projet | null }) | null;
    }) | null;
  }) | null;
  documents: DocumentDossier[];
};

const DOSSIER_SELECT = `
  *,
  client:clients(*),
  notaire:notaires(*),
  unite:unites(*,
    immeuble:immeubles(*,
      gh:ghs(*,
        projet:projets(*)
      )
    )
  ),
  documents:documents_dossier(*)
` as const;

export async function fetchDossiers(): Promise<EnrichedDossier[]> {
  const { data, error } = await getDB()
    .from("dossiers_notaire")
    .select(DOSSIER_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as EnrichedDossier[];
}

export async function fetchDossier(id: string): Promise<EnrichedDossier | null> {
  const { data, error } = await getDB()
    .from("dossiers_notaire")
    .select(DOSSIER_SELECT)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as EnrichedDossier;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProjet(payload: {
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
}): Promise<Projet> {
  const { data, error } = await getDB()
    .from("projets")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Projet;
}

export async function createImmeuble(payload: {
  gh_id: string;
  projet_id: string;
  nom: string;
  nb_etages: number;
}): Promise<Immeuble> {
  const { data, error } = await getDB()
    .from("immeubles")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Immeuble;
}

export async function updateImmeuble(
  id: string,
  payload: { nom: string; nb_etages: number }
): Promise<Immeuble> {
  const { data, error } = await getDB()
    .from("immeubles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Immeuble;
}

export async function createUnite(payload: {
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
}): Promise<Unite> {
  const { data, error } = await getDB()
    .from("unites")
    .insert({ statut: "DISPONIBLE" as StatutUnite, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data as Unite;
}

export async function updateUnite(
  id: string,
  payload: {
    numero?: string;
    reference?: string;
    type?: string;
    etage?: string;
    surface?: number;
    prix?: number;
    orientation?: string;
    facade?: string;
    nb_pieces?: number;
    terrasse_surface?: number;
  }
): Promise<Unite> {
  const { data, error } = await getDB()
    .from("unites")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Unite;
}

export async function createGH(payload: {
  projet_id: string;
  nom: string;
  description?: string;
}): Promise<GH> {
  const { data, error } = await getDB()
    .from("ghs")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as GH;
}

export async function updateGH(
  id: string,
  payload: { nom: string; description?: string }
): Promise<GH> {
  const { data, error } = await getDB()
    .from("ghs")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GH;
}

export async function createReservation(payload: {
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
}): Promise<Reservation> {
  const { data, error } = await getDB()
    .from("reservations")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  const reservation = data as unknown as Reservation;

  // Seed the initial payment ledger entry from the avance captured at booking
  // (best-effort — the reservation itself is already saved either way).
  if (payload.montant_avance && payload.montant_avance > 0) {
    try {
      await getDB().from("paiements").insert({
        reservation_id: reservation.id,
        type: "AVANCE" as TypePaiement,
        montant: payload.montant_avance,
        date_paiement: payload.date_reservation,
        mode_paiement: payload.mode_versement_avance || payload.mode_paiement,
        reference: payload.numero_cheque,
      });
    } catch {
      // ignore — the payment can be logged manually from the reservation page
    }
  }

  return reservation;
}

export async function updateUniteStatut(uniteId: string, statut: StatutUnite): Promise<void> {
  const { error } = await getDB().from("unites").update({ statut }).eq("id", uniteId);
  if (error) throw error;
}

export async function updateReservationStatut(reservationId: string, statut: StatutUnite): Promise<void> {
  const { error } = await getDB().from("reservations").update({ statut }).eq("id", reservationId);
  if (error) throw error;
}

export async function logHistorique(payload: {
  unite_id: string;
  type: string;
  details?: string;
  agent?: string;
  client_nom?: string;
  reservation_id?: string;
}): Promise<void> {
  await getDB().from("historique_unites").insert(payload);
}

export async function createClient(payload: Omit<Client, "id" | "created_at">): Promise<Client> {
  const { data, error } = await getDB()
    .from("clients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Client;
}

export async function createDossier(payload: {
  unite_id: string;
  reservation_id: string;
  client_id: string;
  notaire_id: string;
  statut: StatutNotaire;
  date_envoi?: string;
  date_signature_prevue?: string;
  frais_notaire?: number;
  droits_enregistrement?: number;
  conservation_fonciere?: number;
  mode_paiement?: string;
  notes?: string;
}): Promise<DossierNotaire> {
  const { data, error } = await getDB()
    .from("dossiers_notaire")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DossierNotaire;
}

export async function createDocuments(docs: {
  dossier_id: string;
  label: string;
  obligatoire: boolean;
  fourni: boolean;
}[]): Promise<void> {
  await getDB().from("documents_dossier").insert(docs);
}

export async function toggleDocument(docId: string, fourni: boolean): Promise<void> {
  await getDB()
    .from("documents_dossier")
    .update({ fourni, date_fourni: fourni ? new Date().toISOString().split("T")[0] : null })
    .eq("id", docId);
}

/** Fait avancer (ou reculer) le statut d'un dossier notaire. */
export async function updateDossierStatut(
  id: string,
  statut: StatutNotaire,
  extra?: { date_envoi?: string; date_signature_effective?: string }
): Promise<void> {
  const { error } = await getDB()
    .from("dossiers_notaire")
    .update({ statut, ...extra })
    .eq("id", id);
  if (error) throw error;
}

/** Met à jour les champs éditables d'un dossier (dates, frais, notaire, notes…). */
export async function updateDossier(
  id: string,
  payload: Partial<{
    notaire_id: string;
    date_envoi: string | null;
    date_signature_prevue: string | null;
    date_signature_effective: string | null;
    frais_notaire: number | null;
    droits_enregistrement: number | null;
    conservation_fonciere: number | null;
    mode_paiement: string | null;
    notes: string | null;
  }>
): Promise<void> {
  const { error } = await getDB().from("dossiers_notaire").update(payload).eq("id", id);
  if (error) throw error;
}

// ─── Taches / activités ───────────────────────────────────────────────────────

export type EnrichedTache = Tache & {
  client: Client | null;
  reservation: (Reservation & { unite: Unite | null }) | null;
  projet: Projet | null;
};

const TACHE_SELECT = `
  *,
  client:clients(*),
  reservation:reservations(*, unite:unites(*)),
  projet:projets(*)
` as const;

export type TacheLink = {
  client_id?: string;
  reservation_id?: string;
  projet_id?: string;
};

/** Toutes les tâches de l'organisation, les plus urgentes d'abord. */
export async function fetchTaches(): Promise<EnrichedTache[]> {
  const { data, error } = await getDB()
    .from("taches")
    .select(TACHE_SELECT)
    .order("terminee", { ascending: true })
    .order("echeance", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as EnrichedTache[];
}

/** Tâches rattachées à un client / une réservation / un projet donné. */
export async function fetchTachesFor(link: TacheLink): Promise<EnrichedTache[]> {
  let q = getDB().from("taches").select(TACHE_SELECT);
  if (link.client_id)      q = q.eq("client_id", link.client_id);
  if (link.reservation_id) q = q.eq("reservation_id", link.reservation_id);
  if (link.projet_id)      q = q.eq("projet_id", link.projet_id);
  const { data, error } = await q
    .order("terminee", { ascending: true })
    .order("echeance", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as EnrichedTache[];
}

/**
 * Version allégée : uniquement { reservation_id, echeance, terminee } des tâches
 * rattachées à une réservation — pour l'indicateur de suivi du pipeline.
 */
export async function fetchTachesSuivi(): Promise<
  { reservation_id: string; echeance: string; terminee: boolean }[]
> {
  const { data, error } = await getDB()
    .from("taches")
    .select("reservation_id, echeance, terminee")
    .not("reservation_id", "is", null);
  if (error) return [];
  return (data ?? []) as unknown as {
    reservation_id: string;
    echeance: string;
    terminee: boolean;
  }[];
}

/** Nombre de tâches en retard (badge sidebar). */
export async function getOverdueTachesCount(): Promise<number> {
  const { count, error } = await getDB()
    .from("taches")
    .select("*", { count: "exact", head: true })
    .eq("terminee", false)
    .lt("echeance", new Date().toISOString());
  if (error) return 0;
  return count ?? 0;
}

export async function createTache(payload: {
  titre: string;
  type: TypeTache;
  priorite: PrioriteTache;
  echeance: string;
  description?: string;
  agent?: string;
  client_id?: string | null;
  reservation_id?: string | null;
  projet_id?: string | null;
}): Promise<Tache> {
  const orgId = await getOrgId();
  if (!orgId) throw new Error("Utilisateur non authentifié.");
  const { data, error } = await getDB()
    .from("taches")
    .insert({ ...payload, org_id: orgId })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Tache;
}

export async function updateTache(
  id: string,
  payload: Partial<{
    titre: string;
    type: TypeTache;
    priorite: PrioriteTache;
    echeance: string;
    description: string;
    agent: string;
    client_id: string | null;
    reservation_id: string | null;
    projet_id: string | null;
  }>
): Promise<Tache> {
  const { data, error } = await getDB()
    .from("taches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Tache;
}

export async function toggleTache(id: string, terminee: boolean): Promise<void> {
  const { error } = await getDB()
    .from("taches")
    .update({ terminee, date_realisation: terminee ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTache(id: string): Promise<void> {
  const { error } = await getDB().from("taches").delete().eq("id", id);
  if (error) throw error;
}

// ─── Recherche globale ────────────────────────────────────────────────────────

export type SearchResultType = "client" | "projet" | "unite" | "tache" | "notaire";

export interface SearchResult {
  type:      SearchResultType;
  id:        string;
  label:     string;
  sublabel?: string;
  href:      string;
}

/**
 * Recherche transversale (barre du haut) : clients, projets, unités, tâches,
 * notaires. Chaque catégorie est limitée pour garder la réponse légère.
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const term = query.replace(/[,()*%]/g, " ").trim();
  if (term.length < 2) return [];
  const db = getDB();
  const w = `*${term}*`;

  const [clients, projets, unites, taches, notaires] = await Promise.all([
    db.from("clients")
      .select("id, prenom, nom, cin, ville")
      .or(`prenom.ilike.${w},nom.ilike.${w},cin.ilike.${w},telephone.ilike.${w},email.ilike.${w}`)
      .limit(6),
    db.from("projets")
      .select("id, nom, ville, quartier")
      .or(`nom.ilike.${w},ville.ilike.${w},quartier.ilike.${w}`)
      .limit(5),
    db.from("unites")
      .select("id, reference, numero, type, projet_id, gh_id, immeuble_id")
      .or(`reference.ilike.${w},numero.ilike.${w}`)
      .limit(6),
    db.from("taches")
      .select("id, titre, type, terminee")
      .ilike("titre", `%${term}%`)
      .limit(5),
    db.from("notaires")
      .select("id, nom, ville")
      .or(`nom.ilike.${w},ville.ilike.${w}`)
      .limit(4),
  ]);

  const out: SearchResult[] = [];

  for (const c of (clients.data ?? []) as Record<string, string>[]) {
    out.push({
      type: "client",
      id: c.id,
      label: `${c.prenom} ${c.nom}`,
      sublabel: [c.cin, c.ville].filter(Boolean).join(" · "),
      href: `/clients/${c.id}`,
    });
  }
  for (const p of (projets.data ?? []) as Record<string, string>[]) {
    out.push({
      type: "projet",
      id: p.id,
      label: p.nom,
      sublabel: [p.quartier, p.ville].filter(Boolean).join(", "),
      href: `/projets/${p.id}`,
    });
  }
  for (const u of (unites.data ?? []) as Record<string, string>[]) {
    out.push({
      type: "unite",
      id: u.id,
      label: `Unité ${u.numero}${u.reference ? ` — ${u.reference}` : ""}`,
      sublabel: u.type,
      href: `/projets/${u.projet_id}/${u.gh_id}/${u.immeuble_id}/${u.id}`,
    });
  }
  for (const t of (taches.data ?? []) as Record<string, unknown>[]) {
    out.push({
      type: "tache",
      id: t.id as string,
      label: t.titre as string,
      sublabel: t.terminee ? "Terminée" : "À faire",
      href: `/taches`,
    });
  }
  for (const n of (notaires.data ?? []) as Record<string, string>[]) {
    out.push({
      type: "notaire",
      id: n.id,
      label: n.nom,
      sublabel: n.ville,
      href: `/notaire/notaires`,
    });
  }

  return out;
}

// ─── Paiements ────────────────────────────────────────────────────────────────

/** Historique des paiements d'une réservation, du plus récent au plus ancien. */
export async function fetchPaiements(reservationId: string): Promise<Paiement[]> {
  const { data, error } = await getDB()
    .from("paiements")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("date_paiement", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as Paiement[];
}

/**
 * Version allégée : { reservation_id, montant } de tous les paiements —
 * pour calculer le total payé par réservation (gate de la transition VENDU).
 */
export async function fetchPaiementsTotals(): Promise<{ reservation_id: string; montant: number }[]> {
  const { data, error } = await getDB()
    .from("paiements")
    .select("reservation_id, montant");
  if (error) return [];
  return (data ?? []) as unknown as { reservation_id: string; montant: number }[];
}

export async function createPaiement(payload: {
  reservation_id: string;
  type: TypePaiement;
  montant: number;
  date_paiement: string;
  mode_paiement?: string;
  reference?: string;
  notes?: string;
}): Promise<Paiement> {
  const { data, error } = await getDB()
    .from("paiements")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Paiement;
}

export async function deletePaiement(id: string): Promise<void> {
  const { error } = await getDB().from("paiements").delete().eq("id", id);
  if (error) throw error;
}
