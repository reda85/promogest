"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, TrendingDown, ArrowRight, ChevronRight, MessageSquare } from "lucide-react";
import {
  getExceptions, approveException, rejectException, cancelException,
  type ExceptionRequest,
} from "@/lib/exception-store";
import { fetchReservations, type EnrichedReservation } from "@/lib/supabase/db";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatMAD, formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";
import { getCurrentRole } from "@/lib/role-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Tab = "EN_ATTENTE" | "APPROUVE" | "REJETE" | "TOUTES";

type Enriched = ExceptionRequest & {
  client:  { prenom: string; nom: string; cin?: string } | null;
  unite:   { numero: string; type: string } | null;
  projet:  { nom: string; id: string } | null;
  resId:   string;
};

const STATUS_CFG = {
  EN_ATTENTE: { label: "En attente",  color: "#f59e0b", bg: "#fffbeb", icon: Clock        },
  APPROUVE:   { label: "Approuvée",   color: "#10b981", bg: "#ecfdf5", icon: CheckCircle2 },
  REJETE:     { label: "Rejetée",     color: "#ef4444", bg: "#fef2f2", icon: XCircle      },
} as const;

const TYPE_LABELS = {
  PRIX:   { label: "Réduction prix",   color: "#8b5cf6", bg: "#f5f3ff" },
  AVANCE: { label: "Réduction avance", color: "#3b82f6", bg: "#eff6ff" },
} as const;

function buildEnriched(exceptions: ExceptionRequest[], reservations: EnrichedReservation[]): Enriched[] {
  return exceptions.map((exc) => {
    const res = reservations.find((r) => r.id === exc.reservation_id);
    const client = res?.client
      ? { prenom: res.client.prenom, nom: res.client.nom, cin: res.client.cin }
      : null;
    const unite = res?.unite
      ? { numero: res.unite.numero, type: res.unite.type }
      : null;
    const projet = res?.unite?.immeuble?.gh?.projet
      ? { nom: res.unite.immeuble.gh.projet.nom, id: res.unite.immeuble.gh.projet.id }
      : null;
    return { ...exc, client, unite, projet, resId: exc.reservation_id };
  });
}

export default function ExceptionsPage() {
  const [role] = useState(getCurrentRole);
  const isAdmin = role === "ADMIN";

  const [exceptions, setExceptions] = useState<ExceptionRequest[]>([]);
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("EN_ATTENTE");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [excs, ress] = await Promise.all([
      getExceptions().catch(() => [] as ExceptionRequest[]),
      fetchReservations().catch(() => [] as EnrichedReservation[]),
    ]);
    setExceptions(excs);
    setReservations(ress);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const refresh = useCallback(() => {
    getExceptions().then(setExceptions).catch(() => setExceptions([]));
  }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    await approveException(approveTarget, approveComment.trim() || undefined);
    setApproveTarget(null);
    setApproveComment("");
    refresh();
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    await rejectException(rejectTarget, rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
    refresh();
  };

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    await cancelException(withdrawTarget);
    setWithdrawTarget(null);
    refresh();
  };

  if (loading) return <LoadingSpinner label="Chargement des demandes d'exception…" />;

  const all = buildEnriched(exceptions, reservations);
  // Un non-admin ne voit que ses propres demandes
  const enriched = isAdmin ? all : all.filter((e) => e.requested_by_role === role);
  const pending  = enriched.filter((e) => e.status === "EN_ATTENTE");
  const approved = enriched.filter((e) => e.status === "APPROUVE");
  const rejected = enriched.filter((e) => e.status === "REJETE");

  const filtered = tab === "TOUTES" ? enriched
    : tab === "EN_ATTENTE" ? pending
    : tab === "APPROUVE"   ? approved
    : rejected;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? "Demandes d'exception" : "Mes demandes d'exception"}
          </h1>
          <p className="text-sm text-[#888888] mt-0.5">
            {isAdmin
              ? "Réductions de prix ou d'avance soumises par l'équipe commerciale."
              : "Suivi de vos demandes de réduction de prix ou d'avance."}
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {([
          ["EN_ATTENTE", pending.length],
          ["APPROUVE",   approved.length],
          ["REJETE",     rejected.length],
        ] as const).map(([status, count]) => {
          const cfg = STATUS_CFG[status];
          return (
            <div key={status} className="rounded-2xl border border-[#e8e6e1] bg-white p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-xs text-[#888888] mt-0.5">{cfg.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-stone-100 p-1 w-fit">
        {([
          ["EN_ATTENTE", "En attente",  pending.length],
          ["APPROUVE",   "Approuvées",  approved.length],
          ["REJETE",     "Rejetées",    rejected.length],
          ["TOUTES",     "Toutes",      enriched.length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === key ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#888888] hover:text-[#1a1a1a]"
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === key ? "bg-stone-100" : "bg-stone-200"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingDown className="h-10 w-10 text-stone-200 mb-3" />
          <p className="text-sm text-[#aaaaaa]">
            {isAdmin
              ? "Aucune demande dans cette catégorie"
              : tab === "TOUTES"
              ? "Vous n'avez soumis aucune demande d'exception"
              : "Aucune demande dans cette catégorie"}
          </p>
          {!isAdmin && tab === "TOUTES" && (
            <p className="text-xs text-[#aaaaaa] mt-1">
              Ouvrez une réservation puis « Réduire le prix / l'avance » pour en créer une.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((exc) => {
            const sCfg = STATUS_CFG[exc.status];
            const tCfg = TYPE_LABELS[exc.type];
            const reduction = exc.current_value > 0
              ? Math.round((1 - exc.requested_value / exc.current_value) * 100)
              : 0;
            const roleCfg = ROLE_LABELS[exc.requested_by_role as keyof typeof ROLE_LABELS] ?? null;
            const isMinePending = !isAdmin && exc.status === "EN_ATTENTE" && exc.requested_by_role === role;

            return (
              <div
                key={exc.id}
                className={`rounded-2xl border-2 bg-white p-5 transition-all ${
                  exc.status === "EN_ATTENTE" ? "border-amber-200" : "border-[#e8e6e1]"
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: sCfg.bg, color: sCfg.color }}
                    >
                      <sCfg.icon className="h-3 w-3" />
                      {sCfg.label}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: tCfg.bg, color: tCfg.color }}
                    >
                      {tCfg.label}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600">
                      -{reduction}%
                    </span>
                  </div>
                  <span className="text-[11px] text-[#aaaaaa] flex-shrink-0">
                    {formatDate(exc.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Left: client + reservation */}
                  <div className="space-y-2">
                    {exc.client && (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#c9773f] to-[#9c5a2e] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {exc.client.prenom[0]}{exc.client.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1a1a]">
                            {exc.client.prenom} {exc.client.nom}
                          </p>
                          <p className="text-[10px] font-mono text-[#888888]">{exc.client.cin}</p>
                        </div>
                      </div>
                    )}
                    {exc.unite && (
                      <Link
                        href={`/reservations/${exc.resId}`}
                        className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#c9773f] transition-colors"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {exc.projet?.nom} · Unité {exc.unite.numero} · {exc.unite.type}
                      </Link>
                    )}
                  </div>

                  {/* Right: values */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-stone-50 px-3 py-2 flex-1 text-center">
                        <p className="text-[10px] text-[#888888] mb-0.5">Valeur actuelle</p>
                        <p className="text-sm font-bold text-[#1a1a1a]">{formatMAD(exc.current_value)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#cccccc] flex-shrink-0" />
                      <div className="rounded-lg px-3 py-2 flex-1 text-center"
                        style={{ backgroundColor: tCfg.bg }}>
                        <p className="text-[10px] mb-0.5" style={{ color: tCfg.color }}>Demandée</p>
                        <p className="text-sm font-bold" style={{ color: tCfg.color }}>
                          {formatMAD(exc.requested_value)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-stone-50 p-2.5">
                      <p className="text-[10px] text-[#888888] mb-0.5 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Justification
                      </p>
                      <p className="text-xs text-[#1a1a1a] italic">&ldquo;{exc.justification}&rdquo;</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e8e6e1]">
                  <div className="flex items-center gap-2 text-[11px] text-[#888888]">
                    <span>Demandé par</span>
                    {roleCfg && (
                      <span
                        className="rounded-full px-2 py-0.5 font-semibold"
                        style={{ backgroundColor: roleCfg.bg, color: roleCfg.color }}
                      >
                        {exc.requested_by_name}
                      </span>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && exc.status === "EN_ATTENTE" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setApproveTarget(exc.id); setApproveComment(""); }}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => { setRejectTarget(exc.id); setRejectReason(""); }}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                      >
                        ✕ Rejeter
                      </button>
                    </div>
                  )}

                  {/* Requester action: withdraw own pending */}
                  {isMinePending && (
                    <button
                      onClick={() => setWithdrawTarget(exc.id)}
                      className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-[#888888] hover:bg-stone-100 transition-colors"
                    >
                      Retirer la demande
                    </button>
                  )}

                  {/* Resolved: admin comment */}
                  {exc.status !== "EN_ATTENTE" && exc.admin_comment && (
                    <div className="text-[11px] text-[#888888] italic max-w-xs text-right">
                      &ldquo;{exc.admin_comment}&rdquo;
                      {exc.resolved_at && (
                        <span className="ml-1 text-[10px]">· {formatDate(exc.resolved_at)}</span>
                      )}
                    </div>
                  )}
                  {exc.status === "EN_ATTENTE" && !isAdmin && !isMinePending && (
                    <span className="text-[11px] text-[#aaaaaa] italic">En attente de validation admin</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve dialog */}
      <Dialog open={approveTarget !== null} onOpenChange={(o) => { if (!o) setApproveTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approuver la demande</DialogTitle>
            <DialogDescription>
              Vous pouvez ajouter un commentaire optionnel visible par le demandeur.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            placeholder="Commentaire (optionnel)..."
            className="min-h-[80px] mt-2"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setApproveTarget(null)}>Annuler</Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              ✓ Confirmer l&apos;approbation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectTarget !== null} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Indiquez la raison du rejet — elle sera visible par le demandeur.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motif du rejet (obligatoire)..."
            className="min-h-[80px] mt-2"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Annuler</Button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ✕ Rejeter la demande
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw dialog */}
      <Dialog open={withdrawTarget !== null} onOpenChange={(o) => { if (!o) setWithdrawTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Retirer la demande</DialogTitle>
            <DialogDescription>
              La demande sera supprimée définitivement. Vous pourrez en soumettre une nouvelle depuis la réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setWithdrawTarget(null)}>Annuler</Button>
            <button
              onClick={handleWithdraw}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
            >
              Retirer la demande
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
