"use client";
/**
 * app/auth/setup/page.tsx
 *
 * Landing page after email confirmation.
 * Reads the pending profile from localStorage (saved by the register page),
 * calls create_org_and_profile, then redirects to /dashboard.
 * If no pending profile exists, shows a minimal form to finish setup.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";

export default function SetupPage() {
  const router = useRouter();
  const [autoSetup, setAutoSetup] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state (used only when no pending_profile in localStorage)
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [orgNom, setOrgNom] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem("pending_profile");
    if (!pending) {
      setAutoSetup(false);
      return;
    }

    // Auto-complete setup with the data saved at registration
    const { prenom, nom, org_nom } = JSON.parse(pending) as {
      prenom: string;
      nom: string;
      org_nom: string;
    };

    const supabase = createClient();
    supabase
      .rpc("create_org_and_profile", {
        p_prenom: prenom,
        p_nom: nom,
        p_org_nom: org_nom,
      })
      .then(({ error }) => {
        if (error) {
          setError("Erreur lors de la configuration : " + error.message);
          setAutoSetup(false);
        } else {
          localStorage.removeItem("pending_profile");
          router.replace("/dashboard");
        }
      });
  }, [router]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("create_org_and_profile", {
      p_prenom: prenom.trim(),
      p_nom: nom.trim(),
      p_org_nom: orgNom.trim(),
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      router.replace("/dashboard");
    }
  };

  if (autoSetup) {
    return <LoadingSpinner label="Configuration de votre espace…" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8956c] to-[#a67c52] mb-3">
            <Home className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">
            PromoGest
          </h1>
          <p className="text-sm text-[#888888] mt-1">Finaliser votre inscription</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Configuration de votre organisation</h2>
          <p className="text-sm text-[#888888] mb-6">
            Renseignez quelques informations pour configurer votre espace.
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prénom</Label>
                <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Mohammed" required />
              </div>
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Benali" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Organisation</Label>
              <Input value={orgNom} onChange={(e) => setOrgNom(e.target.value)} placeholder="Groupe Atlas Immobilier" required />
            </div>
            <Button variant="primary" type="submit" className="w-full" disabled={submitting || !prenom || !nom || !orgNom}>
              {submitting ? "Configuration…" : "Terminer l'inscription"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
