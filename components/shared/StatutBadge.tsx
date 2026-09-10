import { STATUTS_UNITE, STATUTS_NOTAIRE } from "@/lib/constants";
import { type StatutUnite, type StatutNotaire } from "@/lib/types";

interface StatutBadgeProps {
  statut: StatutUnite | StatutNotaire;
  type?: "unite" | "notaire";
  size?: "sm" | "md";
}

export function StatutBadge({ statut, type = "unite", size = "md" }: StatutBadgeProps) {
  let bg = "#f5f5f4";
  let textColor = "#888888";
  let label: string = statut;

  if (type === "unite") {
    const cfg = STATUTS_UNITE[statut as StatutUnite];
    if (cfg) { bg = cfg.bg; textColor = cfg.text; label = cfg.label; }
  } else {
    const cfg = STATUTS_NOTAIRE[statut as StatutNotaire];
    if (cfg) { bg = cfg.bg; textColor = cfg.text; label = cfg.label; }
  }

  return (
    <span
      style={{ backgroundColor: bg, color: textColor }}
      className={`inline-flex items-center rounded-md font-medium ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"}`}
    >
      {label}
    </span>
  );
}
