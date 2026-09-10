"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Building2, Home, Layers, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchProjet, type ProjetWithGHs } from "@/lib/supabase/db";
import { GHFormDialog } from "@/components/shared/GHFormDialog";
import type { GH } from "@/lib/types";

export default function ProjetPage() {
  const { projetId } = useParams<{ projetId: string }>();
  const [projet, setProjet] = useState<ProjetWithGHs | null>(null);
  const [loading, setLoading] = useState(true);
  const [ghDialogOpen, setGhDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjet(projetId)
      .then(setProjet)
      .catch(() => setProjet(null))
      .finally(() => setLoading(false));
  }, [projetId]);

  if (loading) return <LoadingSpinner label="Chargement du projet…" />;
  if (!projet) return (
    <div className="text-center py-20 text-[#aaaaaa]">Projet introuvable</div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/projets" className="hover:text-[#1a1a1a]">Projets</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">{projet.nom}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{projet.nom}</h1>
          <p className="text-sm text-[#888888]">{projet.quartier} · {projet.ville} · {projet.consistance}</p>
        </div>
      </div>

      {/* GH Dialog */}
      <GHFormDialog
        open={ghDialogOpen}
        onOpenChange={setGhDialogOpen}
        projetId={projetId}
        onSuccess={(newGh: GH) => {
          setProjet((prev) => prev
            ? { ...prev, ghs: [...prev.ghs, { ...newGh, immeubles: [] }] }
            : prev
          );
        }}
      />

      {/* GH Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1a1a1a]">
            Groupes d&apos;Habitations ({projet.ghs.length})
          </h2>
          <button
            onClick={() => setGhDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#c8956c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#a67c52] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau GH
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projet.ghs.map((gh) => {
            const nbUnites = gh.immeubles.reduce((sum, i) => sum + (i.unites?.length || 0), 0);
            return (
              <Link key={gh.id} href={`/projets/${projetId}/${gh.id}`} className="block group">
                <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 hover:shadow-md hover:border-[#c8956c]/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-[#c8956c]/10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-[#c8956c]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1a1a1a] group-hover:text-[#c8956c] transition-colors">{gh.nom}</h3>
                      {gh.description && <p className="text-xs text-[#888888]">{gh.description}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Immeubles", value: gh.immeubles.length, icon: Building2 },
                      { label: "Unités",    value: nbUnites,             icon: Home      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-stone-50 p-3 text-center">
                        <p className="text-lg font-bold text-[#1a1a1a]">{item.value}</p>
                        <p className="text-[10px] text-[#aaaaaa]">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
          {projet.ghs.length === 0 && (
            <p className="col-span-full text-sm text-[#aaaaaa] text-center py-8">Aucun groupe d&apos;habitation enregistré</p>
          )}
        </div>
      </div>
    </div>
  );
}
