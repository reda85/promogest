"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Phone, Mail, MapPin, Briefcase, User, CreditCard, Building2 } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { fetchClient, type ClientDetail } from "@/lib/supabase/db";
import { StatutBadge } from "@/components/shared/StatutBadge";
import { TachesPanel } from "@/components/shared/TachesPanel";
import { formatMAD, formatDate, getInitials } from "@/lib/utils";

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient(clientId)
      .then(setClient)
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <LoadingSpinner label="Chargement du client…" />;
  if (!client) return (
    <div className="text-center py-20 text-[#aaaaaa]">Client introuvable</div>
  );

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/clients" className="hover:text-[#1a1a1a]">Clients</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">{client.prenom} {client.nom}</span>
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Profile */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#c8956c] to-[#a67c52] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {getInitials(client.prenom, client.nom)}
            </div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">{client.prenom} {client.nom}</h1>
            <p className="text-sm font-mono text-[#888888] mt-0.5">{client.cin}</p>
            {client.source && (
              <span className="inline-block mt-2 rounded-full bg-[#c8956c]/10 px-3 py-1 text-xs font-medium text-[#c8956c]">
                {client.source}
              </span>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#888888]">Contact</h3>
            {[
              { icon: Phone, label: client.telephone },
              { icon: Phone, label: client.telephone_2, muted: true },
              { icon: Mail, label: client.email },
              { icon: MapPin, label: client.ville },
            ].filter((i) => i.label).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-[#c8956c] flex-shrink-0" />
                <span className={`text-sm ${item.muted ? "text-[#aaaaaa]" : "text-[#1a1a1a]"}`}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Profil */}
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#888888]">Profil</h3>
            {[
              { icon: User,       label: "Situation",       value: client.situation_familiale },
              { icon: Briefcase,  label: "Profession",      value: client.profession },
              { icon: Building2,  label: "Employeur",       value: client.employeur },
              { icon: CreditCard, label: "Revenu mensuel",  value: client.revenu_mensuel ? formatMAD(client.revenu_mensuel) : null },
            ].filter((i) => i.value).map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <item.icon className="h-4 w-4 text-[#888888] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-[#aaaaaa]">{item.label}</p>
                  <p className="text-sm text-[#1a1a1a]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Reservations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#1a1a1a]">
                Réservations ({client.reservations.length})
              </h3>
              <Link href="/reservations/nouvelle" className="text-sm text-[#c8956c] hover:underline">
                + Nouvelle réservation
              </Link>
            </div>

            {client.reservations.length === 0 ? (
              <p className="text-sm text-[#aaaaaa] text-center py-8">Aucune réservation</p>
            ) : (
              <div className="space-y-4">
                {client.reservations.map((res) => {
                  const unite   = res.unite;
                  const immeuble = res.unite?.immeuble;
                  const projet  = res.unite?.immeuble?.projet;
                  return (
                    <div key={res.id} className="rounded-xl border border-[#e8e6e1] p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-[#1a1a1a]">
                            {unite ? `Unité ${unite.numero} — ${immeuble?.nom ?? ""}` : res.unite_id}
                          </p>
                          {projet && <p className="text-xs text-[#888888]">{projet.nom}</p>}
                        </div>
                        <StatutBadge statut={res.statut} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-[#aaaaaa]">Date réservation</p>
                          <p className="text-sm font-medium">{formatDate(res.date_reservation)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#aaaaaa]">Avance versée</p>
                          <p className="text-sm font-medium">{formatMAD(res.montant_avance)}</p>
                        </div>
                        {res.mode_paiement && (
                          <div>
                            <p className="text-[10px] text-[#aaaaaa]">Mode paiement</p>
                            <p className="text-sm font-medium">{res.mode_paiement}</p>
                          </div>
                        )}
                        {res.banque && (
                          <div>
                            <p className="text-[10px] text-[#aaaaaa]">Banque</p>
                            <p className="text-sm font-medium">{res.banque}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#e8e6e1]">
                        <Link href={`/reservations/${res.id}`} className="text-xs text-[#c8956c] hover:underline">
                          Voir la réservation →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <TachesPanel context={{ client_id: client.id }} />

          {client.notes && (
            <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#888888] mb-2">Notes</h3>
              <p className="text-sm text-[#1a1a1a]">{client.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
