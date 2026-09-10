"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Building2, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatutBar } from "@/components/shared/StatutBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchProjets } from "@/lib/supabase/db";
import { type Projet } from "@/lib/types";
import { formatMAD } from "@/lib/utils";
import { getCurrentRole } from "@/lib/role-store";
import { ROLE_PERMISSIONS } from "@/lib/roles";

export default function ProjetsPage() {
  const [role] = useState(getCurrentRole);
  const perms = ROLE_PERMISSIONS[role];
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjets()
      .then(setProjets)
      .catch(() => setProjets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Chargement des projets…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projets</h1>
          <p className="text-sm text-[#888888] mt-0.5">{projets.length} projets actifs</p>
        </div>
        {perms.canCreateProject ? (
          <Button variant="primary" asChild>
            <Link href="/projets/nouveau"><Plus className="h-4 w-4" />Nouveau Projet</Link>
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[#aaaaaa] bg-stone-100 rounded-lg px-3 py-2">
            <Lock className="h-3.5 w-3.5" />
            Création non autorisée
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projets.map((projet) => {
          const total = projet.nb_unites || 0;
          return (
            <Link key={projet.id} href={`/projets/${projet.id}`} className="block group">
              <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 hover:shadow-md hover:border-[#c8956c]/30 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8956c]/15 to-[#a67c52]/15 flex-shrink-0">
                    <Building2 className="h-5 w-5 text-[#c8956c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1a1a1a] group-hover:text-[#c8956c] transition-colors truncate">{projet.nom}</h3>
                    <p className="text-xs text-[#888888]">{projet.quartier} · {projet.ville}</p>
                  </div>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "GH",      value: projet.nb_ghs      },
                    { label: "Imm.",    value: projet.nb_immeubles },
                    { label: "Unités",  value: projet.nb_unites   },
                    { label: "Vendues", value: projet.nb_vendues  },
                  ].map((item) => (
                    <div key={item.label} className="text-center rounded-lg bg-stone-50 py-2 px-1">
                      <p className="text-sm font-bold text-[#1a1a1a]">{item.value ?? 0}</p>
                      <p className="text-[10px] text-[#aaaaaa]">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Statut bar */}
                {projet.statuts_count && total > 0 && (
                  <div className="mb-3">
                    <StatutBar counts={projet.statuts_count} total={total} />
                  </div>
                )}

                {/* CA */}
                <div className="flex items-center justify-between pt-3 border-t border-[#e8e6e1]">
                  <div className="flex items-center gap-1.5 text-xs text-[#888888]">
                    <TrendingUp className="h-3.5 w-3.5" />
                    CA réalisé
                  </div>
                  <span className="text-sm font-bold text-[#1a1a1a]">{formatMAD(projet.ca_realise)}</span>
                </div>
              </div>
            </Link>
          );
        })}

        {projets.length === 0 && (
          <div className="col-span-full rounded-2xl border border-[#e8e6e1] bg-white py-16 text-center text-[#aaaaaa] text-sm">
            Aucun projet enregistré
          </div>
        )}
      </div>
    </div>
  );
}
