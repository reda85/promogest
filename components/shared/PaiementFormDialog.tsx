"use client";
import { useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPES_PAIEMENT, MODES_VERSEMENT } from "@/lib/constants";
import { createPaiement } from "@/lib/supabase/db";
import { type TypePaiement } from "@/lib/types";

const TYPE_KEYS = Object.keys(TYPES_PAIEMENT) as TypePaiement[];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  /** Pré-remplit le montant, ex. avec le reste à payer. */
  suggestedMontant?: number;
  onSaved: () => void;
}

export function PaiementFormDialog({
  open, onOpenChange, reservationId, suggestedMontant, onSaved,
}: Props) {
  const [type, setType] = useState<TypePaiement>("VERSEMENT");
  const [montant, setMontant] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType("VERSEMENT");
    setMontant(suggestedMontant && suggestedMontant > 0 ? String(suggestedMontant) : "");
    setDate(new Date().toISOString().split("T")[0]);
    setMode("");
    setReference("");
    setNotes("");
    setError(null);
  }, [open, suggestedMontant]);

  const parsedMontant = parseFloat(montant.replace(/\s/g, "").replace(",", "."));
  const canSubmit = !isNaN(parsedMontant) && parsedMontant > 0 && date.length > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await createPaiement({
        reservation_id: reservationId,
        type,
        montant: parsedMontant,
        date_paiement: date,
        mode_paiement: mode || undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Avance, mensualité, versement ou solde final reçu du client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1.5 block">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_KEYS.map((k) => {
                const cfg = TYPES_PAIEMENT[k];
                const active = type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className="rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition-all"
                    style={{
                      borderColor: active ? cfg.color : "#e8e6e1",
                      color: active ? cfg.color : "#888888",
                      backgroundColor: active ? cfg.bg : "#ffffff",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montant + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">
                Montant (MAD) <span className="text-red-400">*</span>
              </label>
              <Input
                autoFocus
                type="number"
                placeholder="150000"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">
                Date <span className="text-red-400">*</span>
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {/* Mode + référence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Mode de versement</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-[#e8e6e1] bg-white px-3 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c8956c]/30 focus:border-[#c8956c] transition-colors"
              >
                <option value="">— Choisir —</option>
                {MODES_VERSEMENT.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">N° chèque / réf.</label>
              <Input
                placeholder="Optionnel"
                className="font-mono"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1 block">Note (optionnel)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Précisions sur ce paiement…"
              className="min-h-[70px]"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
