"use client";
import { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { createGH, updateGH } from "@/lib/supabase/db";
import type { GH } from "@/lib/types";

interface GHFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a projetId to create a new GH */
  projetId?: string;
  /** Pass an existing GH to edit it */
  gh?: GH;
  onSuccess: (gh: GH) => void;
}

export function GHFormDialog({
  open,
  onOpenChange,
  projetId,
  gh,
  onSuccess,
}: GHFormDialogProps) {
  const isEdit = !!gh;

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (open) {
      setNom(gh?.nom ?? "");
      setDescription(gh?.description ?? "");
      setError(null);
    }
  }, [open, gh]);

  const canSubmit = !!nom.trim() && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      let result: GH;
      if (isEdit && gh) {
        result = await updateGH(gh.id, {
          nom: nom.trim(),
          description: description.trim() || undefined,
        });
      } else {
        if (!projetId) throw new Error("projetId requis");
        result = await createGH({
          projet_id: projetId,
          nom: nom.trim(),
          description: description.trim() || undefined,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-[#c9773f]/10 flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 text-[#c9773f]" />
            </div>
            <DialogTitle>
              {isEdit ? "Modifier le groupe d'habitation" : "Nouveau groupe d'habitation"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEdit
              ? "Modifiez le nom ou la description du groupe."
              : "Ajoutez un nouveau groupe d'habitation à ce projet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom" required>
            <Input
              placeholder="Tranche A, Bâtiment R+7…"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              placeholder="Description optionnelle…"
              className="min-h-[80px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
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
