"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LayoutGrid, List, Plus, Lock, Pencil } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchImmeuble, type ImmeubleWithUnites } from "@/lib/supabase/db";
import { STATUTS_UNITE } from "@/lib/constants";
import { StatutBadge } from "@/components/shared/StatutBadge";
import { StatusFilter } from "@/components/shared/StatusFilter";
import { ImmeubleFormDialog } from "@/components/shared/ImmeubleFormDialog";
import { UniteFormDialog } from "@/components/shared/UniteFormDialog";
import { formatMAD, formatSurface } from "@/lib/utils";
import { type StatutUnite, type Unite } from "@/lib/types";
import { getCurrentRole } from "@/lib/role-store";
import { ROLE_PERMISSIONS } from "@/lib/roles";

type ImmeubleUnite = ImmeubleWithUnites["unites"][number];

export default function ImmeubleUnites() {
  const { projetId, ghId, immeubleId } = useParams<{ projetId: string; ghId: string; immeubleId: string }>();
  const [immeuble, setImmeuble] = useState<ImmeubleWithUnites | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [statutFilter, setStatutFilter] = useState<StatutUnite | null>(null);
  const [role] = useState(getCurrentRole);
  const perms = ROLE_PERMISSIONS[role];
  const [editImmeubleOpen, setEditImmeubleOpen] = useState(false);
  const [uniteDialogOpen, setUniteDialogOpen] = useState(false);

  useEffect(() => {
    fetchImmeuble(immeubleId)
      .then(setImmeuble)
      .catch(() => setImmeuble(null))
      .finally(() => setLoading(false));
  }, [immeubleId]);

  if (loading) return <LoadingSpinner label="Chargement de l'immeuble…" />;
  if (!immeuble) return (
    <div className="text-center py-20 text-[#aaaaaa]">Immeuble introuvable</div>
  );

  const projet = immeuble.gh?.projet;
  const gh     = immeuble.gh;
  const allUnites: ImmeubleUnite[] = immeuble.unites || [];
  const statutCounts: Partial<Record<StatutUnite, number>> = {};
  allUnites.forEach((u) => { statutCounts[u.statut] = (statutCounts[u.statut] || 0) + 1; });

  const filtered = statutFilter ? allUnites.filter((u) => u.statut === statutFilter) : allUnites;

  const etages = Array.from(new Set(allUnites.map((u) => u.etage)));
  const byEtage = etages.map((e) => ({
    etage: e,
    unites: filtered.filter((u) => u.etage === e),
  })).filter((e) => e.unites.length > 0);

  const hasReservation = (unite: ImmeubleUnite) => unite.reservations && unite.reservations.length > 0;

  return (
    <div className="space-y-5">
      {/* Dialogs */}
      <ImmeubleFormDialog
        open={editImmeubleOpen}
        onOpenChange={setEditImmeubleOpen}
        immeuble={immeuble}
        onSuccess={(updated) =>
          setImmeuble((prev) =>
            prev ? { ...prev, nom: updated.nom, nb_etages: updated.nb_etages } : prev
          )
        }
      />
      <UniteFormDialog
        open={uniteDialogOpen}
        onOpenChange={setUniteDialogOpen}
        immeubleId={immeubleId}
        ghId={immeuble.gh_id}
        projetId={immeuble.projet_id}
        onSuccess={(newUnite: Unite) =>
          setImmeuble((prev) =>
            prev
              ? { ...prev, unites: [...prev.unites, { ...newUnite, reservations: [] }] }
              : prev
          )
        }
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/projets" className="hover:text-[#1a1a1a]">Projets</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projets/${projetId}`} className="hover:text-[#1a1a1a]">{projet?.nom ?? projetId}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/projets/${projetId}/${ghId}`} className="hover:text-[#1a1a1a]">{gh?.nom ?? ghId}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">{immeuble.nom}</span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{immeuble.nom}</h1>
            {perms.canEditProject && (
              <button
                onClick={() => setEditImmeubleOpen(true)}
                className="rounded-lg border border-[#e8e6e1] p-1.5 text-[#aaaaaa] hover:text-[#1a1a1a] hover:border-[#c8956c]/40 transition-colors"
                title="Modifier l'immeuble"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm text-[#888888]">{gh?.nom} · {immeuble.nb_etages} étages · {allUnites.length} unités</p>
        </div>
        <div className="flex items-center gap-2">
          {perms.canCreateUnite ? (
            <button
              onClick={() => setUniteDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#c8956c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#a67c52] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouvelle Unité
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-[#aaaaaa]" title="Votre rôle ne permet pas de créer des unités">
              <Lock className="h-3.5 w-3.5" />
              Unités (lecture seule)
            </div>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-[#e8e6e1] bg-white p-1">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === "grid" ? "bg-stone-900 text-white" : "text-[#888888] hover:text-[#1a1a1a]"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />Grille
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === "list" ? "bg-stone-900 text-white" : "text-[#888888] hover:text-[#1a1a1a]"}`}
            >
              <List className="h-3.5 w-3.5" />Liste
            </button>
          </div>
        </div>
      </div>

      <StatusFilter counts={statutCounts} selected={statutFilter} onSelect={setStatutFilter} />

      {view === "grid" ? (
        <div className="space-y-6">
          {byEtage.map(({ etage, unites }) => (
            <div key={etage}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-[#888888]">{etage}</span>
                <div className="flex-1 h-px bg-[#e8e6e1]" />
                <span className="text-xs text-[#aaaaaa]">{unites.length} unité{unites.length > 1 ? "s" : ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {unites.map((unite) => {
                  const cfg = STATUTS_UNITE[unite.statut];
                  return (
                    <Link key={unite.id} href={`/projets/${projetId}/${ghId}/${immeubleId}/${unite.id}`} className="block group">
                      <div className="rounded-xl border border-[#e8e6e1] bg-white overflow-hidden hover:shadow-md transition-all">
                        <div className="h-1" style={{ backgroundColor: cfg.color }} />
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-[#1a1a1a] font-mono">{unite.numero}</span>
                            <span className="text-[10px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-[#888888]">{unite.type} · {unite.surface}m²</p>
                          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{formatMAD(unite.prix)}</p>
                          {hasReservation(unite) && (
                            <p className="text-[10px] text-[#c8956c] mt-1">Client assigné</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {byEtage.length === 0 && (
            <p className="text-sm text-[#aaaaaa] text-center py-12">Aucune unité{statutFilter ? " pour ce statut" : ""}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e8e6e1] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e6e1] bg-stone-50 text-[#888888]">
                {["N°", "Type", "Étage", "Surface", "Orientation", "Prix", "Statut", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6e1]">
              {filtered.map((unite) => (
                <tr key={unite.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/projets/${projetId}/${ghId}/${immeubleId}/${unite.id}`} className="font-mono font-medium text-[#1a1a1a] hover:text-[#c8956c]">
                      {unite.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#888888]">{unite.type}</td>
                  <td className="px-4 py-3 text-[#888888]">{unite.etage}</td>
                  <td className="px-4 py-3 text-[#888888]">{formatSurface(unite.surface)}</td>
                  <td className="px-4 py-3 text-[#888888]">{unite.orientation || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-[#1a1a1a]">{formatMAD(unite.prix)}</td>
                  <td className="px-4 py-3"><StatutBadge statut={unite.statut} /></td>
                  <td className="px-4 py-3 text-[#888888] text-xs">
                    {hasReservation(unite) ? "Client assigné" : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#aaaaaa]">Aucune unité{statutFilter ? " pour ce statut" : ""}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
