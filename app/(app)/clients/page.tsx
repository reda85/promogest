"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { StatutBadge } from "@/components/shared/StatutBadge";
import { getInitials } from "@/lib/utils";
import { fetchClients, type ClientWithReservations } from "@/lib/supabase/db";
import { type StatutUnite } from "@/lib/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithReservations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Chargement des clients…" />;

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.prenom.toLowerCase().includes(q) ||
      c.nom.toLowerCase().includes(q) ||
      c.cin.toLowerCase().includes(q) ||
      c.telephone.includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const getClientStatut = (client: ClientWithReservations): StatutUnite | null => {
    const res = client.reservations;
    if (!res || res.length === 0) return null;
    return res[res.length - 1].statut as StatutUnite;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-[#888888] mt-0.5">{clients.length} clients enregistrés</p>
        </div>
        <Button variant="primary" asChild>
          <Link href="/clients/nouveau"><Plus className="h-4 w-4" />Nouveau Client</Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom, CIN, téléphone..." />
        </div>
        <span className="text-sm text-[#888888]">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-2xl border border-[#e8e6e1] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e6e1] bg-stone-50">
              {["Client", "CIN", "Téléphone", "Ville", "Profession", "Source", "Statut", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#888888]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e6e1]">
            {filtered.map((client) => {
              const statut = getClientStatut(client);
              return (
                <tr key={client.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67c52] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(client.prenom, client.nom)}
                      </div>
                      <div>
                        <Link href={`/clients/${client.id}`} className="font-semibold text-[#1a1a1a] hover:text-[#c8956c] transition-colors">
                          {client.prenom} {client.nom}
                        </Link>
                        {client.email && <p className="text-xs text-[#888888]">{client.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#888888] text-xs">{client.cin}</td>
                  <td className="px-4 py-3 text-[#888888]">{client.telephone}</td>
                  <td className="px-4 py-3 text-[#888888]">{client.ville || "—"}</td>
                  <td className="px-4 py-3 text-[#888888]">{client.profession || "—"}</td>
                  <td className="px-4 py-3">
                    {client.source && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-[#888888]">
                        {client.source}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {statut && <StatutBadge statut={statut} />}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="text-[#c8956c] hover:underline text-xs">
                      Voir →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[#aaaaaa] text-sm">
            Aucun client trouvé
          </div>
        )}
      </div>
    </div>
  );
}
