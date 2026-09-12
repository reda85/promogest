"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/shared/Logo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirmation_failed"
      ? "Le lien de confirmation a expiré. Veuillez vous réinscrire."
      : null
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : authError.message
      );
      setLoading(false);
      return;
    }
    // Hard navigate so the middleware picks up the new session cookie
    window.location.href = "/dashboard";
  };

  return (
    <div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1a1a1a] mb-6">Connexion</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse email</Label>
          <Input id="email" name="email" type="email" placeholder="vous@exemple.com" required autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaaaaa] hover:text-[#1a1a1a]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button variant="primary" type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="text-center text-sm text-[#888888] mt-4">
        Pas encore de compte?{" "}
        <Link href="/register" className="text-[#c9773f] hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <LogoMark className="h-14 w-14 rounded-2xl mb-3" />
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            PromoGest
          </h1>
          <p className="text-sm text-[#888888] mt-1">CRM Promoteurs Immobiliers</p>
        </div>

        <Suspense fallback={<div className="rounded-2xl border border-[#e8e6e1] bg-white p-8 shadow-sm h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-[#aaaaaa] mt-4">
          © 2024 PromoGest — Solution CRM pour le marché immobilier marocain
        </p>
      </div>
    </div>
  );
}
