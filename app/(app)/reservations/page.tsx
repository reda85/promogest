"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatutBadge } from "@/components/shared/StatutBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchReservations, type EnrichedReservation } from "@/lib/supabase/db";
import { STATUTS_UNITE } from "@/lib/constants";
import { formatMAD, formatDate, getInitials } from "@/lib/utils";
import { type StatutUnite } from "@/lib/types";

const STATUTS_ACTIFS: StatutUnite[] = ["OPTION", "RESERVE", "COMPROMIS", "NOTAIRE"];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutUnite | "all">("all");

  useEffect(() => {
    fetchReservations()
      .then(setReservations)
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Chargement des réservations…" />;

  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${r.client?.prenom} ${r.client?.nom}`.toLowerCase().includes(q) ||
      (r.client?.cin || "").toLowerCase().includes(q) ||
      (r.unite?.reference || "").toLowerCase().includes(q) ||
      (r.unite?.immeuble?.gh?.projet?.nom || "").toLowerCase().includes(q);
    const matchStatut = statutFilter === "all" || r.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const counters = reservations.reduce((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Réservations
          </h1>
          <p className="text-sm text-[#888888] mt-0.5">{reservations.length} réservations enregistrées</p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/reservations/nouvelle"><Plus className="h-4 w-4" />Nouvelle Réservation</Link>
        </Button>
      </div>

      {/* Statut filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatutFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
            statutFilter === "all"
              ? "bg-stone-900 text-white border-stone-900"
              : "border-[#e8e6e1] text-[#888888] hover:border-stone-300 bg-white"
          }`}
        >
          Tous ({reservations.length})
        </button>
        {STATUTS_ACTIFS.map((statut) => {
          const cfg = STATUTS_UNITE[statut];
          const count = counters[statut] || 0;
          return (
            <button
              key={statut}
              onClick={() => setStatutFilter(statut)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                statutFilter === statut
                  ? "border-transparent text-white"
                  : "border-[#e8e6e1] bg-white"
              }`}
              style={
                statutFilter === statut
                  ? { backgroundColor: cfg.color, borderColor: cfg.color }
                  : { color: cfg.color }
              }
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Nom client, référence, projet..." />
      </div>

      <div className="space-y-3">
        {filtered.map((res) => (
          <Link key={res.id} href={`/reservations/${res.id}`} className="block group">
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-4 hover:shadow-md hover:border-[#c9773f]/30 transition-all">
              <div className="flex items-center gap-4">
                {/* Client avatar */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c9773f] to-[#9c5a2e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {res.client ? getInitials(res.client.prenom, res.client.nom) : "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[#1a1a1a] group-hover:text-[#c9773f] transition-colors">
                      {res.client ? `${res.client.prenom} ${res.client.nom}` : "Client inconnu"}
                    </p>
                    <StatutBadge statut={res.statut} />
                  </div>
                  <p className="text-xs text-[#888888]">
                    {res.unite?.immeuble?.gh?.projet?.nom}
                    {res.unite?.immeuble && ` · ${res.unite.immeuble.nom}`}
                    {res.unite && ` · Unité ${res.unite.numero}`}
                  </p>
                </div>

                {/* Financials */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#1a1a1a]">{formatMAD(res.unite?.prix)}</p>
                  <p className="text-xs text-[#888888]">Avance: {formatMAD(res.montant_avance)}</p>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden md:block">
                  <p className="text-xs text-[#888888]">{formatDate(res.date_reservation)}</p>
                  <p className="text-xs text-[#aaaaaa]">{res.mode_paiement}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[#e8e6e1] bg-white py-12 text-center text-[#aaaaaa] text-sm">
            Aucune réservation trouvée
          </div>
        )}
      </div>
    </div>
  );
}
