/**
 * lib/paiements.ts
 * Helpers pour le suivi des paiements d'une réservation.
 */

/** Somme des montants d'une liste de paiements. */
export function sumPaiements(paiements: { montant: number }[]): number {
  return paiements.reduce((s, p) => s + (p.montant || 0), 0);
}

/** Reste à payer, jamais négatif. */
export function resteAPayer(prixDu: number, totalPaye: number): number {
  return Math.max(0, prixDu - totalPaye);
}

/** Tolérance (arrondis) sous laquelle on considère le prix intégralement réglé. */
export const EPSILON_PAIEMENT = 0.5;

export function estIntegralementPaye(prixDu: number, totalPaye: number): boolean {
  return prixDu - totalPaye <= EPSILON_PAIEMENT;
}
