import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMAD(amount: number | undefined | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | undefined | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDatetime(date: string | undefined | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export function formatSurface(surface: number | undefined | null): string {
  if (surface == null) return "—";
  return `${surface} m²`;
}

export function calcFraisNotaire(prix: number) {
  return {
    frais_notaire: Math.round(prix * 0.01),
    droits_enregistrement: Math.round(prix * 0.04),
    conservation_fonciere: Math.round(prix * 0.015),
    total: Math.round(prix * 0.065),
  };
}

export function getPrixParM2(prix: number, surface: number): string {
  if (!surface) return "—";
  return formatMAD(Math.round(prix / surface)) + "/m²";
}
