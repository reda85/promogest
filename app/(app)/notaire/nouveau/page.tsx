"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MODES_PAIEMENT, CHECKLIST_DOCUMENTS } from "@/lib/constants";
import {
  fetchReservations, fetchNotaires, fetchDossiers, createDossier, createDocuments,
  type EnrichedReservation, type EnrichedDossier,
} from "@/lib/supabase/db";
import type { Notaire } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

export default function NouveauDossierNotairePage() {
  const router = useRouter();

  // Data
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [notaires, setNotaires] = useState<Notaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [reservationId, setReservationId] = useState("");
  const [notaireId, setNotaireId] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState("");
  const [dateSignaturePrevue, setDateSignaturePrevue] = useState("");
  const [fraisNotaire, setFraisNotaire] = useState("");
  const [droitsEnregistrement, setDroitsEnregistrement] = useState("");
  const [conservationFonciere, setConservationFonciere] = useState("");
  const [notes, setNotes] = useState("");
  const [docsCheck, setDocsCheck] = useState<boolean[]>(() => CHECKLIST_DOCUMENTS.map(() => false));

  useEffect(() => {
    Promise.all([
      fetchReservations().catch(() => [] as EnrichedReservation[]),
      fetchNotaires().catch(() => [] as Notaire[]),
      fetchDossiers().catch(() => [] as EnrichedDossier[]),
    ]).then(([ress, nots, dossiers]) => {
      const dejaEnvoyees = new Set(dossiers.map((d) => d.reservation_id));
      // Only COMPROMIS/NOTAIRE reservations without an existing dossier are eligible
      setReservations(
        ress.filter(
          (r) => (r.statut === "COMPROMIS" || r.statut === "NOTAIRE") && !dejaEnvoyees.has(r.id)
        )
      );
      setNotaires(nots);
    }).finally(() => setLoading(false));
  }, []);

  const selectedReservation = reservations.find((r) => r.id === reservationId) ?? null;

  const canSubmit = !!reservationId && !!notaireId && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedReservation) return;
    setSubmitting(true);
    try {
      const dossier = await createDossier({
        unite_id:              selectedReservation.unite_id,
        reservation_id:        reservationId,
        client_id:             selectedReservation.client_id,
        notaire_id:            notaireId,
        statut:                "EN_PREPARATION",
        date_envoi:            dateEnvoi || undefined,
        date_signature_prevue: dateSignaturePrevue || undefined,
        frais_notaire:         fraisNotaire ? parseFloat(fraisNotaire) : undefined,
        droits_enregistrement: droitsEnregistrement ? parseFloat(droitsEnregistrement) : undefined,
        conservation_fonciere: conservationFonciere ? parseFloat(conservationFonciere) : undefined,
        mode_paiement:         modePaiement || undefined,
        notes:                 notes || undefined,
      });
      // Create document checklist entries
      await createDocuments(
        CHECKLIST_DOCUMENTS.map((doc, i) => ({
          dossier_id:  dossier.id,
          label:       doc.label,
          obligatoire: doc.obligatoire,
          fourni:      docsCheck[i] || false,
        }))
      );
      router.push(`/notaire/${dossier.id}`);
    } catch {
      alert("Erreur lors de la création. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des données…" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Nouveau Dossier Notaire
        </h1>
        <p className="text-sm text-[#888888]">Créer un nouveau dossier d&apos;acte notarié</p>
      </div>

      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 space-y-6">
        <FormSection title="Dossier" icon={Scale}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Réservation" required className="col-span-2">
              <Select value={reservationId} onValueChange={setReservationId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une réservation..." /></SelectTrigger>
                <SelectContent>
                  {reservations.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.client ? `${r.client.prenom} ${r.client.nom}` : r.id} — {r.statut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reservations.length === 0 && (
                <p className="mt-1 text-xs text-[#aaaaaa]">
                  Aucune réservation éligible : il faut une réservation au statut « Compromis » ou
                  « Chez Notaire » sans dossier existant.
                </p>
              )}
            </FormField>
            <FormField label="Notaire" required>
              <Select value={notaireId} onValueChange={setNotaireId}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {notaires.map((n) => <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Mode paiement frais">
              <Select value={modePaiement} onValueChange={setModePaiement}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {MODES_PAIEMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Dates" icon={Calendar}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date d'envoi du dossier">
              <Input
                type="date"
                value={dateEnvoi}
                onChange={(e) => setDateEnvoi(e.target.value)}
              />
            </FormField>
            <FormField label="Date signature prévue">
              <Input
                type="date"
                value={dateSignaturePrevue}
                onChange={(e) => setDateSignaturePrevue(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Frais notariaux" icon={CreditCard}>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Honoraires notaire">
              <Input
                type="number"
                placeholder="0"
                value={fraisNotaire}
                onChange={(e) => setFraisNotaire(e.target.value)}
              />
            </FormField>
            <FormField label="Droits d'enregistrement">
              <Input
                type="number"
                placeholder="0"
                value={droitsEnregistrement}
                onChange={(e) => setDroitsEnregistrement(e.target.value)}
              />
            </FormField>
            <FormField label="Conservation foncière">
              <Input
                type="number"
                placeholder="0"
                value={conservationFonciere}
                onChange={(e) => setConservationFonciere(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Checklist documents" icon={Scale}>
          <div className="space-y-2">
            {CHECKLIST_DOCUMENTS.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#e8e6e1] p-3">
                <Checkbox
                  id={`doc-${i}`}
                  checked={docsCheck[i]}
                  onCheckedChange={(checked) => {
                    const updated = [...docsCheck];
                    updated[i] = checked === true;
                    setDocsCheck(updated);
                  }}
                />
                <label htmlFor={`doc-${i}`} className="flex-1 text-sm cursor-pointer">
                  {doc.label}
                  {doc.obligatoire && (
                    <span className="ml-2 text-[10px] font-semibold text-[#ef4444]">*obligatoire</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </FormSection>

        <FormField label="Notes">
          <Textarea
            placeholder="Remarques, informations complémentaires..."
            className="min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Création..." : "Créer le dossier"}
          </Button>
        </div>
      </div>
    </div>
  );
}
