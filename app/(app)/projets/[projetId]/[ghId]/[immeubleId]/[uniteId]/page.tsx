"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, Maximize2, Compass, Building2, Layers, Star, Pencil } from "lucide-react";
import { fetchUnite, fetchImmeuble, type UniteDetail, type ImmeubleWithUnites } from "@/lib/supabase/db";
import { STATUTS_UNITE } from "@/lib/constants";
import { StatutBadge } from "@/components/shared/StatutBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UniteFormDialog } from "@/components/shared/UniteFormDialog";
import { formatMAD, formatDate, getPrixParM2, getInitials } from "@/lib/utils";
import type { Unite } from "@/lib/types";

const HISTORY_ICONS: Record<string, string> = {
  CREATION: "🏗️", OPTION: "🤝", RESERVATION: "📋", COMPROMIS: "✍️",
  ENVOI_NOTAIRE: "⚖️", VENTE: "🎉", ANNULATION: "❌", DESISTEMENT: "↩️",
  LIBERATION: "🔓", MODIF_PRIX: "💰", NOTE: "📝",
};

export default function UnitePage() {
  const { projetId, ghId, immeubleId, uniteId } = useParams<{
    projetId: string; ghId: string; immeubleId: string; uniteId: string;
  }>();
  const [unite, setUnite] = useState<UniteDetail | null>(null);
  const [immeubleData, setImmeubleData] = useState<ImmeubleWithUnites | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchUnite(uniteId).catch(() => null),
      fetchImmeuble(immeubleId).catch(() => null),
    ]).then(([u, imm]) => {
      setUnite(u);
      setImmeubleData(imm);
    }).finally(() => setLoading(false));
  }, [uniteId, immeubleId]);

  if (loading) return <LoadingSpinner label="Chargement de l'unité…" />;
  if (!unite) return (
    <div className="text-center py-20 text-[#aaaaaa]">Unité introuvable</div>
  );

  const reservation = unite.reservations?.[0] ?? null;
  const client = reservation?.client ?? null;
  const historique = unite.historique_unites ?? [];
  const cfg = STATUTS_UNITE[unite.statut];

  return (
    <div className="space-y-5">
      <UniteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        unite={unite}
        onSuccess={(updated: Unite) =>
          setUnite((prev) => prev ? { ...prev, ...updated } : prev)
        }
      />

      <nav className="flex items-center gap-1 text-sm text-[#888888] flex-wrap">
        <Link href="/projets" className="hover:text-[#1a1a1a]">Projets</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projets/${projetId}`} className="hover:text-[#1a1a1a]">
          {immeubleData?.gh?.projet?.nom ?? projetId}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projets/${projetId}/${ghId}`} className="hover:text-[#1a1a1a]">
          {immeubleData?.gh?.nom ?? ghId}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projets/${projetId}/${ghId}/${immeubleId}`} className="hover:text-[#1a1a1a]">
          {immeubleData?.nom ?? immeubleId}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">Unité {unite.numero}</span>
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: Unit details */}
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">
                    Unité {unite.numero}
                  </h1>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="rounded-lg border border-[#e8e6e1] p-1.5 text-[#aaaaaa] hover:text-[#1a1a1a] hover:border-[#c8956c]/40 transition-colors"
                    title="Modifier l'unité"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <StatutBadge statut={unite.statut} />
                </div>
                <p className="text-sm font-mono text-[#888888]">{unite.reference}</p>
              </div>
              <div
                className="rounded-xl px-3 py-1.5 text-sm font-semibold"
                style={{ backgroundColor: cfg.bg, color: cfg.text }}
              >
                {cfg.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Home, label: "Type", value: unite.type },
                { icon: Maximize2, label: "Surface", value: `${unite.surface} m²` },
                { icon: Compass, label: "Orientation", value: unite.orientation || "—" },
                { icon: Building2, label: "Façade", value: unite.facade || "—" },
                { icon: Layers, label: "Étage", value: unite.etage },
                { icon: Star, label: "Pièces", value: unite.nb_pieces ? `${unite.nb_pieces} pièces` : "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl bg-stone-50 p-3">
                  <item.icon className="h-4 w-4 text-[#c8956c] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#aaaaaa]">{item.label}</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {unite.terrasse_surface != null && unite.terrasse_surface > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 flex justify-between">
                <span className="text-sm text-amber-700">☀️ Terrasse</span>
                <span className="text-sm font-medium text-amber-900">{unite.terrasse_surface} m²</span>
              </div>
            )}
          </div>

          {/* Prix card */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#888888] mb-3">Prix de vente</h3>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold">
                {formatMAD(unite.prix)}
              </p>
              <p className="text-sm text-[#888888]">{getPrixParM2(unite.prix, unite.surface)}</p>
            </div>
          </div>

          {/* Client card */}
          {client ? (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-3">Client assigné</h3>
              <Link href={`/clients/${client.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67c52] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getInitials(client.prenom, client.nom)}
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] group-hover:text-[#c8956c] transition-colors">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-xs font-mono text-[#888888]">{client.cin}</p>
                </div>
              </Link>
              {reservation && (
                <div className="mt-3 pt-3 border-t border-[#e8e6e1] grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-[#aaaaaa] mb-0.5">Avance versée</p>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{formatMAD(reservation.montant_avance)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#aaaaaa] mb-0.5">Mode paiement</p>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{reservation.mode_paiement || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#aaaaaa] mb-0.5">Date réservation</p>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{formatDate(reservation.date_reservation)}</p>
                  </div>
                  {reservation.banque && (
                    <div>
                      <p className="text-[10px] text-[#aaaaaa] mb-0.5">Banque</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">{reservation.banque}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#e8e6e1] bg-white p-5 text-center">
              <p className="text-sm text-[#aaaaaa]">Aucun client assigné</p>
              <Link href="/reservations/nouvelle" className="text-sm text-[#c8956c] hover:underline mt-1 block">
                Créer une réservation →
              </Link>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
          <h3 className="text-base font-semibold text-[#1a1a1a] mb-4">Historique de l&apos;unité</h3>
          {historique.length === 0 ? (
            <p className="text-sm text-[#aaaaaa] text-center py-12">Aucun historique disponible</p>
          ) : (
            <div className="space-y-0">
              {historique.map((event, i) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-base flex-shrink-0">
                      {HISTORY_ICONS[event.type] || "📌"}
                    </div>
                    {i < historique.length - 1 && (
                      <div className="w-px flex-1 bg-[#e8e6e1] my-1" style={{ minHeight: "24px" }} />
                    )}
                  </div>
                  <div className="flex-1 pb-5">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      {event.type.replace(/_/g, " ")}
                    </p>
                    {event.details && (
                      <p className="text-xs text-[#888888] mt-0.5">{event.details}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-[#aaaaaa]">{formatDate(event.created_at)}</span>
                      {event.agent && (
                        <span className="text-[11px] text-[#888888]">par {event.agent}</span>
                      )}
                      {event.client_nom && (
                        <span className="text-[11px] font-medium text-[#c8956c]">{event.client_nom}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
