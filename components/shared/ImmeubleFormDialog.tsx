"use client";
import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { createImmeuble, updateImmeuble } from "@/lib/supabase/db";
import type { Immeuble } from "@/lib/types";

interface ImmeubleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass ghId + projetId to create a new immeuble */
  ghId?: string;
  projetId?: string;
  /** Pass an existing immeuble to edit it */
  immeuble?: Immeuble;
  onSuccess: (immeuble: Immeuble) => void;
}

export function ImmeubleFormDialog({
  open,
  onOpenChange,
  ghId,
  projetId,
  immeuble,
  onSuccess,
}: ImmeubleFormDialogProps) {
  const isEdit = !!immeuble;

  const [nom, setNom] = useState("");
  const [nbEtages, setNbEtages] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNom(immeuble?.nom ?? "");
      setNbEtages(immeuble?.nb_etages?.toString() ?? "");
      setError(null);
    }
  }, [open, immeuble]);

  const canSubmit = !!nom.trim() && !!nbEtages && !isNaN(Number(nbEtages)) && Number(nbEtages) >= 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      let result: Immeuble;
      if (isEdit && immeuble) {
        result = await updateImmeuble(immeuble.id, {
          nom: nom.trim(),
          nb_etages: Number(nbEtages),
        });
      } else {
        if (!ghId || !projetId) throw new Error("ghId et projetId requis");
        result = await createImmeuble({
          gh_id: ghId,
          projet_id: projetId,
          nom: nom.trim(),
          nb_etages: Number(nbEtages),
        });
      }
      onSuccess(result);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-[#c8956c]/10 flex items-center justify-center">
              <Building2 className="h-4.5 w-4.5 text-[#c8956c]" />
            </div>
            <DialogTitle>
              {isEdit ? "Modifier l'immeuble" : "Nouvel immeuble"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEdit ? "Modifiez le nom ou le nombre d'étages." : "Ajoutez un immeuble à ce groupe d'habitation."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom" required>
            <Input
              placeholder="Bâtiment A, Résidence 1…"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Nombre d'étages" required>
            <Input
              type="number"
              min={0}
              placeholder="7"
              value={nbEtages}
              onChange={(e) => setNbEtages(e.target.value)}
            />
          </FormField>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              {submitting
                ? isEdit ? "Enregistrement…" : "Création…"
                : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
