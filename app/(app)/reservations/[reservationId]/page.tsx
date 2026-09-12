"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Home, CreditCard, Building2, Calendar, ArrowRight, CheckCircle,
  TrendingDown, Clock, CheckCircle2, XCircle, Send, AlertCircle, MessageSquare, Lock,
} from "lucide-react";
import {
  fetchReservation, updateUniteStatut, updateReservationStatut, logHistorique, type EnrichedReservation,
} from "@/lib/supabase/db";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { STATUTS_UNITE } from "@/lib/constants";
import { getWorkflow } from "@/lib/workflow-store";
import { StatutBadge } from "@/components/shared/StatutBadge";
import { TachesPanel } from "@/components/shared/TachesPanel";
import { PaiementsPanel } from "@/components/shared/PaiementsPanel";
import { resteAPayer as computeReste, estIntegralementPaye } from "@/lib/paiements";
import { formatMAD, formatDate, getInitials } from "@/lib/utils";
import { type StatutUnite } from "@/lib/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getCurrentRole } from "@/lib/role-store";
import { ROLE_LABELS } from "@/lib/roles";
import {
  getExceptionsForReservation, createException, approveException,
  rejectException, cancelException, type ExceptionRequest, type ExceptionType,
} from "@/lib/exception-store";

const EXC_TYPE_CFG = {
  PRIX:   { label: "Réduction prix de vente", color: "#8b5cf6", bg: "#f5f3ff" },
  AVANCE: { label: "Réduction avance demandée", color: "#3b82f6", bg: "#eff6ff" },
} as const;

const EXC_STATUS_CFG = {
  EN_ATTENTE: { label: "En attente",  color: "#f59e0b", bg: "#fffbeb", icon: Clock        },
  APPROUVE:   { label: "Approuvée",   color: "#10b981", bg: "#ecfdf5", icon: CheckCircle2 },
  REJETE:     { label: "Rejetée",     color: "#ef4444", bg: "#fef2f2", icon: XCircle      },
} as const;

export default function ReservationDetailPage() {
  const { reservationId } = useParams<{ reservationId: string }>();

  // ── Data loading ──────────────────────────────────────────────────────────
  const [reservation, setReservation] = useState<EnrichedReservation | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Role ──────────────────────────────────────────────────────────────────
  const [role]  = useState(getCurrentRole);
  const isAdmin = role === "ADMIN";
  const roleCfg = ROLE_LABELS[role];

  // ── Workflow ──────────────────────────────────────────────────────────────
  const [workflow] = useState(getWorkflow);
  const [currentStatut, setCurrentStatut] = useState<StatutUnite>("OPTION");
  const [pendingStatut, setPendingStatut] = useState<StatutUnite | null>(null);
  const [desistementType, setDesistementType] = useState<"REMBOURSE" | "PENALITE" | null>(null);
  const [justChanged, setJustChanged] = useState(false);

  // ── Paiements ─────────────────────────────────────────────────────────────
  const [totalPaye, setTotalPaye] = useState<number | null>(null);

  // ── Exception state ───────────────────────────────────────────────────────
  const [exceptions, setExceptions] = useState<ExceptionRequest[]>([]);
  // Submit dialog (non-admin)
  const [excType, setExcType] = useState<ExceptionType | null>(null);
  const [excValue, setExcValue] = useState("");
  const [excJustification, setExcJustification] = useState("");
  // Admin reject dialog
  const [rejectExcTarget, setRejectExcTarget] = useState<string | null>(null);
  const [rejectExcReason, setRejectExcReason] = useState("");
  // Admin approve comment dialog
  const [approveExcTarget, setApproveExcTarget] = useState<string | null>(null);
  const [approveExcComment, setApproveExcComment] = useState("");

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetchReservation(reservationId).catch(() => null),
      getExceptionsForReservation(reservationId).catch(() => [] as ExceptionRequest[]),
    ]).then(([res, excs]) => {
      setReservation(res);
      if (res) setCurrentStatut(res.statut);
      setExceptions(excs);
    }).finally(() => setLoading(false));
  }, [reservationId]);

  const refreshExceptions = useCallback(async () => {
    const excs = await getExceptionsForReservation(reservationId).catch(() => [] as ExceptionRequest[]);
    setExceptions(excs);
  }, [reservationId]);

  // ── Early returns (all hooks must be above these) ─────────────────────────
  if (loading) return <LoadingSpinner label="Chargement de la réservation…" />;
  if (!reservation) return (
    <div className="text-center py-20 text-[#aaaaaa]">Réservation introuvable</div>
  );

  // ── Derived from loaded data ───────────────────────────────────────────────
  const client  = reservation.client;
  const unite   = reservation.unite;
  const immeuble = unite?.immeuble ?? null;
  const gh       = immeuble?.gh ?? null;
  const projet   = gh?.projet ?? null;

  // ── Effective values (approved exception overrides) ───────────────────────
  const approvedPrixExc   = exceptions.find((e) => e.type === "PRIX"   && e.status === "APPROUVE");
  const approvedAvanceExc = exceptions.find((e) => e.type === "AVANCE" && e.status === "APPROUVE");
  const effectivePrix   = approvedPrixExc   ? approvedPrixExc.requested_value   : (unite?.prix ?? 0);
  const effectiveAvance = approvedAvanceExc ? approvedAvanceExc.requested_value : (reservation.montant_avance ?? 0);

  // ── Paiements (ledger) ─────────────────────────────────────────────────────
  // totalPaye est null tant que le panneau des paiements n'a pas encore chargé.
  const paiementsLoaded = totalPaye !== null;
  const totalPayeEffectif = totalPaye ?? 0;
  const resteAPayerVal = computeReste(effectivePrix, totalPayeEffectif);
  const soldeComplet = estIntegralementPaye(effectivePrix, totalPayeEffectif);
  const blockVenteIncomplete = paiementsLoaded && !soldeComplet;
  // Aucun paiement encore enregistré — condition confirmée (pas juste "pas encore su"),
  // pour éviter qu'un bouton apparaisse puis disparaisse une fois les paiements chargés.
  const hasNoPayments = totalPaye === 0;

  // ── Can-submit guards ─────────────────────────────────────────────────────
  // Une demande de réduction (prix ou avance) n'a de sens qu'avant le premier
  // paiement réel — au-delà, le client a déjà payé sur la base des conditions
  // en vigueur et toute renégociation doit passer par un autre circuit.
  const hasPendingPrix   = exceptions.some((e) => e.type === "PRIX"   && e.status === "EN_ATTENTE");
  const hasPendingAvance = exceptions.some((e) => e.type === "AVANCE" && e.status === "EN_ATTENTE");
  const canSubmitPrix    = !isAdmin && hasNoPayments && !hasPendingPrix   && !approvedPrixExc   && effectivePrix   > 0;
  const canSubmitAvance  = !isAdmin && hasNoPayments && !hasPendingAvance && !approvedAvanceExc && effectiveAvance > 0;

  // ── Workflow helpers ──────────────────────────────────────────────────────
  const nextStatuts  = (workflow[currentStatut] || []) as StatutUnite[];
  const currentCfg   = STATUTS_UNITE[currentStatut];
  const isDesiste    = pendingStatut === "DESISTE";
  const canConfirm   = (!isDesiste || desistementType !== null)
    && !(pendingStatut === "VENDU" && blockVenteIncomplete);

  const handleConfirmTransition = async () => {
    if (!pendingStatut || !canConfirm) return;
    try {
      await Promise.all([
        updateUniteStatut(reservation.unite_id, pendingStatut),
        updateReservationStatut(reservation.id, pendingStatut),
      ]);
      await logHistorique({
        unite_id:      reservation.unite_id,
        type:          pendingStatut,
        agent:         roleCfg.short,
        client_nom:    client ? `${client.prenom} ${client.nom}` : undefined,
        reservation_id: reservation.id,
        details: isDesiste && desistementType
          ? `Désistement ${desistementType === "REMBOURSE" ? "avec remboursement" : "avec pénalité"}`
          : undefined,
      });
    } catch {
      // Continue with optimistic UI update even if persistence fails
    }
    setCurrentStatut(pendingStatut);
    setPendingStatut(null);
    setJustChanged(true);
    setTimeout(() => { setJustChanged(false); setDesistementType(null); }, 2500);
  };
  const handleOpenDialog = (s: StatutUnite) => { setPendingStatut(s); setDesistementType(null); };

  // ── Exception submit ──────────────────────────────────────────────────────
  const currentExcValue = excType === "PRIX" ? effectivePrix : effectiveAvance;
  const parsedExcValue  = parseFloat(excValue.replace(/\s/g, "").replace(",", "."));
  const excReduction    = excType && currentExcValue > 0 && !isNaN(parsedExcValue) && parsedExcValue < currentExcValue
    ? Math.round((1 - parsedExcValue / currentExcValue) * 100)
    : null;
  const excValueValid   = !isNaN(parsedExcValue) && parsedExcValue > 0 && parsedExcValue < currentExcValue;

  const handleSubmitException = async () => {
    if (!excType || !excValueValid || !excJustification.trim()) return;
    await createException({
      reservation_id:    reservationId,
      type:              excType,
      current_value:     currentExcValue,
      requested_value:   parsedExcValue,
      justification:     excJustification.trim(),
      requested_by_role: role,
      requested_by_name: roleCfg.short,
    });
    setExcType(null);
    setExcValue("");
    setExcJustification("");
    await refreshExceptions();
  };

  const handleApproveException = async () => {
    if (!approveExcTarget) return;
    await approveException(approveExcTarget, approveExcComment.trim() || undefined);
    setApproveExcTarget(null);
    setApproveExcComment("");
    await refreshExceptions();
  };

  const handleRejectException = async () => {
    if (!rejectExcTarget || !rejectExcReason.trim()) return;
    await rejectException(rejectExcTarget, rejectExcReason.trim());
    setRejectExcTarget(null);
    setRejectExcReason("");
    await refreshExceptions();
  };

  return (
    <div className="space-y-5">
      {/* ── Workflow transition dialog ──────────────────────────────────── */}
      <Dialog open={pendingStatut !== null} onOpenChange={(open) => { if (!open) { setPendingStatut(null); setDesistementType(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer le changement de statut</DialogTitle>
            <DialogDescription>
              {isDesiste
                ? "Précisez le motif du désistement avant de confirmer."
                : "Cette action va mettre à jour le statut de la réservation."}
            </DialogDescription>
          </DialogHeader>
          {pendingStatut && (
            <div className="flex items-center justify-center gap-4 my-4">
              <div className="rounded-xl px-4 py-2.5 text-sm font-bold" style={{ backgroundColor: currentCfg.bg, color: currentCfg.text }}>
                {currentCfg.label}
              </div>
              <ArrowRight className="h-5 w-5 text-[#888888]" />
              <div className="rounded-xl px-4 py-2.5 text-sm font-bold" style={{ backgroundColor: STATUTS_UNITE[pendingStatut].bg, color: STATUTS_UNITE[pendingStatut].text }}>
                {STATUTS_UNITE[pendingStatut].label}
              </div>
            </div>
          )}
          {pendingStatut === "VENDU" && blockVenteIncomplete && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              Paiement incomplet — il reste {formatMAD(resteAPayerVal)} à régler avant de passer à Vendu.
            </div>
          )}
          {isDesiste && (
            <div className="space-y-2 mb-2">
              <p className="text-xs font-semibold text-[#888888]">Type de désistement :</p>
              {(["REMBOURSE", "PENALITE"] as const).map((dt) => (
                <button
                  key={dt}
                  onClick={() => setDesistementType(dt)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    desistementType === dt
                      ? dt === "REMBOURSE" ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"
                      : dt === "REMBOURSE" ? "border-[#e8e6e1] hover:border-emerald-200 hover:bg-emerald-50/50" : "border-[#e8e6e1] hover:border-red-200 hover:bg-red-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      desistementType === dt
                        ? dt === "REMBOURSE" ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                        : "border-[#d1d5db]"
                    }`}>
                      {desistementType === dt && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {dt === "REMBOURSE" ? "Désistement avec remboursement" : "Désistement avec pénalité"}
                      </p>
                      <p className="text-xs text-[#888888]">
                        {dt === "REMBOURSE"
                          ? "Le dossier est transféré à un autre client — avance remboursée, sans pénalité"
                          : "Le client perd ses frais de réservation — montant retenu selon conditions contractuelles"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="ghost" onClick={() => { setPendingStatut(null); setDesistementType(null); }}>Annuler</Button>
            <Button variant="primary" onClick={handleConfirmTransition} disabled={!canConfirm}>
              Confirmer le passage
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Exception submit dialog (non-admin) ────────────────────────── */}
      <Dialog open={excType !== null} onOpenChange={(o) => { if (!o) { setExcType(null); setExcValue(""); setExcJustification(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Demande d&apos;exception</DialogTitle>
            <DialogDescription>
              {excType && EXC_TYPE_CFG[excType].label} — soumise pour validation admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Current value readonly */}
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-[10px] text-[#888888] mb-0.5">Valeur actuelle</p>
              <p className="text-sm font-bold text-[#1a1a1a]">{formatMAD(currentExcValue)}</p>
            </div>
            {/* New value input */}
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Nouvelle valeur demandée (MAD)</label>
              <Input
                type="number"
                placeholder="Ex: 450000"
                value={excValue}
                onChange={(e) => setExcValue(e.target.value)}
                className="font-mono"
              />
              {excReduction !== null && excValueValid && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: excType ? EXC_TYPE_CFG[excType].color : "#888" }}>
                  Réduction de {excReduction}% · économie de {formatMAD(currentExcValue - parsedExcValue)}
                </p>
              )}
              {excValue && !excValueValid && (
                <p className="text-xs mt-1.5 text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> La valeur doit être inférieure à la valeur actuelle
                </p>
              )}
            </div>
            {/* Justification */}
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Justification <span className="text-red-400">*</span></label>
              <Textarea
                value={excJustification}
                onChange={(e) => setExcJustification(e.target.value)}
                placeholder="Expliquez la raison de cette demande d'exception..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => { setExcType(null); setExcValue(""); setExcJustification(""); }}>Annuler</Button>
            <Button
              variant="primary"
              disabled={!excValueValid || !excJustification.trim()}
              onClick={handleSubmitException}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Soumettre
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Admin approve exception dialog ──────────────────────────────── */}
      <Dialog open={approveExcTarget !== null} onOpenChange={(o) => { if (!o) setApproveExcTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approuver la demande</DialogTitle>
            <DialogDescription>Vous pouvez ajouter un commentaire optionnel visible par le demandeur.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={approveExcComment}
            onChange={(e) => setApproveExcComment(e.target.value)}
            placeholder="Commentaire (optionnel)..."
            className="min-h-[80px] mt-2"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setApproveExcTarget(null)}>Annuler</Button>
            <Button
              variant="primary"
              onClick={handleApproveException}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              ✓ Confirmer l&apos;approbation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Admin reject exception dialog ───────────────────────────────── */}
      <Dialog open={rejectExcTarget !== null} onOpenChange={(o) => { if (!o) setRejectExcTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>Indiquez la raison du rejet — elle sera visible par le demandeur.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectExcReason}
            onChange={(e) => setRejectExcReason(e.target.value)}
            placeholder="Motif du rejet (obligatoire)..."
            className="min-h-[80px] mt-2"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setRejectExcTarget(null)}>Annuler</Button>
            <button
              onClick={handleRejectException}
              disabled={!rejectExcReason.trim()}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ✕ Rejeter la demande
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/reservations" className="hover:text-[#1a1a1a]">Réservations</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">
          {client ? `${client.prenom} ${client.nom}` : reservationId}
        </span>
      </nav>

      {/* Success flash (workflow) */}
      {justChanged && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Statut mis à jour vers <strong>{currentCfg.label}</strong>
            {desistementType === "REMBOURSE" && " — désistement avec remboursement"}
            {desistementType === "PENALITE"  && " — désistement avec pénalité (frais retenus)"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Client */}
          {client && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-3">Client</h3>
              <Link href={`/clients/${client.id}`} className="flex items-center gap-3 group">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#c9773f] to-[#9c5a2e] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getInitials(client.prenom, client.nom)}
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a] group-hover:text-[#c9773f] transition-colors">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-xs font-mono text-[#888888]">{client.cin}</p>
                  <p className="text-xs text-[#888888]">{client.telephone}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Unite */}
          {unite && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-3">Unité</h3>
              <Link
                href={`/projets/${projet?.id}/${gh?.id}/${immeuble?.id}/${unite.id}`}
                className="space-y-2 group block"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#1a1a1a] group-hover:text-[#c9773f] transition-colors font-mono">
                    Unité {unite.numero}
                  </p>
                  <StatutBadge statut={unite.statut} />
                </div>
                {[
                  { icon: Building2, label: projet?.nom },
                  { icon: Home, label: `${unite.type} · ${unite.surface}m² · Étage ${unite.etage}` },
                ].map((item, i) => item.label && (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#888888]">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                ))}
              </Link>
              <div className="mt-3 pt-3 border-t border-[#e8e6e1]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1a1a1a]">{formatMAD(effectivePrix)}</p>
                  {approvedPrixExc && (
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700">
                      Prix réduit ✓
                    </span>
                  )}
                </div>
                {approvedPrixExc && (
                  <p className="text-[10px] text-[#aaaaaa] line-through mt-0.5">{formatMAD(unite.prix)}</p>
                )}
              </div>
            </div>
          )}

          {/* Status workflow */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#888888] mb-3">Statut & Workflow</h3>
            <div
              className="rounded-xl px-4 py-3 text-center mb-4 transition-all"
              style={{ backgroundColor: currentCfg.bg, color: currentCfg.text }}
            >
              <p className="text-xs font-medium mb-0.5 opacity-70">Statut actuel</p>
              <p className="font-bold text-base">{currentCfg.label}</p>
            </div>
            {nextStatuts.length > 0 ? (
              <div>
                <p className="text-xs text-[#aaaaaa] mb-2">Passer à :</p>
                <div className="flex flex-wrap gap-2">
                  {nextStatuts.map((s) => {
                    const cfg = STATUTS_UNITE[s];
                    const blocked = s === "VENDU" && blockVenteIncomplete;
                    return (
                      <button
                        key={s}
                        onClick={() => { if (!blocked) handleOpenDialog(s); }}
                        disabled={blocked}
                        title={blocked ? `Reste à payer : ${formatMAD(resteAPayerVal)}` : undefined}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold border-2 transition-all flex items-center gap-1 ${
                          blocked
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:opacity-90 hover:scale-105 active:scale-95"
                        }`}
                        style={{ borderColor: cfg.color, color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {blocked ? <Lock className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                {nextStatuts.includes("VENDU") && blockVenteIncomplete && (
                  <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                    Reste {formatMAD(resteAPayerVal)} à régler avant de passer à Vendu.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#aaaaaa] text-center py-2">
                Statut final — aucune transition possible
              </p>
            )}
          </div>

          {/* ── Exceptions section ────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#888888] mb-3 flex items-center justify-between">
              <span>Demandes d&apos;exception</span>
              {exceptions.filter((e) => e.status === "EN_ATTENTE").length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1.5">
                  {exceptions.filter((e) => e.status === "EN_ATTENTE").length}
                </span>
              )}
            </h3>

            {/* Existing exceptions */}
            {exceptions.length > 0 && (
              <div className="space-y-2 mb-3">
                {exceptions.map((exc) => {
                  const sCfg = EXC_STATUS_CFG[exc.status];
                  const tCfg = EXC_TYPE_CFG[exc.type];
                  const reduction = exc.current_value > 0
                    ? Math.round((1 - exc.requested_value / exc.current_value) * 100)
                    : 0;
                  return (
                    <div
                      key={exc.id}
                      className={`rounded-xl border p-3 ${exc.status === "EN_ATTENTE" ? "border-amber-200 bg-amber-50/30" : "border-[#e8e6e1] bg-stone-50"}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: sCfg.bg, color: sCfg.color }}
                        >
                          <sCfg.icon className="h-2.5 w-2.5" />
                          {sCfg.label}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: tCfg.bg, color: tCfg.color }}
                        >
                          {exc.type === "PRIX" ? "Prix" : "Avance"} -{reduction}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="text-[#888888]">{formatMAD(exc.current_value)}</span>
                        <ArrowRight className="h-3 w-3 text-[#cccccc]" />
                        <span className="font-semibold" style={{ color: tCfg.color }}>{formatMAD(exc.requested_value)}</span>
                      </div>
                      {exc.justification && (
                        <p className="text-[10px] text-[#888888] italic mb-2 flex items-start gap-1">
                          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {exc.justification}
                        </p>
                      )}
                      {exc.admin_comment && (
                        <p className="text-[10px] text-emerald-700 italic mb-2">&ldquo;{exc.admin_comment}&rdquo;</p>
                      )}
                      {/* Admin actions on pending */}
                      {isAdmin && exc.status === "EN_ATTENTE" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => { setApproveExcTarget(exc.id); setApproveExcComment(""); }}
                            className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            ✓ Approuver
                          </button>
                          <button
                            onClick={() => { setRejectExcTarget(exc.id); setRejectExcReason(""); }}
                            className="flex-1 rounded-lg border border-red-200 bg-red-50 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            ✕ Rejeter
                          </button>
                        </div>
                      )}
                      {/* Non-admin: cancel pending */}
                      {!isAdmin && exc.status === "EN_ATTENTE" && (
                        <button
                          onClick={async () => { await cancelException(exc.id); await refreshExceptions(); }}
                          className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 py-1 text-[11px] font-semibold text-[#888888] hover:bg-stone-100 transition-colors"
                        >
                          Annuler la demande
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Submit buttons (non-admin) */}
            {!isAdmin && (canSubmitPrix || canSubmitAvance) && (
              <div className="space-y-2">
                {canSubmitPrix && (
                  <button
                    onClick={() => { setExcType("PRIX"); setExcValue(""); setExcJustification(""); }}
                    className="w-full flex items-center gap-2 rounded-xl border-2 border-dashed border-[#8b5cf6]/30 bg-[#f5f3ff] px-3 py-2.5 text-xs font-semibold text-[#8b5cf6] hover:border-[#8b5cf6]/60 hover:bg-[#ede9fe] transition-all"
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Réduire le prix de vente
                  </button>
                )}
                {canSubmitAvance && (
                  <button
                    onClick={() => { setExcType("AVANCE"); setExcValue(""); setExcJustification(""); }}
                    className="w-full flex items-center gap-2 rounded-xl border-2 border-dashed border-[#3b82f6]/30 bg-[#eff6ff] px-3 py-2.5 text-xs font-semibold text-[#3b82f6] hover:border-[#3b82f6]/60 hover:bg-[#dbeafe] transition-all"
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Réduire l&apos;avance demandée
                  </button>
                )}
              </div>
            )}

            {!isAdmin && !canSubmitPrix && !canSubmitAvance && exceptions.length === 0 && (
              <p className="text-xs text-[#aaaaaa] text-center py-2">
                {paiementsLoaded && !hasNoPayments
                  ? "Un paiement a déjà été enregistré — les demandes de réduction ne sont plus possibles."
                  : "Aucune exception disponible"}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Financial details ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">Détails financiers</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Date réservation", value: formatDate(reservation.date_reservation), icon: Calendar },
                { label: "Mode paiement", value: reservation.mode_paiement || "—", icon: CreditCard },
                {
                  label: "Avance versée",
                  value: formatMAD(effectiveAvance),
                  icon: CreditCard,
                  highlight: true,
                  sub: approvedAvanceExc ? `(réduite de ${formatMAD(reservation.montant_avance ?? 0)})` : undefined,
                },
                { label: "Mode versement", value: reservation.mode_versement_avance || "—", icon: CreditCard },
                ...(reservation.banque ? [{ label: "Banque", value: reservation.banque, icon: Building2 }] : []),
                ...(reservation.numero_cheque ? [{ label: "N° chèque", value: reservation.numero_cheque, icon: CreditCard }] : []),
                ...(reservation.montant_mensualite ? [
                  { label: "Mensualité", value: formatMAD(reservation.montant_mensualite), icon: CreditCard },
                  { label: "Nb mensualités", value: String(reservation.nb_mensualites), icon: CreditCard },
                ] : []),
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 ${item.highlight ? "bg-[#c9773f]/10" : "bg-stone-50"}`}>
                  <p className="text-[10px] text-[#aaaaaa] mb-0.5">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.highlight ? "text-[#c9773f]" : "text-[#1a1a1a]"}`}>
                    {item.value}
                  </p>
                  {"sub" in item && item.sub && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">{item.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <PaiementsPanel
            reservationId={reservation.id}
            prixDu={effectivePrix}
            onTotalChange={setTotalPaye}
          />

          <TachesPanel
            context={{ reservation_id: reservation.id, client_id: reservation.client_id }}
            title="Tâches & activités"
          />

          {reservation.notes && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-2">Notes</h3>
              <p className="text-sm text-[#1a1a1a]">{reservation.notes}</p>
            </div>
          )}

          {/* Summary total */}
          {unite && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-base font-semibold text-[#1a1a1a] mb-4 flex items-center justify-between">
                Récapitulatif
                {(approvedPrixExc || approvedAvanceExc) && (
                  <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Exceptions approuvées
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#888888]">Prix de vente</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[#1a1a1a]">{formatMAD(effectivePrix)}</span>
                    {approvedPrixExc && (
                      <p className="text-[10px] text-[#aaaaaa] line-through">{formatMAD(unite.prix)}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#888888]">Avance versée</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[#1a1a1a]">{formatMAD(effectiveAvance)}</span>
                    {approvedAvanceExc && (
                      <p className="text-[10px] text-[#aaaaaa] line-through">{formatMAD(reservation.montant_avance ?? 0)}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#888888]">Total payé à ce jour</span>
                  <span className="text-sm font-medium text-[#1a1a1a]">{formatMAD(totalPayeEffectif)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#e8e6e1]">
                  <span className="text-sm font-bold text-[#1a1a1a]">Reste à payer</span>
                  <span className={`text-sm font-bold ${soldeComplet ? "text-emerald-600" : "text-[#c9773f]"}`}>
                    {formatMAD(resteAPayerVal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
