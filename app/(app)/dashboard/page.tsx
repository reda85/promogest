"use client";
import { useEffect, useState } from "react";
import { Home, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { StatutBar } from "@/components/shared/StatutBar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchProjets, type ProjetWithGHs } from "@/lib/supabase/db";
import { STATUTS_UNITE } from "@/lib/constants";
import { formatMAD } from "@/lib/utils";
import Link from "next/link";
import { type StatutUnite, type Projet } from "@/lib/types";

const ORDERED_STATUTS: StatutUnite[] = ["DISPONIBLE", "OPTION", "RESERVE", "COMPROMIS", "NOTAIRE", "VENDU", "ANNULE", "DESISTE"];

export default function DashboardPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjets()
      .then(setProjets)
      .catch(() => setProjets([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Chargement du tableau de bord…" />;

  // Compute KPIs from real data
  const repartition_statuts = projets.reduce((acc, p) => {
    if (p.statuts_count) {
      for (const [k, v] of Object.entries(p.statuts_count)) {
        acc[k as StatutUnite] = (acc[k as StatutUnite] || 0) + (v as number);
      }
    }
    return acc;
  }, {} as Partial<Record<StatutUnite, number>>);

  const total        = Object.values(repartition_statuts).reduce((a, b) => a + b, 0);
  const unitesVendues = repartition_statuts["VENDU"] || 0;
  const reservationsEnCours = (repartition_statuts["RESERVE"] || 0) + (repartition_statuts["COMPROMIS"] || 0) + (repartition_statuts["NOTAIRE"] || 0);
  const caRealise    = projets.reduce((s, p) => s + (p.ca_realise || 0), 0);
  const caPipeline   = projets.reduce((s, p) => {
    const sc = (p.statuts_count || {}) as Partial<Record<StatutUnite, number>>;
    const pipeline = ["OPTION","RESERVE","COMPROMIS","NOTAIRE"] as StatutUnite[];
    // approximate: can't get exact values without all unit prices here
    return s + pipeline.reduce((ss, st) => ss + (sc[st] || 0), 0) * 800000;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">
          Tableau de bord
        </h1>
        <p className="text-sm text-[#888888] mt-0.5">Vue d&apos;ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Unités vendues"        value={unitesVendues}         subtitle={`sur ${total} unités totales`}   icon={Home}       color="#10b981" />
        <KPICard title="Réservations en cours" value={reservationsEnCours}   subtitle="RÉSERVÉ + COMPROMIS + NOTAIRE"    icon={CheckCircle} color="#3b82f6" />
        <KPICard title="CA réalisé"            value={formatMAD(caRealise)}  subtitle="Unités vendues"                   icon={DollarSign}  color="#c8956c" />
        <KPICard title="CA pipeline"           value={formatMAD(caPipeline)} subtitle="Réservations actives (estimé)"    icon={TrendingUp}  color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Répartition statuts */}
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Répartition par statut</h2>
          {total > 0 ? (
            <>
              <StatutBar counts={repartition_statuts as Record<StatutUnite, number>} total={total} height={10} />
              <div className="mt-4 space-y-2">
                {ORDERED_STATUTS.map((statut) => {
                  const count = repartition_statuts[statut] || 0;
                  const pct   = total ? Math.round((count / total) * 100) : 0;
                  const cfg   = STATUTS_UNITE[statut];
                  return (
                    <div key={statut} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span className="text-sm text-[#888888] flex-1">{cfg.label}</span>
                      <span className="text-sm font-semibold text-[#1a1a1a] w-8 text-right">{count}</span>
                      <div className="w-24 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                      </div>
                      <span className="text-xs text-[#aaaaaa] w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#aaaaaa] text-center py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* Projets actifs */}
        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Projets actifs</h2>
          {projets.length === 0 ? (
            <p className="text-sm text-[#aaaaaa] text-center py-8">Aucun projet enregistré</p>
          ) : (
            <div className="space-y-4">
              {projets.map((projet) => {
                const vendues = projet.nb_vendues || 0;
                const tot     = projet.nb_unites  || 1;
                const pct     = Math.round((vendues / tot) * 100);
                return (
                  <Link key={projet.id} href={`/projets/${projet.id}`} className="block group">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#c8956c] transition-colors">
                          {projet.nom}
                        </p>
                        <p className="text-xs text-[#888888]">{projet.quartier}, {projet.ville}</p>
                      </div>
                      <span className="text-xs font-bold text-[#1a1a1a] flex-shrink-0">{vendues}/{projet.nb_unites ?? 0}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#c8956c] to-[#a67c52] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-[#aaaaaa] mt-0.5">{formatMAD(projet.ca_realise)} CA réalisé</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
