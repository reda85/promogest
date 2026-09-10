"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home, Pencil, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchGH, type GHWithImmeubles } from "@/lib/supabase/db";
import { GHFormDialog } from "@/components/shared/GHFormDialog";
import { ImmeubleFormDialog } from "@/components/shared/ImmeubleFormDialog";
import { STATUTS_UNITE } from "@/lib/constants";
import { type StatutUnite, type Immeuble } from "@/lib/types";

export default function GHPage() {
  const { projetId, ghId } = useParams<{ projetId: string; ghId: string }>();
  const [gh, setGH] = useState<GHWithImmeubles | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [immeubleDialogOpen, setImmeubleDialogOpen] = useState(false);

  useEffect(() => {
    fetchGH(ghId)
      .then(setGH)
      .catch(() => setGH(null))
      .finally(() => setLoading(false));
  }, [ghId]);

  if (loading) return <LoadingSpinner label="Chargement du groupe d'habitation…" />;
  if (!gh) return (
    <div className="text-center py-20 text-[#aaaaaa]">Groupe d&apos;habitation introuvable</div>
  );

  const projet = gh.projet;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/projets" className="hover:text-[#1a1a1a]">Projets</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projets/${projetId}`} className="hover:text-[#1a1a1a]">{projet?.nom ?? projetId}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">{gh.nom}</span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{gh.nom}</h1>
          <p className="text-sm text-[#888888]">{projet?.nom} · {gh.immeubles.length} immeubles</p>
          {gh.description && <p className="text-sm text-[#888888] mt-0.5">{gh.description}</p>}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#e8e6e1] bg-white px-3 py-2 text-xs font-medium text-[#888888] hover:text-[#1a1a1a] hover:border-[#c8956c]/40 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </button>
      </div>

      {/* Edit GH dialog */}
      <GHFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        gh={gh}
        onSuccess={(updated) => setGH((prev) => prev ? { ...prev, ...updated } : prev)}
      />

      {/* New immeuble dialog */}
      <ImmeubleFormDialog
        open={immeubleDialogOpen}
        onOpenChange={setImmeubleDialogOpen}
        ghId={ghId}
        projetId={gh.projet_id}
        onSuccess={(newImm: Immeuble) =>
          setGH((prev) =>
            prev ? { ...prev, immeubles: [...prev.immeubles, { ...newImm, unites: [] }] } : prev
          )
        }
      />

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[#888888]">{gh.immeubles.length} immeuble{gh.immeubles.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setImmeubleDialogOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#c8956c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#a67c52] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvel immeuble
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {gh.immeubles.map((immeuble) => {
          const unites = immeuble.unites || [];
          const statutCounts: Partial<Record<StatutUnite, number>> = {};
          unites.forEach((u) => {
            statutCounts[u.statut] = (statutCounts[u.statut] || 0) + 1;
          });
          const etages = Array.from(new Set(unites.map((u) => u.etage)));

          return (
            <Link key={immeuble.id} href={`/projets/${projetId}/${ghId}/${immeuble.id}`} className="block group">
              <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 hover:shadow-md hover:border-[#c8956c]/30 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#1a1a1a] group-hover:text-[#c8956c] transition-colors">{immeuble.nom}</h3>
                    <p className="text-xs text-[#888888]">{immeuble.nb_etages} étages · {unites.length} unités</p>
                  </div>
                </div>

                {/* Mini floor visualization */}
                <div className="space-y-1">
                  {etages.slice(0, 6).map((etage) => {
                    const etageUnites = unites.filter((u) => u.etage === etage);
                    return (
                      <div key={etage} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#aaaaaa] w-10 flex-shrink-0">{etage}</span>
                        <div className="flex gap-0.5 flex-1">
                          {etageUnites.map((u) => (
                            <div
                              key={u.id}
                              className="h-4 flex-1 rounded-sm min-w-[8px]"
                              style={{ backgroundColor: STATUTS_UNITE[u.statut]?.color || "#e8e6e1" }}
                              title={`${u.numero} - ${STATUTS_UNITE[u.statut]?.label}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {etages.length > 6 && (
                    <p className="text-[10px] text-[#aaaaaa] text-center">+{etages.length - 6} étages...</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e8e6e1]">
                  <div className="flex gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ backgroundColor: STATUTS_UNITE.DISPONIBLE.bg, color: STATUTS_UNITE.DISPONIBLE.color }}>
                      {statutCounts.DISPONIBLE || 0} dispo
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ backgroundColor: STATUTS_UNITE.VENDU.bg, color: STATUTS_UNITE.VENDU.color }}>
                      {statutCounts.VENDU || 0} vendus
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#888888]">
                    <Home className="h-3.5 w-3.5" />
                    {unites.length}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {gh.immeubles.length === 0 && (
          <p className="col-span-full text-sm text-[#aaaaaa] text-center py-8">Aucun immeuble enregistré</p>
        )}
      </div>
    </div>
  );
}
