"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, ListTodo, ChevronRight, Building2, FileText, User,
} from "lucide-react";
import {
  fetchTaches, fetchClients, toggleTache, deleteTache,
  type EnrichedTache,
} from "@/lib/supabase/db";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TacheFormDialog } from "@/components/shared/TacheFormDialog";
import { TYPES_TACHE, PRIORITES_TACHE } from "@/lib/constants";
import {
  TACHE_TYPE_ICON, TACHE_STATUT_CFG, tacheStatut, formatEcheance,
  type TacheStatut,
} from "@/lib/taches";

type Tab = "EN_RETARD" | "AUJOURDHUI" | "A_VENIR" | "TERMINEE" | "TOUTES";

const TABS: { key: Tab; label: string }[] = [
  { key: "EN_RETARD",  label: "En retard" },
  { key: "AUJOURDHUI", label: "Aujourd'hui" },
  { key: "A_VENIR",    label: "À venir" },
  { key: "TERMINEE",   label: "Terminées" },
  { key: "TOUTES",     label: "Toutes" },
];

export default function TachesPage() {
  const [taches, setTaches] = useState<EnrichedTache[]>([]);
  const [clients, setClients] = useState<{ id: string; prenom: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("EN_RETARD");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedTache | null>(null);

  const load = useCallback(() => {
    fetchTaches()
      .then(setTaches)
      .catch(() => setTaches([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    fetchClients()
      .then((cs) => setClients(cs.map((c) => ({ id: c.id, prenom: c.prenom, nom: c.nom }))))
      .catch(() => setClients([]));
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<TacheStatut, number> = { EN_RETARD: 0, AUJOURDHUI: 0, A_VENIR: 0, TERMINEE: 0 };
    for (const t of taches) c[tacheStatut(t)]++;
    return c;
  }, [taches]);

  const handleToggle = async (t: EnrichedTache) => {
    const next = !t.terminee;
    setTaches((prev) => prev.map((x) => x.id === t.id
      ? { ...x, terminee: next, date_realisation: next ? new Date().toISOString() : undefined }
      : x));
    try { await toggleTache(t.id, next); } finally { load(); }
  };

  const handleDelete = async (id: string) => {
    setTaches((prev) => prev.filter((x) => x.id !== id));
    try { await deleteTache(id); } catch { load(); }
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (t: EnrichedTache) => { setEditing(t); setDialogOpen(true); };

  if (loading) return <LoadingSpinner label="Chargement des tâches…" />;

  const filtered = taches.filter((t) => {
    if (tab === "TOUTES") return true;
    return tacheStatut(t) === tab;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tâches</h1>
          <p className="text-sm text-[#888888] mt-0.5">
            Appels, rendez-vous et relances planifiés pour votre équipe.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c8956c] to-[#a67c52] px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(["EN_RETARD", "AUJOURDHUI", "A_VENIR", "TERMINEE"] as TacheStatut[]).map((s) => {
          const cfg = TACHE_STATUT_CFG[s];
          return (
            <div key={s} className="rounded-2xl border border-[#e8e6e1] bg-white p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: cfg.color }}>{counts[s]}</p>
              <p className="text-xs text-[#888888] mt-0.5">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1 w-fit">
        {TABS.map(({ key, label }) => {
          const n = key === "TOUTES" ? taches.length
            : key === "TERMINEE" ? counts.TERMINEE
            : counts[key as TacheStatut];
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === key ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#888888] hover:text-[#1a1a1a]"
              }`}
            >
              {label}
              {n > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === key ? "bg-stone-100" : "bg-stone-200"
                }`}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="h-10 w-10 text-stone-200 mb-3" />
          <p className="text-sm text-[#aaaaaa]">Aucune tâche dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TacheCard
              key={t.id}
              tache={t}
              onToggle={() => handleToggle(t)}
              onEdit={() => openEdit(t)}
              onDelete={() => handleDelete(t.id)}
            />
          ))}
        </div>
      )}

      <TacheFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tache={editing}
        clients={clients}
        onSaved={load}
      />
    </div>
  );
}

function TacheCard({
  tache, onToggle, onEdit, onDelete,
}: {
  tache: EnrichedTache;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tCfg = TYPES_TACHE[tache.type];
  const Icon = TACHE_TYPE_ICON[tache.type];
  const statut = tacheStatut(tache);
  const sCfg = TACHE_STATUT_CFG[statut];
  const pCfg = PRIORITES_TACHE[tache.priorite];
  const projet = tache.projet;

  return (
    <div
      className={`group rounded-2xl border bg-white p-4 transition-colors ${
        statut === "EN_RETARD" ? "border-red-200" : "border-[#e8e6e1] hover:bg-stone-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          aria-label={tache.terminee ? "Rouvrir la tâche" : "Marquer comme terminée"}
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          style={{
            borderColor: tache.terminee ? "#10b981" : "#d1d5db",
            backgroundColor: tache.terminee ? "#10b981" : "transparent",
          }}
        >
          {tache.terminee && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: tCfg.bg, color: tCfg.text }}
            >
              <Icon className="h-2.5 w-2.5" />
              {tCfg.label}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: sCfg.bg, color: sCfg.color }}
            >
              {tache.terminee ? "Terminée" : sCfg.label}
            </span>
            {tache.priorite !== "NORMALE" && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: pCfg.bg, color: pCfg.color }}
              >
                Priorité {pCfg.label.toLowerCase()}
              </span>
            )}
            <span className="text-[11px] text-[#aaaaaa]">{formatEcheance(tache.echeance)}</span>
          </div>

          <p className={`text-sm mt-1.5 ${tache.terminee ? "text-[#aaaaaa] line-through" : "text-[#1a1a1a] font-medium"}`}>
            {tache.titre}
          </p>
          {tache.description && (
            <p className="text-xs text-[#888888] mt-0.5">{tache.description}</p>
          )}

          {/* Liens */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {tache.client && (
              <Link
                href={`/clients/${tache.client.id}`}
                className="flex items-center gap-1 text-[11px] text-[#888888] hover:text-[#c8956c] transition-colors"
              >
                <User className="h-3 w-3" />
                {tache.client.prenom} {tache.client.nom}
              </Link>
            )}
            {tache.reservation && (
              <Link
                href={`/reservations/${tache.reservation.id}`}
                className="flex items-center gap-1 text-[11px] text-[#888888] hover:text-[#c8956c] transition-colors"
              >
                <FileText className="h-3 w-3" />
                Réservation{tache.reservation.unite ? ` · Unité ${tache.reservation.unite.numero}` : ""}
              </Link>
            )}
            {projet && (
              <Link
                href={`/projets/${projet.id}`}
                className="flex items-center gap-1 text-[11px] text-[#888888] hover:text-[#c8956c] transition-colors"
              >
                <Building2 className="h-3 w-3" />
                {projet.nom}
              </Link>
            )}
            {tache.agent && (
              <span className="flex items-center gap-1 text-[11px] text-[#aaaaaa]">
                <ChevronRight className="h-3 w-3" />
                {tache.agent}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-lg p-1.5 text-[#aaaaaa] hover:bg-stone-100 hover:text-[#1a1a1a] transition-colors" aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1.5 text-[#aaaaaa] hover:bg-red-50 hover:text-red-500 transition-colors" aria-label="Supprimer">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
