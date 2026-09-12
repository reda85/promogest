import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2, TrendingUp, Users, Scale, CheckSquare, ShieldCheck,
  ArrowRight, Check, GitBranch, Layers, BellRing,
} from "lucide-react";
import { LogoMark } from "@/components/shared/Logo";

export const metadata: Metadata = {
  title: "PromoGest — CRM pour promoteurs immobiliers",
  description:
    "Pilotez vos projets, votre pipeline commercial, vos clients et vos dossiers notaire sur une seule plateforme.",
};

const FEATURES = [
  {
    icon: Building2,
    title: "Projets & unités",
    text: "Structurez vos programmes : groupes d'habitation, immeubles, unités — prix, surfaces, statut de chaque lot.",
  },
  {
    icon: TrendingUp,
    title: "Pipeline commercial",
    text: "Un kanban glisser-déposer avec un workflow de statuts configurable, du premier contact à la vente.",
  },
  {
    icon: Users,
    title: "CRM clients",
    text: "Fiches complètes : coordonnées, situation, financement, source — et l'historique de chaque réservation.",
  },
  {
    icon: Scale,
    title: "Gestion notaire",
    text: "Dossiers d'acte, checklist documentaire, suivi des frais et workflow d'envoi jusqu'à la signature.",
  },
  {
    icon: CheckSquare,
    title: "Tâches & activités",
    text: "Planifiez appels, rendez-vous et relances. Un indicateur de suivi signale les deals sans activité.",
  },
  {
    icon: BellRing,
    title: "Exceptions & validation",
    text: "Les demandes de remise de prix ou d'avance passent par une validation admin tracée.",
  },
];

const FLOW = ["Disponible", "Option", "Réservé", "Compromis", "Chez notaire", "Vendu"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1a1a1a]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[#e8e6e1] bg-[#f8f7f4]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="text-sm font-bold">PromoGest</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-[#555] md:flex">
            <a href="#fonctionnalites" className="hover:text-[#1a1a1a] transition-colors">Fonctionnalités</a>
            <a href="#workflow" className="hover:text-[#1a1a1a] transition-colors">Workflow</a>
            <a href="#securite" className="hover:text-[#1a1a1a] transition-colors">Sécurité</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#555] hover:bg-stone-200/60 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] px-3.5 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              Ouvrir l&apos;app
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-10 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e6e1] bg-white px-3 py-1 text-xs font-medium text-[#888]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9773f]" />
              CRM immobilier — pensé pour le marché marocain
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              La commercialisation de vos programmes,{" "}
              <span className="bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] bg-clip-text text-transparent">
                de bout en bout
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#555]">
              Projets, unités, pipeline commercial, CRM clients, dossiers notaire et
              suivi des tâches — une seule plateforme, multi-organisation et sécurisée.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              >
                Créer un compte
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e8e6e1] bg-white px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-stone-50"
              >
                Voir une démo
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#888]">
              {["Multi-organisation", "Rôles & permissions", "Row-level security"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#c9773f]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* App preview mock */}
          <div className="relative">
            <div className="rounded-2xl border border-[#e8e6e1] bg-white shadow-[0_20px_60px_-20px_rgba(26,35,50,0.25)]">
              <div className="flex items-center gap-1.5 border-b border-[#e8e6e1] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]/70" />
                <span className="ml-3 text-[11px] text-[#aaa]">promogest.app / pipeline</span>
              </div>
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { k: "Unités vendues", v: "128", c: "#10b981" },
                    { k: "En cours", v: "43", c: "#3b82f6" },
                    { k: "CA réalisé", v: "94 M", c: "#c9773f" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-xl border border-[#e8e6e1] p-2.5">
                      <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
                      <p className="text-[10px] text-[#888]">{s.k}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { t: "Option", c: "#f59e0b", n: 3 },
                    { t: "Réservé", c: "#3b82f6", n: 2 },
                    { t: "Compromis", c: "#8b5cf6", n: 2 },
                  ].map((col) => (
                    <div key={col.t} className="rounded-xl bg-stone-50 p-2">
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.c }} />
                        <span className="text-[10px] font-semibold text-[#555]">{col.t}</span>
                      </div>
                      <div className="space-y-1.5">
                        {Array.from({ length: col.n }).map((_, i) => (
                          <div key={i} className="rounded-lg border border-[#e8e6e1] bg-white p-1.5">
                            <div className="h-1.5 w-3/4 rounded bg-stone-200" />
                            <div className="mt-1 h-1.5 w-1/2 rounded bg-stone-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Tout le cycle de vente immobilier
          </h2>
          <p className="mt-3 text-[#555]">
            Six modules qui couvrent la promotion de A à Z, sans tableur ni double saisie.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#e8e6e1] bg-white p-5 transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(26,35,50,0.2)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9773f]/10">
                <f.icon className="h-5 w-5 text-[#c9773f]" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#666]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────────────────── */}
      <section id="workflow" className="border-y border-[#e8e6e1] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c9773f]">
            <GitBranch className="h-4 w-4" />
            Workflow configurable
          </div>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
            Chaque unité suit un parcours clair — que vous adaptez
          </h2>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {FLOW.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-[#e8e6e1] bg-[#f8f7f4] px-3.5 py-1.5 text-sm font-medium">
                  {step}
                </span>
                {i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-[#ccc]" />}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-xl text-sm text-[#666]">
            Les transitions autorisées sont paramétrables par organisation. Toute demande
            de dérogation (prix, avance) passe par un circuit de validation.
          </p>
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────────────── */}
      <section id="securite" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#c9773f]">
              <ShieldCheck className="h-4 w-4" />
              Architecture
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Multi-organisation, cloisonné par conception
            </h2>
            <p className="mt-3 text-[#555]">
              Chaque promoteur ne voit que ses données. Le cloisonnement est appliqué
              au niveau de la base (row-level security), pas seulement dans l&apos;interface.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Layers, t: "Multi-tenant", d: "Organisations isolées, une seule instance." },
              { icon: ShieldCheck, t: "RLS Supabase", d: "Politiques d'accès au niveau des lignes." },
              { icon: Users, t: "Rôles", d: "Admin, commercial, ADV — accès par écran." },
              { icon: CheckSquare, t: "Traçabilité", d: "Historique des statuts et des validations." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-[#e8e6e1] bg-white p-5">
                <c.icon className="h-5 w-5 text-[#c9773f]" />
                <h3 className="mt-3 text-sm font-semibold">{c.t}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#777]">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2332] to-[#0f1923] px-8 py-14 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Prêt à digitaliser votre commercialisation ?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
            Créez votre organisation en quelques minutes et importez votre premier programme.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c9773f] to-[#9c5a2e] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              Créer un compte
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e8e6e1]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-[#999] sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark className="h-5 w-5 rounded" />
            <span>PromoGest — CRM immobilier</span>
          </div>
          <p>© {new Date().getFullYear()} — Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
