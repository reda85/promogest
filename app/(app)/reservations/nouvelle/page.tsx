"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, CreditCard, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MODES_PAIEMENT, BANQUES, MODES_VERSEMENT } from "@/lib/constants";
import {
  fetchClients, fetchProjets, fetchProjet, createReservation,
  type ClientWithReservations, type ProjetWithGHs,
} from "@/lib/supabase/db";
import type { Projet, Unite } from "@/lib/types";

export default function NouvelleReservationPage() {
  const router = useRouter();

  // Data
  const [clients, setClients] = useState<ClientWithReservations[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [projetDetail, setProjetDetail] = useState<ProjetWithGHs | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [clientId, setClientId] = useState("");
  const [projetId, setProjetId] = useState("");
  const [uniteId, setUniteId] = useState("");
  const [dateReservation, setDateReservation] = useState(new Date().toISOString().split("T")[0]);
  const [modePaiement, setModePaiement] = useState("");
  const [montantAvance, setMontantAvance] = useState("");
  const [modeVersement, setModeVersement] = useState("");
  const [cheque, setCheque] = useState("");
  const [banque, setBanque] = useState("");
  const [mensualite, setMensualite] = useState("");
  const [nbMensualites, setNbMensualites] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      fetchClients().catch(() => [] as ClientWithReservations[]),
      fetchProjets().catch(() => [] as Projet[]),
    ]).then(([cls, prjs]) => {
      setClients(cls);
      setProjets(prjs);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projetId) { setProjetDetail(null); setUniteId(""); return; }
    fetchProjet(projetId).then(setProjetDetail).catch(() => setProjetDetail(null));
  }, [projetId]);

  const allUnites: Unite[] = projetDetail
    ? projetDetail.ghs.flatMap((gh) => gh.immeubles.flatMap((imm) => imm.unites))
    : [];
  const disponibles = allUnites.filter((u) => u.statut === "DISPONIBLE");

  const canSubmit = !!clientId && !!uniteId && !!dateReservation && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createReservation({
        client_id:            clientId,
        unite_id:             uniteId,
        statut:               "OPTION",
        date_reservation:     dateReservation,
        montant_avance:       montantAvance ? parseFloat(montantAvance) : undefined,
        mode_paiement:        modePaiement || undefined,
        banque:               banque || undefined,
        mode_versement_avance: modeVersement || undefined,
        numero_cheque:        cheque || undefined,
        montant_mensualite:   mensualite ? parseFloat(mensualite) : undefined,
        nb_mensualites:       nbMensualites ? parseInt(nbMensualites) : undefined,
        notes:                notes || undefined,
      });
      router.push("/reservations");
    } catch {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des données…" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Nouvelle Réservation
        </h1>
        <p className="text-sm text-[#888888]">Enregistrer une nouvelle réservation d&apos;unité</p>
      </div>

      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 space-y-6">
        <FormSection title="Client & Unité" icon={Home}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Client" required className="col-span-2">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.prenom} {c.nom} — {c.cin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Projet" required>
              <Select value={projetId} onValueChange={(v) => { setProjetId(v); setUniteId(""); }}>
                <SelectTrigger><SelectValue placeholder="Projet..." /></SelectTrigger>
                <SelectContent>
                  {projets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Unité disponible" required>
              <Select
                value={uniteId}
                onValueChange={setUniteId}
                disabled={!projetId || disponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !projetId
                        ? "Choisir un projet d'abord"
                        : disponibles.length === 0
                        ? "Aucune unité disponible"
                        : "Choisir..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {disponibles.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.numero} — {u.type} · {u.surface}m²
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Date de réservation" required>
              <Input
                type="date"
                value={dateReservation}
                onChange={(e) => setDateReservation(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Paiement" icon={CreditCard}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mode de paiement" required className="col-span-2">
              <Select value={modePaiement} onValueChange={setModePaiement}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {MODES_PAIEMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Montant avance (MAD)" required>
              <Input
                type="number"
                placeholder="150000"
                value={montantAvance}
                onChange={(e) => setMontantAvance(e.target.value)}
              />
            </FormField>
            <FormField label="Mode versement avance">
              <Select value={modeVersement} onValueChange={setModeVersement}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {MODES_VERSEMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="N° Chèque (si applicable)">
              <Input
                placeholder="1234567"
                className="font-mono"
                value={cheque}
                onChange={(e) => setCheque(e.target.value)}
              />
            </FormField>
            <FormField label="Banque (si crédit)">
              <Select value={banque} onValueChange={setBanque}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {BANQUES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Mensualité (si échelonné)">
              <Input
                type="number"
                placeholder="15000"
                value={mensualite}
                onChange={(e) => setMensualite(e.target.value)}
              />
            </FormField>
            <FormField label="Nb de mensualités">
              <Input
                type="number"
                placeholder="24"
                value={nbMensualites}
                onChange={(e) => setNbMensualites(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Notes" icon={FileText}>
          <FormField label="Notes internes">
            <Textarea
              placeholder="Remarques sur la réservation..."
              className="min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Enregistrement..." : "Enregistrer la réservation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
