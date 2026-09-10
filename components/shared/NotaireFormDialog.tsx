"use client";
import { useState, useEffect } from "react";
import { Scale } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { createNotaire, updateNotaire } from "@/lib/supabase/db";
import type { Notaire } from "@/lib/types";

interface NotaireFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an existing notaire to edit it; omit to create */
  notaire?: Notaire;
  onSuccess: (notaire: Notaire) => void;
}

export function NotaireFormDialog({
  open,
  onOpenChange,
  notaire,
  onSuccess,
}: NotaireFormDialogProps) {
  const isEdit = !!notaire;

  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNom(notaire?.nom ?? "");
      setVille(notaire?.ville ?? "");
      setTelephone(notaire?.telephone ?? "");
      setEmail(notaire?.email ?? "");
      setError(null);
    }
  }, [open, notaire]);

  const canSubmit = !!nom.trim() && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        nom: nom.trim(),
        ville: ville.trim() || undefined,
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
      };
      let result: Notaire;
      if (isEdit && notaire) {
        result = await updateNotaire(notaire.id, payload);
      } else {
        result = await createNotaire(payload);
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
              <Scale className="h-4.5 w-4.5 text-[#c8956c]" />
            </div>
            <DialogTitle>
              {isEdit ? "Modifier le notaire" : "Nouveau notaire"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations du notaire."
              : "Ajoutez un notaire à votre répertoire."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom" required>
            <Input
              placeholder="Maître Dupont…"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Ville">
            <Input
              placeholder="Casablanca, Rabat…"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
            />
          </FormField>

          <FormField label="Téléphone">
            <Input
              type="tel"
              placeholder="+212 6 00 00 00 00"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </FormField>

          <FormField label="Email">
            <Input
              type="email"
              placeholder="notaire@etude.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
