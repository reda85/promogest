"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VILLES } from "@/lib/constants";
import { getCurrentRole } from "@/lib/role-store";
import { ROLE_PERMISSIONS, ROLE_LABELS } from "@/lib/roles";
import { getOrgId, createProjet } from "@/lib/supabase/db";
import Link from "next/link";

export default function NouveauProjetPage() {
  const router = useRouter();
  const [role] = useState(getCurrentRole);
  const perms = ROLE_PERMISSIONS[role];

  // Form state
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [adresse, setAdresse] = useState("");
  const [consistance, setConsistance] = useState("");
  const [superficieTerrain, setSuperficieTerrain] = useState("");
  const [titreFoncier, setTitreFoncier] = useState("");
  const [datePermis, setDatePermis] = useState("");
  const [dateLivraison, setDateLivraison] = useState("");
  const [maitreOuvrage, setMaitreOuvrage] = useState("");
  const [architecte, setArchitecte] = useState("");
  const [bet, setBet] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!nom.trim() && !!ville && !!quartier.trim() && !submitting;

  // Block access for roles that cannot create projects
  if (!perms.canCreateProject) {
    const roleCfg = ROLE_LABELS[role];
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-stone-100">
          <Lock className="h-8 w-8 text-[#888888]" />
        </div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Accès restreint</h2>
        <p className="text-sm text-[#888888]">
          Le rôle{" "}
          <span className="font-semibold" style={{ color: roleCfg.color }}>
            {roleCfg.name}
          </span>{" "}
          ne peut pas créer de nouveaux projets.
        </p>
        <Button variant="outline" asChild>
          <Link href="/projets">Retour aux projets</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const orgId = await getOrgId();
      if (!orgId) throw new Error("Organisation introuvable");

      const projet = await createProjet({
        org_id: orgId,
        nom: nom.trim(),
        ville,
        quartier: quartier.trim(),
        adresse: adresse.trim() || undefined,
        consistance: consistance.trim() || undefined,
        superficie_terrain: superficieTerrain.trim() || undefined,
        titre_foncier: titreFoncier.trim() || undefined,
        maitre_ouvrage: maitreOuvrage.trim() || undefined,
        architecte: architecte.trim() || undefined,
        bet: bet.trim() || undefined,
        date_permis_construire: datePermis || undefined,
        date_livraison_prevue: dateLivraison || undefined,
        description: description.trim() || undefined,
      });

      router.push(`/projets/${projet.id}`);
    } catch {
      alert("Erreur lors de la création du projet. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Nouveau Projet
        </h1>
        <p className="text-sm text-[#888888]">Créer un nouveau projet immobilier</p>
      </div>

      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 space-y-6">
        <FormSection title="Informations générales" icon={Building2}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nom du projet" required className="col-span-2">
              <Input
                placeholder="Résidence Al Andalous"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </FormField>
            <FormField label="Ville" required>
              <Select value={ville} onValueChange={setVille}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {VILLES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Quartier" required>
              <Input
                placeholder="Ain Sebaa"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
              />
            </FormField>
            <FormField label="Adresse" className="col-span-2">
              <Input
                placeholder="Boulevard Mohammed VI"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </FormField>
            <FormField label="Consistance">
              <Input
                placeholder="R+7, 2SS"
                value={consistance}
                onChange={(e) => setConsistance(e.target.value)}
              />
            </FormField>
            <FormField label="Superficie terrain">
              <Input
                placeholder="4500 m²"
                value={superficieTerrain}
                onChange={(e) => setSuperficieTerrain(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Informations légales" icon={FileText}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Titre foncier">
              <Input
                placeholder="TF 12345/C"
                value={titreFoncier}
                onChange={(e) => setTitreFoncier(e.target.value)}
              />
            </FormField>
            <FormField label="Date permis de construire">
              <Input
                type="date"
                value={datePermis}
                onChange={(e) => setDatePermis(e.target.value)}
              />
            </FormField>
            <FormField label="Date livraison prévue">
              <Input
                type="date"
                value={dateLivraison}
                onChange={(e) => setDateLivraison(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Intervenants" icon={Users}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Maître d'ouvrage">
              <Input
                placeholder="Groupe Atlas"
                value={maitreOuvrage}
                onChange={(e) => setMaitreOuvrage(e.target.value)}
              />
            </FormField>
            <FormField label="Architecte">
              <Input
                placeholder="M. Benali"
                value={architecte}
                onChange={(e) => setArchitecte(e.target.value)}
              />
            </FormField>
            <FormField label="Bureau d'études (BET)">
              <Input
                placeholder="BET Ingénieurs"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Description" icon={FileText}>
          <FormField label="Description du projet">
            <Textarea
              placeholder="Description générale du projet..."
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Création..." : "Créer le projet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
