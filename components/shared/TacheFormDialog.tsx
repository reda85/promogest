"use client";
import { useEffect, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TYPES_TACHE, PRIORITES_TACHE } from "@/lib/constants";
import { TACHE_TYPE_ICON, splitEcheance, joinEcheance } from "@/lib/taches";
import { createTache, updateTache, type EnrichedTache, type TacheLink } from "@/lib/supabase/db";
import { getCurrentRole } from "@/lib/role-store";
import { ROLE_LABELS } from "@/lib/roles";
import { type TypeTache, type PrioriteTache } from "@/lib/types";

const TYPE_KEYS = Object.keys(TYPES_TACHE) as TypeTache[];
const PRIORITE_KEYS = Object.keys(PRIORITES_TACHE) as PrioriteTache[];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tâche à modifier (mode édition). */
  tache?: EnrichedTache | null;
  /** Rattachement figé imposé par le contexte (page client, réservation…). */
  lockedContext?: TacheLink;
  /** Liste de clients pour le sélecteur (mode création sans contexte figé). */
  clients?: { id: string; prenom: string; nom: string }[];
  onSaved: () => void;
}

export function TacheFormDialog({
  open, onOpenChange, tache, lockedContext, clients, onSaved,
}: Props) {
  const isEdit = !!tache;
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeTache>("APPEL");
  const [priorite, setPriorite] = useState<PrioriteTache>("NORMALE");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // (Ré)initialise le formulaire à chaque ouverture
  useEffect(() => {
    if (!open) return;
    const ech = splitEcheance(tache?.echeance);
    setTitre(tache?.titre ?? "");
    setType(tache?.type ?? "APPEL");
    setPriorite(tache?.priorite ?? "NORMALE");
    setDateStr(ech.date);
    setTimeStr(ech.time);
    setDescription(tache?.description ?? "");
    setClientId(tache?.client_id ?? lockedContext?.client_id ?? "");
    setError(null);
  }, [open, tache, lockedContext]);

  const canSubmit = titre.trim().length > 0 && dateStr.length > 0 && !saving;
  const showClientPicker = !lockedContext?.client_id && !lockedContext?.reservation_id && !!clients;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const roleShort = ROLE_LABELS[getCurrentRole()].short;
    const echeance = joinEcheance(dateStr, timeStr);
    try {
      if (isEdit && tache) {
        await updateTache(tache.id, {
          titre: titre.trim(),
          type,
          priorite,
          echeance,
          description: description.trim(),
          client_id: showClientPicker ? (clientId || null) : undefined,
        });
      } else {
        await createTache({
          titre: titre.trim(),
          type,
          priorite,
          echeance,
          description: description.trim() || undefined,
          agent: roleShort,
          client_id: lockedContext?.client_id ?? (clientId || null),
          reservation_id: lockedContext?.reservation_id ?? null,
          projet_id: lockedContext?.projet_id ?? null,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            Planifiez une activité — appel, rendez-vous, relance… — avec une échéance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1 block">
              Intitulé <span className="text-red-400">*</span>
            </label>
            <Input
              autoFocus
              placeholder="Ex : Rappeler le client pour le compromis"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1.5 block">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_KEYS.map((k) => {
                const cfg = TYPES_TACHE[k];
                const Icon = TACHE_TYPE_ICON[k];
                const active = type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className="flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-semibold transition-all"
                    style={{
                      borderColor: active ? cfg.color : "#e8e6e1",
                      color: active ? cfg.color : "#888888",
                      backgroundColor: active ? cfg.bg : "#ffffff",
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Échéance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">
                Date d&apos;échéance <span className="text-red-400">*</span>
              </label>
              <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Heure</label>
              <Input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} />
            </div>
          </div>

          {/* Priorité */}
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1.5 block">Priorité</label>
            <div className="flex gap-1.5">
              {PRIORITE_KEYS.map((k) => {
                const cfg = PRIORITES_TACHE[k];
                const active = priorite === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPriorite(k)}
                    className="flex-1 rounded-lg border-2 px-2 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      borderColor: active ? cfg.color : "#e8e6e1",
                      color: active ? cfg.color : "#888888",
                      backgroundColor: active ? cfg.bg : "#ffffff",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client (création globale uniquement) */}
          {showClientPicker && (
            <div>
              <label className="text-xs font-semibold text-[#888888] mb-1 block">Client lié (optionnel)</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-[#e8e6e1] bg-white px-3 text-sm text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#c9773f]/30 focus:border-[#c9773f] transition-colors"
              >
                <option value="">— Aucun —</option>
                {clients!.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#888888] mb-1 block">Note (optionnel)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails, contexte, points à aborder…"
              className="min-h-[70px]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            {isEdit ? "Enregistrer" : "Créer la tâche"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
