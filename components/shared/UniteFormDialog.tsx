"use client";
import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createUnite, updateUnite } from "@/lib/supabase/db";
import { TYPES_BIEN, ORIENTATIONS, FACADES } from "@/lib/constants";
import type { Unite } from "@/lib/types";

interface UniteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** For creating a new unite */
  immeubleId?: string;
  ghId?: string;
  projetId?: string;
  /** For editing an existing unite */
  unite?: Unite;
  onSuccess: (unite: Unite) => void;
}

export function UniteFormDialog({
  open,
  onOpenChange,
  immeubleId,
  ghId,
  projetId,
  unite,
  onSuccess,
}: UniteFormDialogProps) {
  const isEdit = !!unite;

  const [numero, setNumero]     = useState("");
  const [reference, setReference] = useState("");
  const [type, setType]         = useState("");
  const [etage, setEtage]       = useState("");
  const [surface, setSurface]   = useState("");
  const [prix, setPrix]         = useState("");
  const [orientation, setOrientation] = useState("");
  const [facade, setFacade]     = useState("");
  const [nbPieces, setNbPieces] = useState("");
  const [terrasseSurface, setTerrasseSurface] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNumero(unite?.numero ?? "");
      setReference(unite?.reference ?? "");
      setType(unite?.type ?? "");
      setEtage(unite?.etage ?? "");
      setSurface(unite?.surface?.toString() ?? "");
      setPrix(unite?.prix?.toString() ?? "");
      setOrientation(unite?.orientation ?? "");
      setFacade(unite?.facade ?? "");
      setNbPieces(unite?.nb_pieces?.toString() ?? "");
      setTerrasseSurface(unite?.terrasse_surface?.toString() ?? "");
      setError(null);
    }
  }, [open, unite]);

  const canSubmit =
    !!numero.trim() && !!type && !!etage.trim() &&
    !!surface && !isNaN(Number(surface)) && Number(surface) > 0 &&
    !!prix && !isNaN(Number(prix)) && Number(prix) > 0 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const common = {
        numero:            numero.trim(),
        reference:         reference.trim() || numero.trim(),
        type,
        etage:             etage.trim(),
        surface:           Number(surface),
        prix:              Number(prix),
        orientation:       orientation || undefined,
        facade:            facade || undefined,
        nb_pieces:         nbPieces ? Number(nbPieces) : undefined,
        terrasse_surface:  terrasseSurface ? Number(terrasseSurface) : undefined,
      };

      let result: Unite;
      if (isEdit && unite) {
        result = await updateUnite(unite.id, common);
      } else {
        if (!immeubleId || !ghId || !projetId) throw new Error("IDs manquants");
        result = await createUnite({ immeuble_id: immeubleId, gh_id: ghId, projet_id: projetId, ...common });
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-[#c8956c]/10 flex items-center justify-center">
              <Home className="h-4.5 w-4.5 text-[#c8956c]" />
            </div>
            <DialogTitle>{isEdit ? "Modifier l'unité" : "Nouvelle unité"}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit ? "Modifiez les informations de l'unité." : "Ajoutez une unité à cet immeuble."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Numéro + Référence */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="N° unité" required>
              <Input
                placeholder="A101"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                autoFocus
              />
            </FormField>
            <FormField label="Référence">
              <Input
                placeholder="Auto-rempli si vide"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </FormField>
          </div>

          {/* Row 2: Type + Étage */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type" required>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {TYPES_BIEN.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Étage" required>
              <Input
                placeholder="RDC, 1er, 2ème…"
                value={etage}
                onChange={(e) => setEtage(e.target.value)}
              />
            </FormField>
          </div>

          {/* Row 3: Surface + Prix */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Surface (m²)" required>
              <Input
                type="number"
                min={1}
                step={0.01}
                placeholder="85"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
              />
            </FormField>
            <FormField label="Prix (MAD)" required>
              <Input
                type="number"
                min={1}
                placeholder="850000"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
              />
            </FormField>
          </div>

          {/* Row 4: Orientation + Façade */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Orientation">
              <Select value={orientation} onValueChange={setOrientation}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {ORIENTATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Façade">
              <Select value={facade} onValueChange={setFacade}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {FACADES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Row 5: Pièces + Terrasse */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nb pièces">
              <Input
                type="number"
                min={1}
                placeholder="3"
                value={nbPieces}
                onChange={(e) => setNbPieces(e.target.value)}
              />
            </FormField>
            <FormField label="Surface terrasse (m²)">
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="12"
                value={terrasseSurface}
                onChange={(e) => setTerrasseSurface(e.target.value)}
              />
            </FormField>
          </div>

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
