"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, CheckCircle, Circle, Scale, ArrowRight, ArrowLeft,
  Pencil, AlertTriangle, Sparkles,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  fetchDossier, fetchNotaires, updateDossierStatut, updateDossier, toggleDocument,
  type EnrichedDossier,
} from "@/lib/supabase/db";
import { STATUTS_NOTAIRE, MODES_PAIEMENT } from "@/lib/constants";
import { formatMAD, formatDate, getInitials, calcFraisNotaire } from "@/lib/utils";
import { type StatutNotaire, type Notaire, type DocumentDossier } from "@/lib/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const NOTAIRE_FLOW: StatutNotaire[] = ["EN_PREPARATION", "ENVOYE", "EN_ATTENTE_SIGNATURE", "SIGNE"];
const NEXT_LABEL: Record<StatutNotaire, string | null> = {
  EN_PREPARATION:       "Marquer comme envoyé",
  ENVOYE:               "En attente de signature",
  EN_ATTENTE_SIGNATURE: "Marquer comme signé",
  SIGNE:                null,
};

export default function DossierNotairePage() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const [dossier, setDossier] = useState<EnrichedDossier | null>(null);
  const [notaires, setNotaires] = useState<Notaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const reload = useCallback(async () => {
    const d = await fetchDossier(dossierId).catch(() => null);
    setDossier(d);
  }, [dossierId]);

  useEffect(() => {
    Promise.all([
      fetchDossier(dossierId).catch(() => null),
      fetchNotaires().catch(() => [] as Notaire[]),
    ]).then(([d, nots]) => {
      setDossier(d);
      setNotaires(nots);
    }).finally(() => setLoading(false));
  }, [dossierId]);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  if (loading) return <LoadingSpinner label="Chargement du dossier…" />;
  if (!dossier) return (
    <div className="text-center py-20 text-[#aaaaaa]">Dossier introuvable</div>
  );

  const cfg = STATUTS_NOTAIRE[dossier.statut];
  const documents = dossier.documents || [];
  const docsObligatoires = documents.filter((d) => d.obligatoire);
  const docsOptionnels = documents.filter((d) => !d.obligatoire);
  const docsFournis = documents.filter((d) => d.fourni).length;
  const docsTotal = documents.length;
  const obligatoiresManquants = docsObligatoires.filter((d) => !d.fourni).length;
  const totalFrais = (dossier.frais_notaire || 0) + (dossier.droits_enregistrement || 0) + (dossier.conservation_fonciere || 0);

  const idx = NOTAIRE_FLOW.indexOf(dossier.statut);
  const nextStatut = NOTAIRE_FLOW[idx + 1] ?? null;
  const prevStatut = idx > 0 ? NOTAIRE_FLOW[idx - 1] : null;

  const advance = async () => {
    if (!nextStatut || busy) return;
    setBusy(true);
    const today = new Date().toISOString().split("T")[0];
    const extra: { date_envoi?: string; date_signature_effective?: string } = {};
    if (nextStatut === "ENVOYE" && !dossier.date_envoi) extra.date_envoi = today;
    if (nextStatut === "SIGNE" && !dossier.date_signature_effective) extra.date_signature_effective = today;
    try {
      await updateDossierStatut(dossier.id, nextStatut, extra);
      await reload();
      showFlash(`Dossier : ${STATUTS_NOTAIRE[nextStatut].label}`);
    } catch {
      showFlash("Échec de la mise à jour du statut.");
    } finally {
      setBusy(false);
    }
  };

  const stepBack = async () => {
    if (!prevStatut || busy) return;
    setBusy(true);
    try {
      await updateDossierStatut(dossier.id, prevStatut);
      await reload();
      showFlash(`Retour à : ${STATUTS_NOTAIRE[prevStatut].label}`);
    } catch {
      showFlash("Échec de la mise à jour du statut.");
    } finally {
      setBusy(false);
    }
  };

  const toggleDoc = async (doc: DocumentDossier) => {
    const next = !doc.fourni;
    setDossier((d) => d ? {
      ...d,
      documents: d.documents.map((x) => x.id === doc.id
        ? { ...x, fourni: next, date_fourni: next ? new Date().toISOString().split("T")[0] : undefined }
        : x),
    } : d);
    try { await toggleDocument(doc.id, next); } catch { reload(); }
  };

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/notaire" className="hover:text-[#1a1a1a]">Gestion Notaire</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">
          {dossier.client ? `${dossier.client.prenom} ${dossier.client.nom}` : dossierId}
        </span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dossier notarié</h1>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Modifier
        </Button>
      </div>

      {flash && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {flash}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#888888] mb-3">Statut dossier</h3>
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{ backgroundColor: cfg.bg, color: cfg.text }}
            >
              <Scale className="h-5 w-5 mx-auto mb-1" style={{ color: cfg.color }} />
              <p className="font-bold">{cfg.label}</p>
            </div>

            <div className="mt-4 space-y-2">
              {NOTAIRE_FLOW.map((key) => {
                const val = STATUTS_NOTAIRE[key];
                const thisIdx = NOTAIRE_FLOW.indexOf(key);
                const isDone = thisIdx < idx;
                const isCurrent = thisIdx === idx;
                return (
                  <div key={key} className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle className="h-4 w-4 text-[#10b981]" />
                    ) : isCurrent ? (
                      <div className="h-4 w-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: val.color }} />
                    ) : (
                      <Circle className="h-4 w-4 text-stone-200" />
                    )}
                    <span
                      className={`text-sm ${isCurrent ? "font-semibold" : isDone ? "text-[#888888]" : "text-stone-300"}`}
                      style={isCurrent ? { color: val.color } : {}}
                    >
                      {val.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-[#e8e6e1] space-y-2">
              {nextStatut === "ENVOYE" && obligatoiresManquants > 0 && (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                  {obligatoiresManquants} document{obligatoiresManquants > 1 ? "s" : ""} obligatoire{obligatoiresManquants > 1 ? "s" : ""} manquant{obligatoiresManquants > 1 ? "s" : ""}.
                </p>
              )}
              {nextStatut ? (
                <button
                  onClick={advance}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {NEXT_LABEL[dossier.statut]}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <p className="text-center text-xs text-[#10b981] font-semibold py-1">
                  ✓ Acte signé — dossier clôturé
                </p>
              )}
              {prevStatut && (
                <button
                  onClick={stepBack}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium text-[#888888] hover:bg-stone-100 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Revenir à « {STATUTS_NOTAIRE[prevStatut].label} »
                </button>
              )}
            </div>
          </div>

          {dossier.notaire && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-3">Notaire</h3>
              <p className="font-bold text-[#1a1a1a]">{dossier.notaire.nom}</p>
              {dossier.notaire.ville && <p className="text-xs text-[#888888]">{dossier.notaire.ville}</p>}
              {dossier.notaire.telephone && <p className="text-xs text-[#888888] mt-1">{dossier.notaire.telephone}</p>}
              {dossier.notaire.email && <p className="text-xs text-[#888888]">{dossier.notaire.email}</p>}
            </div>
          )}

          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#888888]">Dates</h3>
            {[
              { label: "Date envoi", value: dossier.date_envoi },
              { label: "Signature prévue", value: dossier.date_signature_prevue },
              { label: "Signature effective", value: dossier.date_signature_effective },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-[#888888]">{item.label}</span>
                <span className="text-xs font-semibold text-[#1a1a1a]">
                  {item.value ? formatDate(item.value) : "—"}
                </span>
              </div>
            ))}
          </div>

          {dossier.client && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-3">Client</h3>
              <Link href={`/clients/${dossier.client.id}`} className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c9773f] to-[#9c5a2e] flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(dossier.client.prenom, dossier.client.nom)}
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] group-hover:text-[#c9773f] transition-colors">
                    {dossier.client.prenom} {dossier.client.nom}
                  </p>
                  <p className="text-xs font-mono text-[#888888]">{dossier.client.cin}</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-[#1a1a1a]">Dossier documentaire</h3>
              <span className="text-sm font-bold text-[#1a1a1a]">{docsFournis}/{docsTotal}</span>
            </div>
            <p className="text-xs text-[#aaaaaa] mb-3">Cliquez sur un document pour le marquer comme reçu.</p>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden mb-5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] transition-all"
                style={{ width: docsTotal ? `${Math.round((docsFournis / docsTotal) * 100)}%` : "0%" }}
              />
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#888888] mb-2">
                Documents obligatoires
              </p>
              <div className="space-y-2">
                {docsObligatoires.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc(doc)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                      doc.fourni ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"
                    }`}
                  >
                    {doc.fourni
                      ? <CheckCircle className="h-4 w-4 text-[#10b981] flex-shrink-0" />
                      : <Circle className="h-4 w-4 text-[#ef4444] flex-shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${doc.fourni ? "text-[#1a1a1a]" : "text-[#ef4444]"}`}>
                        {doc.label}
                      </p>
                      {doc.date_fourni && (
                        <p className="text-[10px] text-[#888888]">Reçu le {formatDate(doc.date_fourni)}</p>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold ${doc.fourni ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {doc.fourni ? "✓ Fourni" : "Manquant"}
                    </span>
                  </button>
                ))}
                {docsObligatoires.length === 0 && (
                  <p className="text-xs text-[#aaaaaa]">Aucun document obligatoire.</p>
                )}
              </div>
            </div>

            {docsOptionnels.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#888888] mb-2">
                  Documents optionnels
                </p>
                <div className="space-y-2">
                  {docsOptionnels.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => toggleDoc(doc)}
                      className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                        doc.fourni ? "bg-green-50 hover:bg-green-100" : "bg-stone-50 hover:bg-stone-100"
                      }`}
                    >
                      {doc.fourni
                        ? <CheckCircle className="h-4 w-4 text-[#10b981] flex-shrink-0" />
                        : <Circle className="h-4 w-4 text-[#aaaaaa] flex-shrink-0" />}
                      <p className={`text-sm flex-1 ${doc.fourni ? "text-[#1a1a1a]" : "text-[#888888]"}`}>{doc.label}</p>
                      {doc.fourni && <span className="text-[11px] font-semibold text-[#10b981]">✓ Fourni</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">Frais &amp; Taxes</h3>
            <div className="space-y-2">
              {[
                { label: "Honoraires notaire (1%)", value: dossier.frais_notaire },
                { label: "Droits d'enregistrement (4%)", value: dossier.droits_enregistrement },
                { label: "Conservation foncière (1.5%)", value: dossier.conservation_fonciere },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b border-[#e8e6e1] last:border-0"
                >
                  <span className="text-sm text-[#888888]">{item.label}</span>
                  <span className="text-sm font-semibold text-[#1a1a1a]">{formatMAD(item.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-[#1a1a1a]">Total frais (6.5%)</span>
                <span className="text-base font-bold text-[#c9773f]">{formatMAD(totalFrais)}</span>
              </div>
              {dossier.mode_paiement && (
                <p className="text-xs text-[#888888] pt-1">Mode de paiement : {dossier.mode_paiement}</p>
              )}
            </div>
          </div>

          {dossier.notes && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-2">Notes</h3>
              <p className="text-sm text-[#1a1a1a]">{dossier.notes}</p>
            </div>
          )}
        </div>
      </div>

      <DossierEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        dossier={dossier}
        notaires={notaires}
        onSaved={async () => { await reload(); showFlash("Dossier mis à jour."); }}
      />
    </div>
  );
}

// ── Edit dialog ────────────────────────────────────────────────────────────────

function DossierEditDialog({
  open, onOpenChange, dossier, notaires, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dossier: EnrichedDossier;
  notaires: Notaire[];
  onSaved: () => void | Promise<void>;
}) {
  const [notaireId, setNotaireId] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState("");
  const [dateSignaturePrevue, setDateSignaturePrevue] = useState("");
  const [dateSignatureEffective, setDateSignatureEffective] = useState("");
  const [fraisNotaire, setFraisNotaire] = useState("");
  const [droitsEnr, setDroitsEnr] = useState("");
  const [conservation, setConservation] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNotaireId(dossier.notaire_id ?? "");
    setDateEnvoi(dossier.date_envoi ?? "");
    setDateSignaturePrevue(dossier.date_signature_prevue ?? "");
    setDateSignatureEffective(dossier.date_signature_effective ?? "");
    setFraisNotaire(dossier.frais_notaire != null ? String(dossier.frais_notaire) : "");
    setDroitsEnr(dossier.droits_enregistrement != null ? String(dossier.droits_enregistrement) : "");
    setConservation(dossier.conservation_fonciere != null ? String(dossier.conservation_fonciere) : "");
    setModePaiement(dossier.mode_paiement ?? "");
    setNotes(dossier.notes ?? "");
  }, [open, dossier]);

  const prix = dossier.unite?.prix ?? 0;

  const autoCalc = () => {
    if (!prix) return;
    const c = calcFraisNotaire(prix);
    setFraisNotaire(String(c.frais_notaire));
    setDroitsEnr(String(c.droits_enregistrement));
    setConservation(String(c.conservation_fonciere));
  };

  const num = (s: string) => (s.trim() === "" ? null : parseFloat(s));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDossier(dossier.id, {
        notaire_id: notaireId || undefined,
        date_envoi: dateEnvoi || null,
        date_signature_prevue: dateSignaturePrevue || null,
        date_signature_effective: dateSignatureEffective || null,
        frais_notaire: num(fraisNotaire),
        droits_enregistrement: num(droitsEnr),
        conservation_fonciere: num(conservation),
        mode_paiement: modePaiement || null,
        notes: notes.trim() || null,
      });
      await onSaved();
      onOpenChange(false);
    } catch {
      // garde le dialogue ouvert
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le dossier</DialogTitle>
          <DialogDescription>Notaire, dates, frais notariaux et notes.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1 block">Notaire</label>
            <Select value={notaireId} onValueChange={setNotaireId}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {notaires.map((n) => <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Date envoi</label>
              <Input type="date" value={dateEnvoi} onChange={(e) => setDateEnvoi(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Signature prévue</label>
              <Input type="date" value={dateSignaturePrevue} onChange={(e) => setDateSignaturePrevue(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Signature effective</label>
              <Input type="date" value={dateSignatureEffective} onChange={(e) => setDateSignatureEffective(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#888888]">Frais notariaux (MAD)</label>
              {prix > 0 && (
                <button
                  type="button"
                  onClick={autoCalc}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#c9773f] hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  Calculer 6,5 % de {formatMAD(prix)}
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" placeholder="Honoraires" value={fraisNotaire} onChange={(e) => setFraisNotaire(e.target.value)} />
              <Input type="number" placeholder="Droits enr." value={droitsEnr} onChange={(e) => setDroitsEnr(e.target.value)} />
              <Input type="number" placeholder="Conserv. fonc." value={conservation} onChange={(e) => setConservation(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1 block">Mode de paiement des frais</label>
            <Select value={modePaiement} onValueChange={setModePaiement}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {MODES_PAIEMENT.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1 block">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[70px]" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
