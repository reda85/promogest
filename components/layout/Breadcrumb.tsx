"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const pathLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  projets: "Projets",
  clients: "Clients",
  reservations: "Réservations",
  pipeline: "Pipeline",
  taches: "Tâches",
  notaire: "Gestion Notaire",
  nouveau: "Nouveau",
  nouvelle: "Nouvelle",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = pathLabels[seg] || seg;
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#aaaaaa]" />}
          {crumb.isLast ? (
            <span className="font-medium text-[#1a1a1a]">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-[#888888] hover:text-[#1a1a1a] transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
