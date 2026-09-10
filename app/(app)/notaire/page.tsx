"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Scale, CheckCircle, Clock, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchDossiers, type EnrichedDossier } from "@/lib/supabase/db";
import { STATUTS_NOTAIRE } from "@/lib/constants";
import { formatMAD, formatDate, getInitials } from "@/lib/utils";
import { KPICard } from "@/components/shared/KPICard";

export default function NotairePage() {
  const [dossiers, setDossiers] = useState<EnrichedDossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDossiers()
      .then(setDossiers)
      .catch(() => setDossiers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Chargement des dossiers notaire…" />;

  const statsCounts = dossiers.reduce((acc, d) => {
    acc[d.statut] = (acc[d.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Gestion Notaire
          </h1>
          <p className="text-sm text-[#888888] mt-0.5">{dossiers.length} dossiers en cours</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/notaire/notaires"><Users className="h-4 w-4" />Notaires</Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/notaire/nouveau"><Plus className="h-4 w-4" />Nouveau Dossier</Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPICard title="En préparation" value={statsCounts["EN_PREPARATION"] || 0} icon={Clock} color="#f59e0b" />
        <KPICard title="Envoyés" value={statsCounts["ENVOYE"] || 0} icon={Scale} color="#3b82f6" />
        <KPICard title="Attente signature" value={statsCounts["EN_ATTENTE_SIGNATURE"] || 0} icon={AlertCircle} color="#8b5cf6" />
        <KPICard title="Signés" value={statsCounts["SIGNE"] || 0} icon={CheckCircle} color="#10b981" />
      </div>

      {/* Dossiers list */}
      <div className="space-y-3">
        {dossiers.length === 0 && (
          <div className="rounded-2xl border border-[#e8e6e1] bg-white py-16 text-center text-[#aaaaaa] text-sm">
            Aucun dossier enregistré
          </div>
        )}
        {dossiers.map((dossier) => {
          const cfg = STATUTS_NOTAIRE[dossier.statut];
          const docsTotal = dossier.documents?.length || 0;
          const docsFournis = dossier.documents?.filter((d) => d.fourni).length || 0;
          const docsComplet = docsTotal > 0 ? Math.round((docsFournis / docsTotal) * 100) : 0;

          return (
            <Link key={dossier.id} href={`/notaire/${dossier.id}`} className="block group">
              <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 hover:shadow-md hover:border-[#c8956c]/30 transition-all">
                <div className="flex items-start gap-4">
                  {/* Client avatar */}
                  {dossier.client && (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67c52] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {getInitials(dossier.client.prenom, dossier.client.nom)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-[#1a1a1a] group-hover:text-[#c8956c] transition-colors">
                        {dossier.client ? `${dossier.client.prenom} ${dossier.client.nom}` : "—"}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: cfg.bg, color: cfg.text }}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#888888]">
                      {dossier.unite?.immeuble?.gh?.projet?.nom}
                      {dossier.unite?.immeuble && ` · ${dossier.unite.immeuble.nom}`}
                      {dossier.unite && ` · Unité ${dossier.unite.numero}`}
                    </p>

                    {dossier.notaire && (
                      <p className="text-xs text-[#888888] mt-0.5">
                        Notaire: <span className="font-medium text-[#1a1a1a]">{dossier.notaire.nom}</span>
                        {dossier.notaire.ville && ` — ${dossier.notaire.ville}`}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-xs text-[#888888]">
                      {dossier.date_envoi ? `Envoyé le ${formatDate(dossier.date_envoi)}` : ""}
                    </p>
                    {dossier.date_signature_prevue && (
                      <p className="text-xs text-[#888888]">
                        Signature prévue: {formatDate(dossier.date_signature_prevue)}
                      </p>
                    )}
                    {dossier.date_signature_effective && (
                      <p className="text-xs font-semibold text-[#10b981]">
                        ✓ Signé le {formatDate(dossier.date_signature_effective)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Docs progress */}
                {docsTotal > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#c8956c] to-[#a67c52]"
                        style={{ width: `${docsComplet}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#888888] flex-shrink-0">
                      {docsFournis}/{docsTotal} docs
                    </span>
                    <span className="text-xs font-semibold text-[#1a1a1a]">
                      {docsComplet}%
                    </span>
                  </div>
                )}

                {/* Frais */}
                {(dossier.frais_notaire || dossier.droits_enregistrement) && (
                  <div className="mt-3 pt-3 border-t border-[#e8e6e1] flex gap-4 text-xs text-[#888888]">
                    <span>Frais notaire: <strong className="text-[#1a1a1a]">{formatMAD(dossier.frais_notaire)}</strong></span>
                    <span>Droits enreg.: <strong className="text-[#1a1a1a]">{formatMAD(dossier.droits_enregistrement)}</strong></span>
                    <span>Conserv. fonc.: <strong className="text-[#1a1a1a]">{formatMAD(dossier.conservation_fonciere)}</strong></span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
