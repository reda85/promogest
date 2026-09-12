"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/Logo";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const prenom  = (form.elements.namedItem("prenom")   as HTMLInputElement).value.trim();
    const nom     = (form.elements.namedItem("nom")      as HTMLInputElement).value.trim();
    const orgNom  = (form.elements.namedItem("org")      as HTMLInputElement).value.trim();
    const email   = (form.elements.namedItem("email")    as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const supabase = createClient();

    // 1. Create the Supabase auth user
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. If we have a session immediately (email confirmation disabled), create org + profile
    if (data.session) {
      const { error: rpcError } = await supabase.rpc("create_org_and_profile", {
        p_prenom:  prenom,
        p_nom:     nom,
        p_org_nom: orgNom,
      });
      if (rpcError) {
        setError("Compte créé mais erreur lors de la configuration : " + rpcError.message);
        setLoading(false);
        return;
      }
      // Hard navigate so the middleware picks up the new session cookie
      window.location.href = "/dashboard";
      return;
    }

    // 3. Email confirmation required — user must confirm then complete setup at first login
    setNeedsConfirmation(true);
    // Store pending profile data so the callback route can use it
    localStorage.setItem(
      "pending_profile",
      JSON.stringify({ prenom, nom, org_nom: orgNom })
    );
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <LogoMark className="h-14 w-14 rounded-2xl mb-3" />
          <h1 className="text-2xl font-bold">
            PromoGest
          </h1>
          <p className="text-sm text-[#888888] mt-1">Créer votre compte</p>
        </div>

        <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Inscription</h2>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="h-10 w-10 text-[#10b981]" />
              <p className="font-semibold text-[#1a1a1a]">Compte créé avec succès !</p>
              {needsConfirmation ? (
                <p className="text-sm text-[#888888]">
                  Vérifiez votre email et cliquez sur le lien de confirmation. Votre organisation
                  sera configurée automatiquement à votre première connexion.
                </p>
              ) : null}
              <Link href="/login" className="mt-2 text-sm text-[#c9773f] hover:underline">
                Se connecter →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input name="prenom" placeholder="Mohammed" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input name="nom" placeholder="Benali" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Organisation</Label>
                <Input name="org" placeholder="Groupe Atlas Immobilier" required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input name="email" type="email" placeholder="vous@exemple.com" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button variant="primary" type="submit" className="w-full" disabled={loading}>
                {loading ? "Création..." : "Créer le compte"}
              </Button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-[#888888] mt-4">
              Déjà un compte?{" "}
              <Link href="/login" className="text-[#c9773f] hover:underline">
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
