"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Wallet, CheckCircle2 } from "lucide-react";
import { fetchPaiements, deletePaiement } from "@/lib/supabase/db";
import { type Paiement } from "@/lib/types";
import { TYPES_PAIEMENT } from "@/lib/constants";
import { sumPaiements, resteAPayer as computeReste, estIntegralementPaye } from "@/lib/paiements";
import { formatMAD, formatDate } from "@/lib/utils";
import { PaiementFormDialog } from "@/components/shared/PaiementFormDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  reservationId: string;
  /** Prix dû effectif (après exception de prix approuvée, s'il y en a une). */
  prixDu: number;
  /** Notifié à chaque chargement / mutation, pour que la page parente puisse gater la vente. */
  onTotalChange?: (total: number) => void;
}

export function PaiementsPanel({ reservationId, prixDu, onTotalChange }: Props) {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Paiement | null>(null);

  const load = useCallback(() => {
    fetchPaiements(reservationId)
      .then((rows) => {
        setPaiements(rows);
        onTotalChange?.(sumPaiements(rows));
      })
      .catch(() => setPaiements([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (p: Paiement) => {
    setPaiements((prev) => {
      const next = prev.filter((x) => x.id !== p.id);
      onTotalChange?.(sumPaiements(next));
      return next;
    });
    setDeleteTarget(null);
    try { await deletePaiement(p.id); } catch { load(); }
  };

  const totalPaye = sumPaiements(paiements);
  const reste = computeReste(prixDu, totalPaye);
  const complet = estIntegralementPaye(prixDu, totalPaye);
  const pct = prixDu > 0 ? Math.min(100, Math.round((totalPaye / prixDu) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2">
          Paiements
          {complet && paiements.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Soldé
            </span>
          )}
        </h3>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1 text-sm text-[#c8956c] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-xl bg-stone-50 p-2.5 text-center">
          <p className="text-[10px] text-[#888888] mb-0.5">Prix dû</p>
          <p className="text-sm font-bold text-[#1a1a1a]">{formatMAD(prixDu)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5 text-center">
          <p className="text-[10px] text-emerald-700/70 mb-0.5">Total payé</p>
          <p className="text-sm font-bold text-emerald-700">{formatMAD(totalPaye)}</p>
        </div>
        <div className={`rounded-xl p-2.5 text-center ${complet ? "bg-stone-50" : "bg-amber-50"}`}>
          <p className={`text-[10px] mb-0.5 ${complet ? "text-[#888888]" : "text-amber-700/70"}`}>Reste à payer</p>
          <p className={`text-sm font-bold ${complet ? "text-[#1a1a1a]" : "text-amber-700"}`}>{formatMAD(reste)}</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${complet ? "bg-emerald-500" : "bg-gradient-to-r from-[#c8956c] to-[#a67c52]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[#aaaaaa] text-center py-6">Chargement…</p>
      ) : paiements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Wallet className="h-8 w-8 text-stone-200 mb-2" />
          <p className="text-sm text-[#aaaaaa]">Aucun paiement enregistré</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paiements.map((p) => {
            const cfg = TYPES_PAIEMENT[p.type];
            return (
              <div
                key={p.id}
                className="group flex items-center gap-3 rounded-xl border border-[#e8e6e1] p-3"
              >
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: cfg.bg, color: cfg.text }}
                >
                  {cfg.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1a1a1a]">{formatMAD(p.montant)}</p>
                  <p className="text-[11px] text-[#888888] truncate">
                    {formatDate(p.date_paiement)}
                    {p.mode_paiement && ` · ${p.mode_paiement}`}
                    {p.reference && ` · Réf. ${p.reference}`}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="flex-shrink-0 rounded-lg p-1 text-[#aaaaaa] opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <PaiementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reservationId={reservationId}
        suggestedMontant={reste}
        onSaved={load}
      />

      {/* Confirm delete */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce paiement ?</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  {formatMAD(deleteTarget.montant)} du {formatDate(deleteTarget.date_paiement)} sera retiré
                  définitivement du suivi de cette réservation.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#555] hover:bg-stone-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
