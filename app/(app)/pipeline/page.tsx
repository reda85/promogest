"use client";
import { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult, type DragStart } from "@hello-pangea/dnd";
import {
  fetchReservations, fetchTachesSuivi, fetchPaiementsTotals,
  updateUniteStatut, updateReservationStatut, type EnrichedReservation,
} from "@/lib/supabase/db";
import { getApprovedPrixExceptions } from "@/lib/exception-store";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TacheFormDialog } from "@/components/shared/TacheFormDialog";
import { STATUTS_UNITE } from "@/lib/constants";
import { getWorkflow, type WorkflowTransitions } from "@/lib/workflow-store";
import { suiviIndicateur, SUIVI_CFG, type SuiviIndicateur } from "@/lib/taches";
import { estIntegralementPaye, resteAPayer as computeReste } from "@/lib/paiements";
import { formatMAD, formatDate, getInitials } from "@/lib/utils";
import { type StatutUnite } from "@/lib/types";
import Link from "next/link";
import { GripVertical, Ban, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

const PIPELINE_COLUMNS: StatutUnite[] = ["OPTION", "RESERVE", "COMPROMIS", "NOTAIRE", "VENDU"];

export default function PipelinePage() {
  const [workflow] = useState<WorkflowTransitions>(getWorkflow);
  const [baseCards, setBaseCards] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statuts, setStatuts] = useState<Record<string, StatutUnite>>({});
  const [movedId, setMovedId] = useState<string | null>(null);
  const [rejectedCol, setRejectedCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [suivi, setSuivi] = useState<Record<string, SuiviIndicateur>>({});
  const [taskDialog, setTaskDialog] = useState<{ reservationId: string; clientId: string } | null>(null);
  const [paiementsTotals, setPaiementsTotals] = useState<Record<string, number>>({});
  const [prixExceptions, setPrixExceptions] = useState<Record<string, number>>({});
  const [rejectMsg, setRejectMsg] = useState("Transition non autorisée");

  useEffect(() => {
    fetchReservations()
      .then((data) => {
        setBaseCards(data);
        const init: Record<string, StatutUnite> = {};
        data.forEach((r) => { init[r.id] = r.statut as StatutUnite; });
        setStatuts(init);
      })
      .catch(() => setBaseCards([]))
      .finally(() => setLoading(false));
  }, []);

  const loadSuivi = useCallback(() => {
    fetchTachesSuivi()
      .then((rows) => {
        const groups: Record<string, { echeance: string; terminee: boolean }[]> = {};
        for (const r of rows) {
          if (!r.reservation_id) continue;
          (groups[r.reservation_id] ??= []).push({ echeance: r.echeance, terminee: r.terminee });
        }
        const map: Record<string, SuiviIndicateur> = {};
        for (const [id, ts] of Object.entries(groups)) map[id] = suiviIndicateur(ts);
        setSuivi(map);
      })
      .catch(() => setSuivi({}));
  }, []);

  useEffect(() => { loadSuivi(); }, [loadSuivi]);

  useEffect(() => {
    Promise.all([fetchPaiementsTotals(), getApprovedPrixExceptions()])
      .then(([rows, excs]) => {
        const totals: Record<string, number> = {};
        for (const r of rows) totals[r.reservation_id] = (totals[r.reservation_id] || 0) + r.montant;
        setPaiementsTotals(totals);
        const pe: Record<string, number> = {};
        for (const e of excs) pe[e.reservation_id] = e.requested_value;
        setPrixExceptions(pe);
      })
      .catch(() => { setPaiementsTotals({}); setPrixExceptions({}); });
  }, []);

  /** Prix dû (après exception de prix approuvée éventuelle) pour une réservation. */
  const prixDuFor = useCallback((card: EnrichedReservation) =>
    prixExceptions[card.id] ?? card.unite?.prix ?? 0,
  [prixExceptions]);

  const enriched = baseCards.map((r) => ({
    ...r,
    statut: statuts[r.id] ?? (r.statut as StatutUnite),
  }));

  const getColumn = (statut: StatutUnite) => enriched.filter((r) => r.statut === statut);
  const totalCA = enriched.reduce((sum, r) => sum + (r.unite?.prix || 0), 0);

  const handleDragStart = useCallback((start: DragStart) => {
    setDraggingId(start.draggableId);
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    setDraggingId(null);
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const fromStatut = source.droppableId as StatutUnite;
    const toStatut = destination.droppableId as StatutUnite;
    const allowed = workflow[fromStatut] || [];

    if (!allowed.includes(toStatut)) {
      setRejectMsg("Transition non autorisée");
      setRejectedCol(destination.droppableId);
      setTimeout(() => setRejectedCol(null), 900);
      return;
    }

    const card = baseCards.find((r) => r.id === draggableId);

    // Ne jamais passer à VENDU tant que le prix n'est pas intégralement réglé
    if (toStatut === "VENDU" && card) {
      const prixDu = prixDuFor(card);
      const paye = paiementsTotals[draggableId] ?? 0;
      if (!estIntegralementPaye(prixDu, paye)) {
        setRejectMsg(`Paiement incomplet — reste ${formatMAD(computeReste(prixDu, paye))}`);
        setRejectedCol(destination.droppableId);
        setTimeout(() => setRejectedCol(null), 1400);
        return;
      }
    }

    // Optimistic update
    setStatuts((prev) => ({ ...prev, [draggableId]: toStatut }));
    setMovedId(draggableId);
    setTimeout(() => setMovedId(null), 1500);

    // Persist to DB — draggableId is the reservation ID
    if (card) {
      Promise.all([
        updateReservationStatut(draggableId, toStatut),
        updateUniteStatut(card.unite_id, toStatut),
      ]).catch(() => {
        // Rollback optimistic update on failure
        setStatuts((prev) => ({ ...prev, [draggableId]: fromStatut }));
      });
    }
  }, [workflow, baseCards, paiementsTotals, prixDuFor]);

  const draggingCard = draggingId ? baseCards.find((r) => r.id === draggingId) : null;
  const draggingVenteBlocked = draggingCard
    ? !estIntegralementPaye(prixDuFor(draggingCard), paiementsTotals[draggingCard.id] ?? 0)
    : false;
  const draggingFromStatut = draggingId ? statuts[draggingId] : null;
  const validTargets = draggingFromStatut
    ? new Set(
        (workflow[draggingFromStatut] || []).filter(
          (s) => !(s === "VENDU" && draggingVenteBlocked)
        )
      )
    : null;

  if (loading) return <LoadingSpinner label="Chargement du pipeline…" />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-[#888888] mt-0.5">
            {enriched.length} dossiers actifs · CA total pipeline: {formatMAD(totalCA)}
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1.5">
          <p className="text-xs text-[#aaaaaa] flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5" />
            Glissez-déposez pour changer le statut
          </p>
          <div className="flex items-center gap-3 text-[11px] text-[#888888]">
            {(["EN_RETARD", "A_JOUR", "AUCUNE"] as SuiviIndicateur[]).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SUIVI_CFG[k].color }} />
                {SUIVI_CFG[k].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((statut) => {
            const cards = getColumn(statut);
            const cfg = STATUTS_UNITE[statut];
            const colCA = cards.reduce((sum, r) => sum + (r.unite?.prix || 0), 0);
            const isRejected = rejectedCol === statut;
            const isValidTarget = validTargets ? validTargets.has(statut) : false;
            const isSourceCol = draggingFromStatut === statut;

            return (
              <div key={statut} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div
                  className="rounded-t-xl px-4 py-3 flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: isValidTarget ? cfg.color + "30" : cfg.bg,
                    outline: isValidTarget ? `2px dashed ${cfg.color}` : "none",
                    outlineOffset: "-2px",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-sm font-semibold" style={{ color: cfg.text }}>{cfg.label}</span>
                    {isValidTarget && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.color, color: "white" }}>
                        ↓ Déposer
                      </span>
                    )}
                  </div>
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] font-bold px-1.5"
                    style={{ backgroundColor: cfg.color, color: "white" }}
                  >
                    {cards.length}
                  </span>
                </div>

                <Droppable droppableId={statut}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-b-xl border border-t-0 p-2 space-y-2 min-h-[400px] transition-colors duration-200"
                      style={{
                        borderColor: isRejected
                          ? "#ef4444"
                          : isValidTarget
                          ? cfg.color
                          : cfg.color + "40",
                        backgroundColor: isRejected
                          ? "#fee2e2"
                          : snapshot.isDraggingOver
                          ? cfg.color + "20"
                          : isSourceCol && draggingId
                          ? cfg.bg + "90"
                          : cfg.bg + "60",
                      }}
                    >
                      {isRejected && (
                        <div className="flex items-center justify-center gap-1.5 py-2 px-2 text-center text-xs text-red-600 font-medium">
                          <Ban className="h-3.5 w-3.5 flex-shrink-0" />
                          {rejectMsg}
                        </div>
                      )}

                      {cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={provided.draggableProps.style}
                            >
                              <div
                                className={`rounded-xl border bg-white p-3 transition-all ${
                                  snapshot.isDragging
                                    ? "shadow-xl border-[#c9773f] rotate-1 scale-105"
                                    : "border-[#e8e6e1] hover:shadow-md"
                                } ${movedId === card.id ? "ring-2 ring-[#c9773f] ring-offset-1" : ""}`}
                              >
                                {/* Drag handle + Client */}
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-[#cccccc] hover:text-[#888888] flex-shrink-0 -ml-1"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#c9773f] to-[#9c5a2e] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                    {card.client ? getInitials(card.client.prenom, card.client.nom) : "?"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <Link
                                      href={`/reservations/${card.id}`}
                                      onClick={(e) => { if (snapshot.isDragging) e.preventDefault(); }}
                                      className="text-xs font-semibold text-[#1a1a1a] truncate block hover:text-[#c9773f] transition-colors"
                                    >
                                      {card.client ? `${card.client.prenom} ${card.client.nom}` : "—"}
                                    </Link>
                                    <p className="text-[10px] text-[#aaaaaa] truncate">{card.client?.cin}</p>
                                  </div>
                                  <SuiviDot
                                    indicateur={suivi[card.id] ?? "AUCUNE"}
                                    onClick={() => setTaskDialog({ reservationId: card.id, clientId: card.client_id })}
                                  />
                                </div>

                                {/* Unite */}
                                {card.unite && (
                                  <div className="rounded-lg bg-stone-50 p-2 mb-2">
                                    <p className="text-[10px] text-[#888888] truncate">
                                      {card.unite.immeuble?.gh?.projet?.nom}
                                    </p>
                                    <p className="text-xs font-mono font-semibold text-[#1a1a1a]">
                                      Unité {card.unite.numero} · {card.unite.type}
                                    </p>
                                  </div>
                                )}

                                {/* Prix & date */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#1a1a1a]">{formatMAD(card.unite?.prix)}</span>
                                  <span className="text-[10px] text-[#aaaaaa]">{formatDate(card.date_reservation)}</span>
                                </div>

                                {/* Paiement */}
                                {(() => {
                                  const prixDu = prixDuFor(card);
                                  const paye = paiementsTotals[card.id] ?? 0;
                                  const complet = estIntegralementPaye(prixDu, paye);
                                  return (
                                    <div className="mt-2 pt-2 border-t border-[#e8e6e1] flex justify-between items-center">
                                      <span className="text-[10px] text-[#888888]">Payé</span>
                                      <span
                                        className="flex items-center gap-1 text-[11px] font-semibold"
                                        style={{ color: complet ? "#10b981" : statut === "NOTAIRE" ? "#ef4444" : cfg.color }}
                                      >
                                        {complet && <CheckCircle2 className="h-3 w-3" />}
                                        {formatMAD(paye)} / {formatMAD(prixDu)}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-24 text-xs text-[#aaaaaa]">
                          Aucun dossier
                        </div>
                      )}

                      {cards.length > 0 && (
                        <div className="rounded-lg px-3 py-2 text-center">
                          <p className="text-[10px] text-[#888888]">Total colonne</p>
                          <p className="text-xs font-bold" style={{ color: cfg.color }}>{formatMAD(colCA)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {taskDialog && (
        <TacheFormDialog
          open
          onOpenChange={(o) => { if (!o) setTaskDialog(null); }}
          lockedContext={{ reservation_id: taskDialog.reservationId, client_id: taskDialog.clientId }}
          onSaved={loadSuivi}
        />
      )}
    </div>
  );
}

function SuiviDot({
  indicateur, onClick,
}: {
  indicateur: SuiviIndicateur;
  onClick: () => void;
}) {
  const cfg = SUIVI_CFG[indicateur];
  const Icon = indicateur === "EN_RETARD" ? AlertCircle
    : indicateur === "A_JOUR" ? CheckCircle2
    : AlertTriangle;
  return (
    <button
      type="button"
      title={`${cfg.label} — cliquer pour planifier une tâche`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110"
      style={{ backgroundColor: cfg.bg }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
    </button>
  );
}
