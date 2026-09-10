"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Briefcase, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SITUATIONS_FAMILIALES, SOURCES_CLIENT, VILLES } from "@/lib/constants";
import { createClient, getOrgId } from "@/lib/supabase/db";

export default function NouveauClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [cin, setCin] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [situationFamiliale, setSituationFamiliale] = useState("");
  const [source, setSource] = useState("");
  const [telephone, setTelephone] = useState("");
  const [telephone2, setTelephone2] = useState("");
  const [email, setEmail] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [profession, setProfession] = useState("");
  const [employeur, setEmployeur] = useState("");
  const [revenuMensuel, setRevenuMensuel] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = !!prenom && !!nom && !!cin && !!telephone && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const org_id = await getOrgId();
      if (!org_id) throw new Error("Organisation introuvable");
      const newClient = await createClient({
        org_id,
        prenom,
        nom,
        cin,
        telephone,
        telephone_2:         telephone2 || undefined,
        email:               email || undefined,
        ville:               ville || undefined,
        adresse:             adresse || undefined,
        date_naissance:      dateNaissance || undefined,
        situation_familiale: situationFamiliale || undefined,
        profession:          profession || undefined,
        employeur:           employeur || undefined,
        revenu_mensuel:      revenuMensuel ? parseFloat(revenuMensuel) : undefined,
        source:              source || undefined,
        notes:               notes || undefined,
      });
      router.push(`/clients/${newClient.id}`);
    } catch {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Nouveau Client
        </h1>
        <p className="text-sm text-[#888888]">Enregistrer un nouveau prospect ou client</p>
      </div>

      <div className="rounded-2xl border border-[#e8e6e1] bg-white p-6 space-y-6">
        <FormSection title="Identité" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prénom" required>
              <Input
                placeholder="Mohammed"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </FormField>
            <FormField label="Nom" required>
              <Input
                placeholder="Benali"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </FormField>
            <FormField label="CIN" required>
              <Input
                placeholder="AB123456"
                className="font-mono"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
              />
            </FormField>
            <FormField label="Date de naissance">
              <Input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
              />
            </FormField>
            <FormField label="Situation familiale">
              <Select value={situationFamiliale} onValueChange={setSituationFamiliale}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {SITUATIONS_FAMILIALES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Source">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Comment a-t-il connu?" /></SelectTrigger>
                <SelectContent>
                  {SOURCES_CLIENT.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Contact" icon={Phone}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Téléphone principal" required>
              <Input
                placeholder="0612345678"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </FormField>
            <FormField label="Téléphone secondaire">
              <Input
                placeholder="0661234567"
                type="tel"
                value={telephone2}
                onChange={(e) => setTelephone2(e.target.value)}
              />
            </FormField>
            <FormField label="Email" className="col-span-2">
              <Input
                placeholder="client@exemple.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField label="Ville">
              <Select value={ville} onValueChange={setVille}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {VILLES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Adresse">
              <Input
                placeholder="Rue, Quartier..."
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Situation professionnelle" icon={Briefcase}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Profession">
              <Input
                placeholder="Ingénieur"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </FormField>
            <FormField label="Employeur">
              <Input
                placeholder="Société XYZ"
                value={employeur}
                onChange={(e) => setEmployeur(e.target.value)}
              />
            </FormField>
            <FormField label="Revenu mensuel (MAD)">
              <Input
                placeholder="25000"
                type="number"
                value={revenuMensuel}
                onChange={(e) => setRevenuMensuel(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Notes" icon={CreditCard}>
          <FormField label="Notes internes">
            <Textarea
              placeholder="Remarques, préférences client..."
              className="min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Enregistrement..." : "Enregistrer le client"}
          </Button>
        </div>
      </div>
    </div>
  );
}
