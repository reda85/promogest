"use client";
import { STATUTS_UNITE } from "@/lib/constants";
import { type StatutUnite } from "@/lib/types";

interface StatusFilterProps {
  counts?: Partial<Record<StatutUnite, number>>;
  selected?: StatutUnite | null;
  onSelect?: (statut: StatutUnite | null) => void;
  statuts?: StatutUnite[];
}

const ALL_STATUTS: StatutUnite[] = ["DISPONIBLE", "OPTION", "RESERVE", "COMPROMIS", "NOTAIRE", "VENDU", "ANNULE", "DESISTE"];

export function StatusFilter({ counts = {}, selected, onSelect, statuts = ALL_STATUTS }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect?.(null)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
          !selected ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e8e6e1] bg-white text-[#888888] hover:border-[#1a1a1a]"
        }`}
      >
        Tous {counts && <span className="font-bold">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>}
      </button>
      {statuts.map((statut) => {
        const cfg = STATUTS_UNITE[statut];
        const count = counts[statut];
        const isActive = selected === statut;
        return (
          <button
            key={statut}
            onClick={() => onSelect?.(isActive ? null : statut)}
            style={isActive ? { backgroundColor: cfg.bg, borderColor: cfg.color, color: cfg.color } : {}}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
              isActive ? "" : "border-[#e8e6e1] bg-white text-[#888888] hover:border-stone-300"
            }`}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
            {count !== undefined && <span className={`font-bold ${isActive ? "" : "text-[#1a1a1a]"}`}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
