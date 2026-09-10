"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Pencil, Mail, Phone, MapPin } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { NotaireFormDialog } from "@/components/shared/NotaireFormDialog";
import { fetchNotaires } from "@/lib/supabase/db";
import { getInitials } from "@/lib/utils";
import type { Notaire } from "@/lib/types";

export default function NotairesPage() {
  const [notaires, setNotaires] = useState<Notaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNotaire, setEditNotaire] = useState<Notaire | undefined>(undefined);

  useEffect(() => {
    fetchNotaires()
      .then(setNotaires)
      .catch(() => setNotaires([]))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditNotaire(undefined);
    setDialogOpen(true);
  }

  function openEdit(n: Notaire) {
    setEditNotaire(n);
    setDialogOpen(true);
  }

  function handleSuccess(notaire: Notaire) {
    setNotaires((prev) => {
      const exists = prev.find((n) => n.id === notaire.id);
      if (exists) {
        return prev.map((n) => (n.id === notaire.id ? notaire : n));
      }
      return [...prev, notaire].sort((a, b) => a.nom.localeCompare(b.nom));
    });
  }

  if (loading) return <LoadingSpinner label="Chargement des notaires…" />;

  return (
    <div className="space-y-6">
      {/* Dialog */}
      <NotaireFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        notaire={editNotaire}
        onSuccess={handleSuccess}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#888888]">
        <Link href="/notaire" className="hover:text-[#1a1a1a]">Gestion Notaire</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#1a1a1a] font-medium">Répertoire des notaires</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Notaires
          </h1>
          <p className="text-sm text-[#888888] mt-0.5">{notaires.length} notaire{notaires.length !== 1 ? "s" : ""} enregistré{notaires.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-[#c8956c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#a67c52] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau notaire
        </button>
      </div>

      {/* List */}
      {notaires.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e6e1] bg-white py-16 text-center text-[#aaaaaa] text-sm">
          Aucun notaire enregistré —{" "}
          <button onClick={openCreate} className="text-[#c8956c] hover:underline font-medium">
            ajouter le premier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notaires.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl border border-[#e8e6e1] bg-white p-5 flex items-start gap-4 group hover:shadow-md hover:border-[#c8956c]/30 transition-all"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {getInitials("", n.nom)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1a1a1a] truncate">{n.nom}</p>
                <div className="mt-1.5 space-y-1">
                  {n.ville && (
                    <p className="flex items-center gap-1.5 text-xs text-[#888888]">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {n.ville}
                    </p>
                  )}
                  {n.telephone && (
                    <p className="flex items-center gap-1.5 text-xs text-[#888888]">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {n.telephone}
                    </p>
                  )}
                  {n.email && (
                    <p className="flex items-center gap-1.5 text-xs text-[#888888] truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{n.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={() => openEdit(n)}
                className="rounded-lg border border-[#e8e6e1] p-1.5 text-[#aaaaaa] hover:text-[#1a1a1a] hover:border-[#c8956c]/40 transition-colors flex-shrink-0"
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
