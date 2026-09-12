"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ListTodo } from "lucide-react";
import {
  fetchTachesFor, toggleTache, deleteTache,
  type EnrichedTache, type TacheLink,
} from "@/lib/supabase/db";
import { TYPES_TACHE, PRIORITES_TACHE } from "@/lib/constants";
import { TACHE_TYPE_ICON, TACHE_STATUT_CFG, tacheStatut, formatEcheance } from "@/lib/taches";
import { TacheFormDialog } from "@/components/shared/TacheFormDialog";

interface Props {
  /** Rattachement — au moins une clé. Toutes les tâches créées ici en héritent. */
  context: TacheLink;
  title?: string;
}

export function TachesPanel({ context, title = "Tâches" }: Props) {
  const [taches, setTaches] = useState<EnrichedTache[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedTache | null>(null);

  const load = useCallback(() => {
    fetchTachesFor(context)
      .then(setTaches)
      .catch(() => setTaches([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.client_id, context.reservation_id, context.projet_id]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (t: EnrichedTache) => {
    const next = !t.terminee;
    setTaches((prev) => prev.map((x) => x.id === t.id
      ? { ...x, terminee: next, date_realisation: next ? new Date().toISOString() : undefined }
      : x));
    try {
      await toggleTache(t.id, next);
      load();
    } catch {
      load();
    }
  };

  const handleDelete = async (id: string) => {
    setTaches((prev) => prev.filter((x) => x.id !== id));
    try { await deleteTache(id); } catch { load(); }
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (t: EnrichedTache) => { setEditing(t); setDialogOpen(true); };

  const enCours = taches.filter((t) => !t.terminee);
  const faites  = taches.filter((t) => t.terminee);

  return (
    <div className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2">
          {title}
          {enCours.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c9773f]/15 text-[11px] font-bold text-[#c9773f] px-1.5">
              {enCours.length}
            </span>
          )}
        </h3>
        <button
          onClick={openNew}
          className="flex items-center gap-1 text-sm text-[#c9773f] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#aaaaaa] text-center py-6">Chargement…</p>
      ) : taches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ListTodo className="h-8 w-8 text-stone-200 mb-2" />
          <p className="text-sm text-[#aaaaaa]">Aucune tâche planifiée</p>
          <button onClick={openNew} className="mt-2 text-xs font-semibold text-[#c9773f] hover:underline">
            Planifier la première tâche
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {[...enCours, ...faites].map((t) => (
            <TacheRow
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
        lockedContext={context}
        onSaved={load}
      />
    </div>
  );
}

function TacheRow({
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

  return (
    <div
      className={`group rounded-xl border p-3 transition-colors ${
        tache.terminee ? "border-[#e8e6e1] bg-stone-50/60" : "border-[#e8e6e1] hover:bg-stone-50"
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
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: tCfg.bg, color: tCfg.text }}
            >
              <Icon className="h-2.5 w-2.5" />
              {tCfg.label}
            </span>
            {tache.priorite === "HAUTE" && !tache.terminee && (
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pCfg.color }} title="Priorité haute" />
            )}
          </div>
          <p className={`text-sm mt-1 ${tache.terminee ? "text-[#aaaaaa] line-through" : "text-[#1a1a1a] font-medium"}`}>
            {tache.titre}
          </p>
          {tache.description && !tache.terminee && (
            <p className="text-xs text-[#888888] mt-0.5 line-clamp-2">{tache.description}</p>
          )}
          <p className="text-[11px] font-semibold mt-1" style={{ color: tache.terminee ? "#aaaaaa" : sCfg.color }}>
            {tache.terminee ? "Terminée" : sCfg.label} · {formatEcheance(tache.echeance)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-lg p-1 text-[#aaaaaa] hover:bg-stone-100 hover:text-[#1a1a1a] transition-colors" aria-label="Modifier">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-1 text-[#aaaaaa] hover:bg-red-50 hover:text-red-500 transition-colors" aria-label="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
