import { STATUTS_UNITE } from "@/lib/constants";
import { type StatutUnite } from "@/lib/types";

interface StatutBarProps {
  counts: Partial<Record<StatutUnite, number>>;
  total: number;
  showLabels?: boolean;
  height?: number;
}

const ORDERED_STATUTS: StatutUnite[] = ["DISPONIBLE", "OPTION", "RESERVE", "COMPROMIS", "NOTAIRE", "VENDU", "ANNULE", "DESISTE"];

export function StatutBar({ counts, total, showLabels = false, height = 8 }: StatutBarProps) {
  if (!total) return <div className="h-2 rounded-full bg-[#e8e6e1]" />;

  return (
    <div>
      <div className="flex rounded-full overflow-hidden" style={{ height }}>
        {ORDERED_STATUTS.map((statut) => {
          const count = counts[statut] || 0;
          if (!count) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={statut}
              title={`${STATUTS_UNITE[statut].label}: ${count}`}
              style={{ width: `${pct}%`, backgroundColor: STATUTS_UNITE[statut].color }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {ORDERED_STATUTS.map((statut) => {
            const count = counts[statut] || 0;
            if (!count) return null;
            return (
              <div key={statut} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUTS_UNITE[statut].color }} />
                <span className="text-xs text-[#888888]">{STATUTS_UNITE[statut].label}: <strong className="text-[#1a1a1a]">{count}</strong></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
