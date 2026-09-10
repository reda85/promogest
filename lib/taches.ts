/**
 * lib/taches.ts
 * Helpers pour les tâches / activités : classement par échéance (style Pipedrive),
 * formatage des dates et icônes par type.
 */
import {
  Phone, CalendarClock, BellRing, Mail, MapPin, FileText, CircleHelp,
  type LucideIcon,
} from "lucide-react";
import type { TypeTache } from "@/lib/types";

export type TacheStatut = "EN_RETARD" | "AUJOURDHUI" | "A_VENIR" | "TERMINEE";

export const TACHE_STATUT_CFG: Record<TacheStatut, { label: string; color: string; bg: string }> = {
  EN_RETARD:  { label: "En retard",   color: "#ef4444", bg: "#fef2f2" },
  AUJOURDHUI: { label: "Aujourd'hui", color: "#f59e0b", bg: "#fffbeb" },
  A_VENIR:    { label: "À venir",     color: "#3b82f6", bg: "#eff6ff" },
  TERMINEE:   { label: "Terminée",    color: "#10b981", bg: "#ecfdf5" },
};

export const TACHE_TYPE_ICON: Record<TypeTache, LucideIcon> = {
  APPEL:    Phone,
  RDV:      CalendarClock,
  RELANCE:  BellRing,
  EMAIL:    Mail,
  VISITE:   MapPin,
  DOCUMENT: FileText,
  AUTRE:    CircleHelp,
};

/** Classe une tâche selon son échéance (une tâche terminée l'emporte toujours). */
export function tacheStatut(t: { echeance: string; terminee: boolean }): TacheStatut {
  if (t.terminee) return "TERMINEE";
  const due = new Date(t.echeance);
  const now = new Date();
  if (due.getTime() < now.getTime()) return "EN_RETARD";
  if (due.toDateString() === now.toDateString()) return "AUJOURDHUI";
  return "A_VENIR";
}

export type SuiviIndicateur = "EN_RETARD" | "A_JOUR" | "AUCUNE";

export const SUIVI_CFG: Record<SuiviIndicateur, { label: string; color: string; bg: string }> = {
  EN_RETARD: { label: "Tâche en retard",           color: "#ef4444", bg: "#fef2f2" },
  A_JOUR:    { label: "Suivi planifié",            color: "#10b981", bg: "#ecfdf5" },
  AUCUNE:    { label: "Aucune tâche planifiée",    color: "#f59e0b", bg: "#fffbeb" },
};

/**
 * Indicateur de suivi d'un deal (style Pipedrive) à partir de ses tâches :
 * rouge si une tâche non terminée est en retard, vert s'il existe une tâche
 * non terminée à venir, jaune s'il n'y a aucune tâche ouverte à planifier.
 */
export function suiviIndicateur(
  taches: { echeance: string; terminee: boolean }[]
): SuiviIndicateur {
  const ouvertes = taches.filter((t) => !t.terminee);
  if (ouvertes.length === 0) return "AUCUNE";
  const now = Date.now();
  if (ouvertes.some((t) => new Date(t.echeance).getTime() < now)) return "EN_RETARD";
  return "A_JOUR";
}

/** "12 sept. · 09:30" */
export function formatEcheance(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
  return `${date} · ${time}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO -> { date: "YYYY-MM-DD", time: "HH:MM" } pour les inputs du formulaire. */
export function splitEcheance(iso: string | undefined): { date: string; time: string } {
  const d = iso ? new Date(iso) : nextRoundHour();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** { date, time } des inputs -> ISO timestamptz. */
export function joinEcheance(date: string, time: string): string {
  return new Date(`${date}T${time || "09:00"}`).toISOString();
}

function nextRoundHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}
